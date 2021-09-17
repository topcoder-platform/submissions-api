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
const { originator, mimeType } = require('../../constants').busApiMeta
const dbhelper = require('./dbhelper')
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
          region: config.get('aws.AWS_REGION'),
          credentials: new AWS.EnvironmentCredentials('AWS')
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
 * @return {Object} Data fetched from ES based on the filters
 */
function * fetchFromES (query, resource) {
  const esClient = getEsClient()
  // Construct ES filter
  const filter = prepESFilter(query, resource)
  // Search with constructed filter
  logger.debug(`The elasticsearch query is ${JSON.stringify(filter)}`)
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
      Link: link
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

/**
 * Get legacy challenge id if the challenge id is uuid form
 * @param {String} challengeId Challenge ID
 * @returns {String} Legacy Challenge ID of the given challengeId
 */
function * getLegacyChallengeId (challengeId) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId)) {
    logger.debug(`${challengeId} detected as uuid. Fetching legacy challenge id`)
    const token = yield getM2Mtoken()
    try {
      const response = yield request.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
      if (_.get(response.body, 'legacy.pureV5')) {
        // pure V5 challenges don't have a legacy ID
        return null
      }
      const legacyId = parseInt(response.body.legacyId, 10)
      logger.debug(`Legacy challenge id is ${legacyId} for v5 challenge id ${challengeId}`)
      return legacyId
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      throw err
    }
  }
  return challengeId
}

/**
 * Get v5 challenge id (uuid) if legacy challenge id
 * @param {Integer} challengeId Challenge ID
 * @returns {String} v5 uuid Challenge ID of the given challengeId
 */
function * getV5ChallengeId (challengeId) {
  if (!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId))) {
    logger.debug(`${challengeId} detected as legacy challenge id. Fetching legacy challenge id`)
    const token = yield getM2Mtoken()
    try {
      const response = yield request.get(`${config.CHALLENGEAPI_V5_URL}?legacyId=${challengeId}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
      const v5Uuid = _.get(response, 'body[0].id')
      logger.debug(`V5 challenge id is ${v5Uuid} for legacy challenge id ${challengeId}`)
      return v5Uuid
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}?legacyId=${challengeId}`)
      throw err
    }
  }
  return challengeId
}

/*
 * Get submission phase ID of a challenge from Challenge API
 * @param challengeId Challenge ID
 * @returns {Integer} Submission phase ID of the given challengeId
 */
function * getSubmissionPhaseId (challengeId) {
  let phaseId = null
  let response
  challengeId = yield getV5ChallengeId(challengeId)

  try {
    logger.info(`Calling to challenge API to find submission phase Id for ${challengeId}`)
    const token = yield getM2Mtoken()
    response = yield request.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
    logger.info(`returned from finding submission phase Id for ${challengeId}`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
    logger.debug('Setting submissionPhaseId to Null')
    response = null
  }
  if (response) {
    const phases = _.get(response.body, 'phases', [])
    const checkPoint = _.filter(phases, { name: 'Checkpoint Submission', isOpen: true })
    const submissionPh = _.filter(phases, { name: 'Submission', isOpen: true })
    const finalFixPh = _.filter(phases, { name: 'Final Fix', isOpen: true })
    const approvalPh = _.filter(phases, { name: 'Approval', isOpen: true })
    if (checkPoint.length !== 0) {
      phaseId = checkPoint[0].phaseId
    } else if (submissionPh.length !== 0) {
      phaseId = submissionPh[0].phaseId
    } else if (finalFixPh.length !== 0) {
      phaseId = finalFixPh[0].phaseId
    } else if (approvalPh.length !== 0) {
      phaseId = approvalPh[0].phaseId
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
  let challengeDetails
  let resources

  const challengeId = yield getV5ChallengeId(subEntity.challengeId)

  // User can only create submission for themselves
  if (authUser.userId !== subEntity.memberId) {
    throw new errors.HttpStatusError(403, 'You are not allowed to submit on behalf of others')
  }

  const token = yield getM2Mtoken()

  try {
    logger.info(`Calling to challenge API for fetch phases and winners for ${challengeId}`)
    challengeDetails = yield request.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
    logger.info(`returned for ${challengeId} with ${JSON.stringify(challengeDetails)}`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
    logger.error(ex)
    throw new errors.HttpStatusError(503, `Could not fetch details of challenge with id ${challengeId}`)
  }

  try {
    resources = yield request.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
    logger.error(ex)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  // Get map of role id to role name
  const resourceRolesMap = yield getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${subEntity.challengeId}`)
  }

  if (resources && challengeDetails) {
    const currUserRoles = _.filter(resources.body, { memberHandle: authUser.handle })

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    // Get phases and winner detail from challengeDetails
    const phases = challengeDetails.body.phases

    // Check if the User is registered for the contest
    const submitters = _.filter(currUserRoles, { role: 'Submitter' })
    if (submitters.length === 0) {
      throw new errors.HttpStatusError(403, `Register for the contest before you can submit`)
    }

    const submissionPhaseId = yield getSubmissionPhaseId(subEntity.challengeId)

    if (submissionPhaseId == null) {
      throw new errors.HttpStatusError(403, 'You cannot create a submission in the current phase')
    }

    const currPhase = _.filter(phases, { phaseId: submissionPhaseId })

    if (currPhase[0].name === 'Final Fix' || currPhase[0].name === 'Approval') {
      // Check if the user created a submission in the Submission phase - only such users
      // will be allowed to submit during final phase
      const userSubmission = yield fetchFromES({
        challengeId,
        memberId: authUser.userId
      }, camelize('Submission'))

      // User requesting submission haven't made any submission - prevent them for creating one
      if (userSubmission.total === 0) {
        throw new errors.HttpStatusError(403, 'You are not expected to create a submission in the current phase')
      }
    }
  } else {
    // We don't have enough details to validate the access
    logger.debug('No enough details to validate the Permissions')
    throw new errors.HttpStatusError(503, `Not all information could be fetched about challenge with id ${subEntity.challengeId}`)
  }
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
  const challengeId = yield getV5ChallengeId(submission.challengeId)

  try {
    resources = yield request.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
    logger.error(ex)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  try {
    challengeDetails = yield request.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
    logger.error(ex)
    throw new errors.HttpStatusError(503, `Could not fetch details of challenge with id ${challengeId}`)
  }

  // Get map of role id to role name
  const resourceRolesMap = yield getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  if (resources && challengeDetails) {
    // Fetch all roles of the User pertaining to the current challenge
    const currUserRoles = _.filter(resources.body, { memberHandle: authUser.handle })

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    const subTrack = challengeDetails.body.legacy.subTrack

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
        const screeningPhaseStatus = getPhaseStatus('Screening', challengeDetails.body)
        const reviewPhaseStatus = getPhaseStatus('Review', challengeDetails.body)

        // Neither Screening Nor Review is Opened / Closed
        if (screeningPhaseStatus === 'Scheduled' && reviewPhaseStatus === 'Scheduled') {
          throw new errors.HttpStatusError(403, 'You can access the submission only when Screening / Review is open')
        }
      } else {
        const appealsResponseStatus = getPhaseStatus('Appeals Response', challengeDetails.body)

        // Appeals Response is not closed yet
        if (appealsResponseStatus !== 'Closed') {
          throw new errors.HttpStatusError(403, 'You cannot access other submissions before the end of Appeals Response phase')
        } else {
          const userSubmission = yield fetchFromES({
            challengeId: submission.challengeId,
            memberId: authUser.userId
          }, camelize('Submission'))
          // User requesting submission haven't made any submission
          if (userSubmission.total === 0) {
            throw new errors.HttpStatusError(403, 'You did not submit to the challenge!')
          }

          const reqSubmission = userSubmission.rows[0]
          // Only if the requestor has passing score, allow to download other submissions
          if (reqSubmission.reviewSummation && reqSubmission.reviewSummation[0].isPassing) {
            return true
          } else {
            throw new errors.HttpStatusError(403, 'You should have passed the review to access other member submissions!')
          }
        }
      }
    }
  } else {
    // We don't have enough details to validate the access
    logger.debug('No enough details to validate the Permissions')
    throw new errors.HttpStatusError(503, `Not all information could be fetched about challenge with id ${submission.challengeId}`)
  }
}

/*
 * Function to check user access to get a review
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @returns {Promise}
 */
function * checkReviewGetAccess (authUser, submission) {
  let resources
  let challengeDetails
  const token = yield getM2Mtoken()
  const challengeId = yield getV5ChallengeId(submission.challengeId)

  try {
    resources = yield request.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}`)
    logger.error(ex)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  try {
    challengeDetails = yield request.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
    logger.error(ex)
    return false
  }

  // Get map of role id to role name
  const resourceRolesMap = yield getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  if (resources && challengeDetails) {
    // Fetch all roles of the User pertaining to the current challenge
    const currUserRoles = _.filter(resources.body, { memberHandle: authUser.handle })

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    const subTrack = challengeDetails.body.legacy.subTrack

    // Check if the User is a Copilot, Manager or Observer for that contest
    const validRoles = ['Copilot', 'Manager', 'Observer']
    const passedRoles = currUserRoles.filter(a => validRoles.includes(a.role))
    if (passedRoles.length !== 0) {
      return true
    }

    // For Marathon Match, everyone can access review result
    if (subTrack === 'DEVELOP_MARATHON_MATCH') {
      logger.info('No access check for Marathon match')
      return true
    } else {
      const appealsResponseStatus = getPhaseStatus('Appeals Response', challengeDetails.body)

      // Appeals Response is not closed yet
      if (appealsResponseStatus !== 'Closed') {
        throw new errors.HttpStatusError(403, 'You cannot access the review before the end of the Appeals Response phase')
      }

      return true
    }
  } else {
    // We don't have enough details to validate the access
    logger.debug('No enough details to validate the Permissions')
    throw new errors.HttpStatusError(503, `Not all information could be fetched about challenge with id ${submission.challengeId}`)
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

/**
 * Wrapper function to post to bus api. Ensures that every event posted to bus api
 * is duplicated and posted to bus api again, but to a different "aggregate" topic
 * Also stores the original topic in the payload
 * @param {Object} payload Data that needs to be posted to the bus api
 */
function * postToBusApi (payload) {
  const busApiClient = getBusApiClient()
  const originalTopic = payload.topic

  yield busApiClient.postEvent(payload)

  // Post to aggregate topic
  payload.topic = config.get('KAFKA_AGGREGATE_TOPIC')

  // Store the original topic
  payload.payload.originalTopic = originalTopic

  yield busApiClient.postEvent(payload)
}

/**
 * Function to remove metadata details from reviews for members who shouldn't see them
 * @param  {Array} reviews The reviews to remove metadata from
 * @param  {Object} authUser The authenticated user details
 */
function cleanseReviews (reviews, authUser) {
  // Not a machine user
  if (!authUser.scopes) {
    logger.info('Not a machine user. Filtering reviews...')
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

/**
 * Function to get role id to role name map
 * @returns {Object|null} <Role Id, Role Name> map
 */
function * getRoleIdToRoleNameMap () {
  let resourceRoles
  let resourceRolesMap = null
  const token = yield getM2Mtoken()
  try {
    resourceRoles = yield request.get(`${config.RESOURCEAPI_V5_BASE_URL}/resource-roles`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resource-roles`)
    logger.error(ex)
    resourceRoles = null
  }
  if (resourceRoles) {
    resourceRolesMap = {}
    _.forEach(resourceRoles.body, resourceRole => {
      resourceRolesMap[resourceRole.id] = resourceRole.name
    })
  }
  return resourceRolesMap
}

/**
 * Function to get phase status of phases used in an active challenge
 * @param {String} phaseName the phase name for retrieving status
 * @param {Object} challengeDetails the challenge details
 * @returns {('Scheduled' | 'Open' | 'Closed' | 'Invalid')} status of the phase
 */
function getPhaseStatus (phaseName, challengeDetails) {
  const { phases } = challengeDetails
  const queriedPhaseIndex = _.findIndex(phases, phase => {
    return phase.name === phaseName
  })
  // Requested phase name could not be found in phases hence 'Invalid'
  if (queriedPhaseIndex === -1) {
    return 'Invalid'
  }
  // If requested phase name is open return 'Open'
  if (phases[queriedPhaseIndex].isOpen) {
    return 'Open'
  } else {
    const { actualEndDate } = phases[queriedPhaseIndex]
    if (!_.isEmpty(actualEndDate)) {
      const present = new Date().getTime()
      const actualDate = new Date(actualEndDate).getTime()
      if (present > actualDate) {
        return 'Closed'
      } else {
        return 'Scheduled'
      }
    } else {
      return 'Scheduled'
    }
  }
}

/**
 * Change challengeId to v5ChallengeId and legacyChallengeId to challengeId
 * @param {Object} submission
 */
function adjustSubmissionChallengeId (submission) {
  if (submission.challengeId && submission.legacyChallengeId) {
    submission.v5ChallengeId = submission.challengeId
    submission.challengeId = submission.legacyChallengeId
  }
}

/**
 * Get all latest challenges
 * @param {Number} page page index
 * @returns {Array} an array of challenge
 */
function * getLatestChallenges (page) {
  page = page || 1
  const token = yield getM2Mtoken()
  const url = `${config.CHALLENGEAPI_V5_URL}?createdDateStart=${config.FETCH_CREATED_DATE_START}&page=${page}&perPage=${config.FETCH_PAGE_SIZE}&isLightweight=true`
  try {
    const response = yield request.get(url)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
    const challenges = _.map(_.filter(_.get(response, 'body'), 'legacyId'), c => _.pick(c, 'id', 'legacyId'))
    logger.debug(`Fetched ${challenges.length} challenges in this iteration. More may follow...`)
    if (_.get(response, 'headers.x-total-pages') > page) {
      const leftChallenges = yield getLatestChallenges(page + 1)
      challenges.push(...leftChallenges)
    }
    return challenges
  } catch (err) {
    logger.error(`Error while accessing ${url}, message: ${err.message}`)
    return []
  }
}

/**
 * Get legacy scorecard id if the scorecard id is uuid form
 * @param {String} scoreCardId Scorecard ID
 * @returns {String} Legacy scorecard ID of the given challengeId
 */
function getLegacyScoreCardId (scoreCardId) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scoreCardId)) {
    logger.debug(`${scoreCardId} detected as uuid. Converting to legacy scorecard id`)

    return config.get('V5TOLEGACYSCORECARDMAPPING')[scoreCardId]
  }

  return scoreCardId
}

/**
 * Create a record in db and es
 * @param {String} tableName table name
 * @param {Object} item item to be inserted
 */
function * atomicCreateRecord (tableName, item) {
  const index = config.get('esConfig.ES_INDEX')
  const type = config.get('esConfig.ES_TYPE')
  const bulkData = [{create: {_index: index, _type: type, _id: item.id}}, _.assign({ resource: camelize(tableName) }, item)]
  const bulkRollBackData = [{delete: {_index: index, _type: type, _id: item.id}}]
  if (tableName === 'Review') {
    yield generateSubmissionFieldUpdate(item, 'review', 'create', bulkData, bulkRollBackData)
  } else if (tableName === 'ReviewSummation') {
    yield generateSubmissionFieldUpdate(item, 'reviewSummation', 'create', bulkData, bulkRollBackData)
  }
  yield atomicOperation(
    function * () {
      yield dbhelper.insertRecord({
        TableName: tableName,
        Item: item
      })
    },
    bulkData,
    bulkRollBackData,
    `${tableName}.create`,
    item
  )
}

/**
 * Update records in the database and es
 * @param {String} tableName table name
 * @param {Object} item update item
 * @param {Object} sourceItem source item
 * @param {Object} record update record
 * @param {Object} sourceAttributeValues source es value
 */
function * atomicUpdateRecord (tableName, item, sourceItem, record, sourceAttributeValues) {
  const index = config.get('esConfig.ES_INDEX')
  const type = config.get('esConfig.ES_TYPE')
  const bulkData = [{update: {_index: index, _type: type, _id: item.id}}, { doc: item }]
  const bulkRollBackData = [{update: {_index: index, _type: type, _id: item.id}}, { doc: sourceItem }]
  if (tableName === 'Review') {
    yield generateSubmissionFieldUpdate(item, 'review', 'update', bulkData, bulkRollBackData)
  } else if (tableName === 'ReviewSummation') {
    yield generateSubmissionFieldUpdate(item, 'reviewSummation', 'update', bulkData, bulkRollBackData)
  }
  yield atomicOperation(
    function * () {
      yield dbhelper.updateRecord(record)
    },
    bulkData,
    bulkRollBackData,
    `${tableName}.update`,
    item
  )
}

/**
 * Delete a record from dynamodb and es
 * @param {String} tableName table name
 * @param {Object} item delete record
 */
function * atomicDeleteRecord (tableName, item) {
  const index = config.get('esConfig.ES_INDEX')
  const type = config.get('esConfig.ES_TYPE')
  const bulkData = [{delete: {_index: index, _type: type, _id: item.id}}]
  const bulkRollBackData = [{create: {_index: index, _type: type, _id: item.id}}, _.assign({ resource: camelize(tableName) }, item)]
  if (tableName === 'Review') {
    yield generateSubmissionFieldUpdate(item, 'review', 'delete', bulkData, bulkRollBackData)
  } else if (tableName === 'ReviewSummation') {
    yield generateSubmissionFieldUpdate(item, 'reviewSummation', 'delete', bulkData, bulkRollBackData)
  }
  yield atomicOperation(
    function * () {
      yield dbhelper.deleteRecord({
        TableName: tableName,
        Key: {
          id: item.id
        }
      })
    },
    bulkData,
    bulkRollBackData,
    `${tableName}.delete`,
    item
  )
}

/**
 * Generate bulk data for submission field update
 * @param {Object} item update object
 * @param {String} property submission field name
 * @param {String} op operation type
 * @param {Array} bulkData bulk data
 * @param {Array} bulkRollBackData bulk rollback data
 */
function * generateSubmissionFieldUpdate (item, property, op, bulkData, bulkRollBackData) {
  const index = config.get('esConfig.ES_INDEX')
  const type = config.get('esConfig.ES_TYPE')
  const submission = yield getEsClient().getSource({
    index,
    type,
    id: item.submissionId
  })
  const newItem = _.filter(submission[property], i => i.id !== item.id)
  if (_.includes(['create', 'update'], op)) {
    newItem.push(item)
  }
  bulkData.push({update: {_id: item.submissionId, _index: index, _type: type}})
  bulkData.push({ doc: {[property]: newItem} })
  bulkRollBackData.push({update: {_id: item.submissionId, _index: index, _type: type}})
  bulkRollBackData.push({ doc: {[property]: submission[property]} })
}

/**
 * Operate db and es in atomic way
 * @param {Function} dbFunc db function
 * @param {Object} bulkData es bulk data
 * @param {Object} bulkRollBackData es rollback bulk data
 * @param {String} action operation name
 * @param {Object} payload error event payload
 */
function * atomicOperation (dbFunc, bulkData, bulkRollBackData, action, payload) {
  const esClient = getEsClient()
  let esInserted = false
  try {
    yield esClient.bulk({ refresh: 'wait_for', body: bulkData })
    esInserted = true
    yield dbFunc()
  } catch (err) {
    logger.error(`Error while running ${action} with id: ${payload.id}, try to rollback`)
    logger.error(err)
    try {
      if (esInserted) {
        yield esClient.bulk({ refresh: 'wait_for', body: bulkRollBackData })
        logger.info(`Rollback ${action} es with id: ${payload.id} success`)
      }
      logger.info(`Rollback ${action} with id: ${payload.id} success`)
    } catch (e) {
      logger.error(`Error while rolling back ${action} with id: ${payload.id}`)
      logger.error(e)
    }
    yield publishError(config.SUBMISSION_ERROR_TOPIC, action, payload)
    throw err
  }
}

/**
 * Send error event to Kafka
 * @param {String} topic the topic name
 * @param {String} action for which operation error occurred
 * @param {Object} payload the payload
 */
function * publishError (topic, action, payload) {
  _.set(payload, 'apiAction', action)
  const message = {
    topic,
    originator,
    timestamp: new Date().toISOString(),
    'mime-type': mimeType,
    payload
  }
  logger.debug(`Publish error to Kafka topic ${topic}, ${JSON.stringify(message, null, 2)}`)
  yield getBusApiClient().postEvent(message)
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getEsClient,
  fetchFromES,
  camelize,
  setPaginationHeaders,
  getLegacyChallengeId,
  getSubmissionPhaseId,
  checkCreateAccess,
  checkGetAccess,
  checkReviewGetAccess,
  downloadFile,
  postToBusApi,
  cleanseReviews,
  getRoleIdToRoleNameMap,
  getV5ChallengeId,
  adjustSubmissionChallengeId,
  getLatestChallenges,
  getLegacyScoreCardId,
  atomicCreateRecord,
  atomicUpdateRecord,
  atomicDeleteRecord
}
