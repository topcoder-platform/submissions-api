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
const httpStatus = require('http-status')
const tracer = require('./tracer')

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
    logger.debug(`Creating Bus API client for ${config.BUSAPI_URL} `)
    busApiClient = busApi(_.pick(config,
      ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME',
        'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'BUSAPI_URL',
        'KAFKA_ERROR_TOPIC', 'AUTH0_PROXY_SERVER_URL']))
  }

  logger.debug('returning Bus API client')
  return busApiClient
}

/**
 * Get ES Client
 * @return {Object} Elastic Host Client Instance
 */
function getEsClient () {
  const esHost = config.get('esConfig.HOST')
  if (!esClients.client) {
    // AWS ES configuration is different from other providers
    if (/.*amazonaws.*/.test(esHost)) {
      esClients.client = elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost,
        connectionClass: require('http-aws-es'), // eslint-disable-line global-require
        amazonES: {
          region: config.get('aws.AWS_REGION')
          // credentials: new AWS.EnvironmentCredentials('AWS')
        }
      })
    } else {
      esClients.client = new elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost
      })
    }
  }
  return esClients.client
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
  const { sortBy, orderBy } = query
  const filters = _.omit(query, ['perPage', 'page', 'sortBy', 'orderBy'])
  // Add match phrase filters for all query filters
  // except page, perPage, sortBy & orderBy
  const boolQuery = []
  const reviewFilters = []
  const reviewSummationFilters = []
  // Adding resource filter
  boolQuery.push({ match_phrase: { resource: actResource } })
  _.map(filters, (value, key) => {
    const pair = {}
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
        exclude: ['resource'] // Remove the resource field which is not required
      },
      query: {
        bool: {
          filter: boolQuery
        }
      }
    }
  }

  const esQuerySortArray = []

  if (sortBy) {
    const obj = {}
    obj[sortBy] = { order: orderBy || 'asc' }
    esQuerySortArray.push(obj)
  }

  // Internal sorting by 'updated' timestamp
  if (actResource !== 'reviewType') {
    esQuerySortArray.push({
      updated: { order: 'desc' }
    })
  }

  if (esQuerySortArray.length > 0) {
    searchCriteria.body.sort = esQuerySortArray
  }

  return searchCriteria
}

/*
 * Fetch data from ES and return to the caller
 * @param {Object} query Query filters passed in HTTP request
 * @param  {String} resource Resource name in ES
 * @param {Object} parentSpan the parentSpan object
 * @return {Object} Data fetched from ES based on the filters
 */
function * fetchFromES (query, resource, parentSpan) {
  const fetchFromESSpan = tracer.startChildSpans('helper.fetchFromES', parentSpan)
  fetchFromESSpan.log({
    event: 'info',
    query: query,
    resource: resource
  })

  try {
    const esClient = getEsClient()
    // Construct ES filter
    const filter = prepESFilter(query, resource)
    // Search with constructed filter
    console.log(JSON.stringify(yield esClient.indices.getMapping({ index: 'submission-index' })))
    const docs = yield esClient.search(filter)
    // Extract data from hits
    const rows = _.map(docs.hits.hits, single => single._source)

    const response = {
      total: docs.hits.total,
      pageSize: filter.size,
      page: query.page || 1,
      rows: rows
    }
    return response
  } catch (err) {
    fetchFromESSpan.setTag('error', true)
    throw err
  } finally {
    fetchFromESSpan.finish()
  }
}

/*
 * Set paginated header and respond with data
 * @param req HTTP request
 * @param res HTTP response
 * @param {Object} data Data for which pagination need to be applied
 */
function setPaginationHeaders (req, res, data) {
  let responseHeaders = {}
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
      responseHeaders['X-Prev-Page'] = prevPage
      res.set({ 'X-Prev-Page': prevPage })
      link += `, <${fullUrl}page=${prevPage}>; rel="prev"`
    }

    // Set Next-Page only if it's not Last page and within page limits
    if (data.page < totalPages) {
      const nextPage = (data.page + 1)
      responseHeaders['X-Next-Page'] = nextPage
      res.set({ 'X-Next-Page': nextPage })
      link += `, <${fullUrl}page=${nextPage}>; rel="next"`
    }

    let headerData = {
      'X-Page': data.page,
      'X-Per-Page': data.pageSize,
      'X-Total': data.total,
      'X-Total-Pages': totalPages,
      Link: link
    }
    _.assign(responseHeaders, headerData)
    res.set(headerData)
  }

  req.span.setTag('statusCode', httpStatus.OK)
  req.span.log({
    event: 'info',
    responseHeaders,
    responseBody: data.rows
  })
  req.span.finish()

  // Return the data after setting pagination headers
  res.json(data.rows)
}

/* Function to get M2M token
 * @param {Object} parentSpan the parentSpan object
 * @returns {Promise}
 */
function * getM2Mtoken (parentSpan) {
  const getM2MtokenSpan = tracer.startChildSpans('helper.getM2Mtoken', parentSpan)

  try {
    const token = yield m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
    return token
  } catch (err) {
    getM2MtokenSpan.setTag('error', true)
    throw err
  } finally {
    getM2MtokenSpan.finish()
  }
}

/*
 * Get submission phase ID of a challenge from Challenge API
 * @param challengeId Challenge ID
 * @param {Object} parentSpan the parent Span object
 * @returns {Integer} Submission phase ID of the given challengeId
 */
function * getSubmissionPhaseId (challengeId, parentSpan) {
  const getSubmissionPhaseIdSpan = tracer.startChildSpans('helper.getSubmissionPhaseId', parentSpan)
  getSubmissionPhaseIdSpan.setTag('challengeId', challengeId)

  try {
    let phaseId = null
    let response

    const token = yield getM2Mtoken(getSubmissionPhaseIdSpan)

    const getChallengePhasesSpan = tracer.startChildSpans('getChallengePhases', getSubmissionPhaseIdSpan)
    getChallengePhasesSpan.setTag('challengeId', challengeId)
    try {
      response = yield request.get(`${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    } catch (ex) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
      logger.debug('Setting submissionPhaseId to Null')
      response = null
      // log error
      getChallengePhasesSpan.log({
        event: 'error',
        error: ex.response ? ex.response.body : ex
      })
      getChallengePhasesSpan.setTag('error', true)
    } finally {
      getChallengePhasesSpan.finish()
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
  } finally {
    getSubmissionPhaseIdSpan.finish()
  }
}

/*
 * Function to check user access to create a submission
 * @param authUser Authenticated user
 * @param subEntity Submission Entity
 * @param {Object} parentSpan the parent Span object
 * @returns {Promise}
 */
function * checkCreateAccess (authUser, subEntity, parentSpan) {
  const checkCreateAccessSpan = tracer.startChildSpans('helper.checkCreateAccess', parentSpan)

  try {
    let response

    // User can only create submission for themselves
    if (authUser.userId !== subEntity.memberId) {
      throw new errors.HttpStatusError(403, 'You are not allowed to submit on behalf of others')
    }

    const token = yield getM2Mtoken(checkCreateAccessSpan)

    const getChallengeDetailSpan = tracer.startChildSpans('getChallengeDetail', checkCreateAccessSpan)
    getChallengeDetailSpan.setTag('challengeId', subEntity.challengeId)
    try {
      response = yield request.get(`${config.CHALLENGEAPI_URL}?filter=id=${subEntity.challengeId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    } catch (ex) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}?filter=id=${subEntity.challengeId}`)
      logger.error(ex)
      // log error
      getChallengeDetailSpan.log({
        event: 'error',
        error: ex.response.body
      })
      getChallengeDetailSpan.setTag('error', true)
      return false
    } finally {
      getChallengeDetailSpan.finish()
    }

    if (response) {
      // Get phases and winner detail from response
      const phases = response.body.result.content[0].allPhases
      const winner = response.body.result.content[0].winners

      const submissionPhaseId = yield getSubmissionPhaseId(subEntity.challengeId, checkCreateAccessSpan)

      if (submissionPhaseId == null) {
        throw new errors.HttpStatusError(403, 'You are not allowed to submit when submission phase is not open')
      }

      const currPhase = _.filter(phases, { id: submissionPhaseId })

      if (currPhase[0].phaseType === 'Final Fix') {
        if (!authUser.handle.equals(winner[0].handle)) {
          throw new errors.HttpStatusError(403, 'Only winner is allowed to submit during Final Fix phase')
        }
      }
    }

    return true
  } finally {
    checkCreateAccessSpan.finish()
  }
}

/*
 * Function to check user access to get a submission
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @param {Object} parentSpan the parent Span object
 * @returns {Promise}
 */
function * checkGetAccess (authUser, submission, parentSpan) {
  const checkGetAccessSpan = tracer.startChildSpans('helper.checkGetAccess', parentSpan)

  try {
    let resources
    let challengeDetails
    // Allow downloading Own submission
    if (submission.memberId === authUser.userId) {
      return true
    }

    const token = yield getM2Mtoken(checkGetAccessSpan)

    const getChallengeResourcesSpan = tracer.startChildSpans('getChallengeResources', checkGetAccessSpan)
    getChallengeResourcesSpan.setTag('challengeId', submission.challengeId)
    try {
      resources = yield request.get(`${config.CHALLENGEAPI_URL}/${submission.challengeId}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    } catch (ex) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}/${submission.challengeId}/resources`)
      logger.error(ex)
      // log error
      getChallengeResourcesSpan.log({
        event: 'error',
        error: ex.response.body
      })
      getChallengeResourcesSpan.setTag('error', true)
      return false
    } finally {
      getChallengeResourcesSpan.finish()
    }

    const getChallengeDetailSpan = tracer.startChildSpans('getChallengeDetail', checkGetAccessSpan)
    getChallengeDetailSpan.setTag('challengeId', submission.challengeId)
    try {
      challengeDetails = yield request.get(`${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    } catch (ex) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)
      logger.error(ex)
      // log error
      getChallengeDetailSpan.log({
        event: 'error',
        error: ex.response.body
      })
      getChallengeDetailSpan.setTag('error', true)
      return false
    } finally {
      getChallengeDetailSpan.finish()
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
          const screeningPhase = _.filter(phases, { phaseType: 'Screening', phaseStatus: 'Scheduled' })
          const reviewPhase = _.filter(phases, { phaseType: 'Review', phaseStatus: 'Scheduled' })

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
              memberId: authUser.userId }, camelize('Submission'), checkGetAccessSpan)
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
  } finally {
    checkGetAccessSpan.finish()
  }
}

/*
 * Function to check user access to get a review
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @param {Object} parentSpan the parent Span object
 * @returns {Promise}
 */
function * checkReviewGetAccess (authUser, submission, parentSpan) {
  let isAccessAllowed = false
  const checkReviewGetAccessSpan = tracer.startChildSpans('helper.checkReviewGetAccess', parentSpan)

  try {
    let challengeDetails
    const token = yield getM2Mtoken(checkReviewGetAccessSpan)

    const getChallengeDetailSpan = tracer.startChildSpans('getChallengeDetail', checkReviewGetAccessSpan)
    getChallengeDetailSpan.setTag('challengeId', submission.challengeId)
    try {
      challengeDetails = yield request.get(`${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
    } catch (ex) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}?filter=id=${submission.challengeId}`)

      // log error
      getChallengeDetailSpan.log({
        event: 'error',
        error: ex.response.body
      })
      getChallengeDetailSpan.setTag('error', true)
    } finally {
      getChallengeDetailSpan.finish()
    }

    if (challengeDetails) {
      const subTrack = challengeDetails.body.result.content[0].subTrack
      const phases = challengeDetails.body.result.content[0].allPhases

      // For Marathon Match, everyone can access review result
      if (subTrack === 'DEVELOP_MARATHON_MATCH') {
        logger.info('No access check for Marathon match')
        isAccessAllowed = true
      } else {
        const appealsResponse = _.filter(phases, { phaseType: 'Appeals Response', 'phaseStatus': 'Closed' })

        // Appeals Response is not closed yet
        if (appealsResponse.length === 0) {
          throw new errors.HttpStatusError(403, 'You cannot access the review before the end of the Appeals Response phase')
        }

        isAccessAllowed = true
      }
    }

    if (!isAccessAllowed) {
      throw new errors.HttpStatusError(403, 'You cannot access the review at this time')
    }
  } finally {
    checkReviewGetAccessSpan.finish()
  }
}

/**
 * Function to download file from given S3 URL
 * @param{String} fileURL S3 URL of the file to be downloaded
 * @param {Object} parentSpan the parent Span object
 * @returns {Buffer} Buffer of downloaded file
 */
function * downloadFile (fileURL, parentSpan) {
  const downloadFileSpan = tracer.startChildSpans('helper.downloadFile', parentSpan)
  downloadFileSpan.setTag('fileURL', fileURL)

  try {
    const { bucket, key } = AmazonS3URI(fileURL)
    logger.info(`downloadFile(): file is on S3 ${bucket} / ${key}`)
    const downloadedFile = yield s3.getObject({ Bucket: bucket, Key: key }).promise()
    return downloadedFile.Body
  } catch (err) {
    downloadFileSpan.setTag('error', true)
    throw err
  } finally {
    downloadFileSpan.finish()
  }
}

/**
 * Log the response on span
 * @param {Object} span the Span object
 * @param {Number} statusCode the status code
 * @param {Object|Array} the response body
 */
function logResultOnSpan (span, statusCode, result) {
  span.setTag('statusCode', statusCode)
  if (result) {
    span.log({
      event: 'info',
      responseBody: result
    })
  }
  span.finish()
}

/**
 * Wrapper function to post to bus api. Ensures that every event posted to bus api
 * is duplicated and posted to bus api again, but to a different "aggregate" topic
 * Also stores the original topic in the payload
 * @param {Object} payload Data that needs to be posted to the bus api
 * @param {Object} parentSpan the parentSpan object
 */
function * postToBusApi (payload, parentSpan) {
  const postToBusApiSpan = tracer.startChildSpans('helper.postToBusApi', parentSpan)
  postToBusApiSpan.log({
    event: 'info',
    message: payload
  })

  try {
    const busApiClient = getBusApiClient()
    const originalTopic = payload.topic

    yield busApiClient.postEvent(payload)

    // Post to aggregate topic
    payload.topic = config.get('KAFKA_AGGREGATE_TOPIC')

    // Store the original topic
    payload.payload.originalTopic = originalTopic

    yield busApiClient.postEvent(payload)
  } finally {
    postToBusApiSpan.finish()
  }
}

/**
 * Function to remove metadata details from reviews for members who shouldn't see them
 * @param  {Array} reviews The reviews to remove metadata from
 * @param  {Object} authUser The authenticated user details
 */
function cleanseReviews (reviews, authUser) {
  // Not a machine user
  if (!authUser.scopes) {
    const admin = _.filter(authUser.roles, role => role.toLowerCase() === 'Administrator'.toLowerCase())
    const copilot = _.filter(authUser.roles, role => role.toLowerCase() === 'Copilot'.toLowerCase())

    // User is neither admin nor copilot
    if (admin.length === 0 && copilot.length === 0) {
      const cleansedReviews = []

      _.forEach(reviews, (review) => {
        if (review && review.metadata && review.metadata.private) {
          _.unset(review.metadata, 'private')
        } else {
          // For backward compatibility, we remove metadata object entirely
          // from reviews where metadata does not have an explicit
          // "private" attribute
          _.unset(review, 'metadata')
        }
        cleansedReviews.push(review)
      })

      return cleansedReviews
    }
  }

  return reviews
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getEsClient,
  fetchFromES,
  camelize,
  setPaginationHeaders,
  getSubmissionPhaseId,
  checkCreateAccess,
  checkGetAccess,
  checkReviewGetAccess,
  downloadFile,
  postToBusApi,
  cleanseReviews,
  logResultOnSpan
}
