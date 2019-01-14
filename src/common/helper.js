/**
 * Contains generic helper methods
 */

global.Promise = require('bluebird')
const _ = require('lodash')
const AWS = require('aws-sdk')
const AmazonS3URI = require('amazon-s3-uri')
const co = require('co')
const config = require('config')
const elasticsearch = require('elasticsearch')
const logger = require('./logger')
const request = require('superagent')
const busApi = require('tc-bus-api-wrapper')
const errors = require('common-errors')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))

Promise.promisifyAll(request)

AWS.config.region = config.get('aws.AWS_REGION')
const s3 = new AWS.S3()
// ES Client mapping
const esClients = {}

// Bus API Client
let busApiClient

/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress (fn) {
  return function wrap (req, res, next) {
    co(fn(req, res, next)).catch(next)
  }
}

/**
 * Wrap all generators from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress (obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'GeneratorFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
        obj[key] = autoWrapExpress(value); //eslint-disable-line
  })
  return obj
}

/**
 * Get Bus API Client
 * @return {Object} Bus API Client Instance
*/
function getBusApiClient () {
  // If there is no Client instance, Create a new instance
  if (!busApiClient) {
    busApiClient = busApi(_.pick(config,
      ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME',
        'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'BUSAPI_URL',
        'KAFKA_ERROR_TOPIC']))
  }

  return busApiClient
}

/**
 * Get ES Client
 * @return {Object} Elastic Host Client Instance
 */
function getEsClient () {
  const esHost = config.get('esConfig.HOST')
  if (!esClients['client']) {
    // AWS ES configuration is different from other providers
    if (/.*amazonaws.*/.test(esHost)) {
      esClients['client'] = elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost,
        connectionClass: require('http-aws-es'), // eslint-disable-line global-require
        amazonES: {
          region: config.get('aws.AWS_REGION'),
          credentials: new AWS.EnvironmentCredentials('AWS')
        }
      })
    } else {
      esClients['client'] = new elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost
      })
    }
  }
  return esClients['client']
}

/*
 * Convert the input string into camelCase
 * @param str Input string
 * @returns string String converted into camelCase
 */
function camelize (str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return '' // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase()
  })
}

/**
 * Parse the Query filters and prepare ES filter
 * @param  {Object} query Query filters passed in HTTP request
 * @param  {String} actResource Resource name in ES
 * @return {Object} search request body that can be passed to ES
 */
function prepESFilter (query, actResource) {
  const pageSize = query.perPage || config.get('PAGE_SIZE')
  const page = query.page || 1
  const filters = _.omit(query, ['perPage', 'page'])
  // Add match phrase filters for all query filters except page and perPage
  const boolQuery = []
  const reviewFilters = []
  const reviewSummationFilters = []
  // Adding resource filter
  boolQuery.push({ match_phrase: { resource: actResource } })
  _.map(filters, (value, key) => {
    let pair = {}
    pair[key] = value
    if (key.indexOf('.') > -1) {
      const resKey = key.split('.')[0]
      if (resKey === 'review') {
        reviewFilters.push({ match_phrase: pair })
      } else if (resKey === 'reviewSummation') {
        reviewSummationFilters.push({ match_phrase: pair })
      }
    } else {
      boolQuery.push({ match_phrase: pair })
    }
  })

  if (reviewFilters.length !== 0) {
    boolQuery.push({
      nested: {
        path: 'review',
        query: {
          bool: {
            filter: reviewFilters
          }
        }
      }
    })
  }

  if (reviewSummationFilters.length !== 0) {
    boolQuery.push({
      nested: {
        path: 'reviewSummation',
        query: {
          bool: {
            filter: reviewSummationFilters
          }
        }
      }
    })
  }

  const searchCriteria = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    size: pageSize,
    from: (page - 1) * pageSize, // Es Index starts from 0
    body: {
      _source: {
        exclude: [ 'resource' ] // Remove the resource field which is not required
      },
      query: {
        bool: {
          filter: boolQuery
        }
      }
    }
  }

  // Add sorting for submission
  if (actResource === 'submission') {
    searchCriteria.body.sort = [
      { 'created': { 'order': 'asc' } }
    ]
  }

  return searchCriteria
}

/*
 * Fetch data from ES and return to the caller
 * @param {Object} query Query filters passed in HTTP request
 * @param  {String} resource Resource name in ES
 * @return {Object} Data fetched from ES based on the filters
 */
function * fetchFromES (query, resource) {
  const esClient = getEsClient()
  // Construct ES filter
  const filter = prepESFilter(query, resource)
  // Search with constructed filter
  const docs = yield esClient.search(filter)
  // Extract data from hits
  const rows = _.map(docs.hits.hits, single => single._source)

  const response = { 'total': docs.hits.total,
    'pageSize': filter.size,
    'page': query.page || 1,
    'rows': rows }
  return response
}

/*
 * Set paginated header and respond with data
 * @param req HTTP request
 * @param res HTTP response
 * @param {Object} data Data for which pagination need to be applied
 */
function setPaginationHeaders (req, res, data) {
  const totalPages = Math.ceil(data.total / data.pageSize)
  let fullUrl = req.protocol + '://' + req.get('host') + req.url.replace(`&page=${data.page}`, '')
  // URL formatting to add pagination parameters accordingly
  if (fullUrl.indexOf('?') === -1) {
    fullUrl += '?'
  } else {
    fullUrl += '&'
  }

  // Pagination follows github style
  if (data.total > 0) { // Set Pagination headers only if there is data to paginate
    let link = '' // Content for Link header

    // Set first and last page in Link header
    link += `<${fullUrl}page=1>; rel="first"`
    link += `, <${fullUrl}page=${totalPages}>; rel="last"`

    // Set Prev-Page only if it's not first page and within page limits
    if (data.page > 1 && data.page <= totalPages) {
      const prevPage = (data.page - 1)
      res.set({
        'X-Prev-Page': prevPage
      })
      link += `, <${fullUrl}page=${prevPage}>; rel="prev"`
    }

    // Set Next-Page only if it's not Last page and within page limits
    if (data.page < totalPages) {
      const nextPage = (data.page + 1)
      res.set({
        'X-Next-Page': (data.page + 1)
      })
      link += `, <${fullUrl}page=${nextPage}>; rel="next"`
    }

    res.set({
      'X-Page': data.page,
      'X-Per-Page': data.pageSize,
      'X-Total': data.total,
      'X-Total-Pages': totalPages,
      'Link': link
    })
  }
  // Return the data after setting pagination headers
  res.json(data.rows)
}

/* Function to get M2M token
 * @returns {Promise}
 */
function * getM2Mtoken () {
  return yield m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/*
 * Get submission phase ID of a challenge from Challenge API
 * @param challengeId Challenge ID
 * @returns {Integer} Submission phase ID of the given challengeId
 */
function * getSubmissionPhaseId (challengeId) {
  let phaseId = null
  let response
  try {
    const token = yield getM2Mtoken()
    response = yield request.get(`${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
    logger.debug('Setting submissionPhaseId to Null')
    response = null
  }
  if (response) {
    const phases = _.get(response.body, 'result.content', [])
    const checkPoint = _.filter(phases, {phaseType: 'Checkpoint Submission', phaseStatus: 'Open'})
    const submissionPh = _.filter(phases, {phaseType: 'Submission', phaseStatus: 'Open'})
    const finalFixPh = _.filter(phases, {phaseType: 'Final Fix', phaseStatus: 'Open'})
    if (checkPoint.length !== 0) {
      phaseId = checkPoint[0].id
    } else if (submissionPh.length !== 0) {
      phaseId = submissionPh[0].id
    } else if (finalFixPh.length !== 0) {
      phaseId = finalFixPh[0].id
    }
  }
  return phaseId
}

/*
 * Function to check user access to create a submission
 * @param authUser Authenticated user
 * @param subEntity Submission Entity
 * @returns {Promise}
 */
function * checkCreateAccess (authUser, subEntity) {
  let response

  // User can only create submission for themselves
  if (authUser.userId !== subEntity.memberId) {
    throw new errors.HttpStatusError(403, 'You are not allowed to submit on behalf of others')
  }

  try {
    const token = yield getM2Mtoken()
    response = yield request.get(`${config.CHALLENGEAPI_URL}?filter=id=${subEntity.challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}?filter=id=${subEntity.challengeId}`)
    logger.error(ex)
    return false
  }

  if (response) {
    // Get phases and winner detail from response
    const phases = response.body.result.content[0].allPhases
    const winner = response.body.result.content[0].winners

    const submissionPhaseId = yield getSubmissionPhaseId(subEntity.challengeId)

    if (submissionPhaseId == null) {
      throw new errors.HttpStatusError(403, 'You are not allowed to submit when submission phase is not open')
    }

    const currPhase = _.filter(phases, {id: submissionPhaseId})

    if (currPhase[0].phaseType === 'Final Fix') {
      if (!authUser.handle.equals(winner[0].handle)) {
        throw new errors.HttpStatusError(403, 'Only winner is allowed to submit during Final Fix phase')
      }
    }
  }

  return true
}

/*
 * Function to check user access to get a submission
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @returns {Promise}
 */
function * checkGetAccess (authUser, submission) {
  let resources
  let challengeDetails
  // Allow downloading Own submission
  if (submission.memberId === authUser.userId) {
    return true
  }

  const token = yield getM2Mtoken()

  try {
    resources = yield request.get(`${config.CHALLENGEAPI_URL}/${submission.challengeId}/resources`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}/${submission.challengeId}/resources`)
    logger.error(ex)
    return false
  }

  try {
    challengeDetails = yield request.get(`${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)
    logger.error(ex)
    return false
  }

  if (resources && challengeDetails) {
    // Fetch all roles of the User pertaining to the current challenge
    const currUserRoles = _.filter(resources.body.result.content, { properties: { Handle: authUser.handle } })
    const subTrack = challengeDetails.body.result.content[0].subTrack
    const phases = challengeDetails.body.result.content[0].allPhases

    // Check if the User is a Copilot
    const copilot = _.filter(currUserRoles, { role: 'Copilot' })
    // Copilot have access to all submissions regardless of Phases
    if (copilot.length !== 0) {
      return true
    }
    // Check for Reviewer / Submitter roles
    if (subTrack === 'FIRST_2_FINISH') {
      const iterativeReviewer = _.filter(currUserRoles, { role: 'Iterative Reviewer' })
      // If the User is a Iterative Reviewer return the submission
      if (iterativeReviewer.length !== 0) {
        return true
      } else { // In F2F, Member cannot access other memeber submissions
        throw new errors.HttpStatusError(403, 'You cannot access other member submission')
      }
    } else { // For other sub tracks, check if the Review / Screening phase is not scheduled
      const screener = _.filter(currUserRoles, { role: 'Primary Screener' })
      const reviewer = _.filter(currUserRoles, { role: 'Reviewer' })

      // User is either a Reviewer or Screener
      if (screener.length !== 0 || reviewer.length !== 0) {
        const screeningPhase = _.filter(phases, { phaseType: 'Screening', 'phaseStatus': 'Scheduled' })
        const reviewPhase = _.filter(phases, { phaseType: 'Review', 'phaseStatus': 'Scheduled' })

        // Neither Screening Nor Review is Opened / Closed
        if (screeningPhase.length !== 0 && reviewPhase.length !== 0) {
          throw new errors.HttpStatusError(403, 'You can access the submission only when Screening / Review is open')
        }
      } else {
        const appealsResponse = _.filter(phases, { phaseType: 'Appeals Response', 'phaseStatus': 'Closed' })

        // Appeals Response is not closed yet
        if (appealsResponse.length === 0) {
          throw new errors.HttpStatusError(403, 'You cannot access other submissions before the end of Appeals Response phase')
        } else {
          const userSubmission = yield fetchFromES({ challengeId: submission.challengeId,
            memberId: authUser.userId }, camelize('Submission'))
          // User requesting submission haven't made any submission
          if (userSubmission.total === 0) {
            throw new errors.HttpStatusError(403, `You did not submit to the challenge!`)
          }

          const reqSubmission = userSubmission.rows[0]
          // Only if the requestor has passing score, allow to download other submissions
          if (reqSubmission.reviewSummation && reqSubmission.reviewSummation[0].isPassing) {
            return true
          } else {
            throw new errors.HttpStatusError(403, `You should have passed the review to access other member submissions!`)
          }
        }
      }
    }
  } else {
    // We don't have enough details to validate the access
    logger.debug('No enough details to validate the Permissions')
    return true
  }
}

/**
 * Function to download file from given S3 URL
 * @param{String} fileURL S3 URL of the file to be downloaded
 * @returns {Buffer} Buffer of downloaded file
 */
function * downloadFile (fileURL) {
  const { bucket, key } = AmazonS3URI(fileURL)
  logger.info(`downloadFile(): file is on S3 ${bucket} / ${key}`)
  const downloadedFile = yield s3.getObject({ Bucket: bucket, Key: key }).promise()
  return downloadedFile.Body
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getEsClient,
  getBusApiClient,
  fetchFromES,
  camelize,
  setPaginationHeaders,
  getSubmissionPhaseId,
  checkCreateAccess,
  checkGetAccess,
  downloadFile
}
