/**
 * Contains generic helper methods
 */

global.Promise = require('bluebird')
const _ = require('lodash')
const AWS = require('aws-sdk')
const AmazonS3URI = require('amazon-s3-uri')
const config = require('config')
const opensearch = require('@opensearch-project/opensearch')
const logger = require('./logger')
const busApi = require('tc-bus-api-wrapper')
const errors = require('common-errors')
const { validate: uuidValidate } = require('uuid')
const NodeCache = require('node-cache')
const { axiosInstance } = require('./axiosInstance')
const { UserRoles, ProjectRoles } = require('../constants')

AWS.config.region = config.get('aws.AWS_REGION')
const s3 = new AWS.S3()
// OS Client mapping
const osClients = {}

const REVIEW_TYPES_KEY = 'ReviewTypes'

// Bus API Client
let busApiClient

const internalCache = new NodeCache({ stdTTL: config.INTERNAL_CACHE_TTL })

/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress (fn) {
  return function wrap (req, res, next) {
    fn(req, res, next).catch(next)
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
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
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
 * @return {Object} Open search Host Client Instance
 */
function getOsClient () {
  if (!osClients.client) {
    osClients.client = new opensearch.Client({ node: config.get('osConfig.HOST') })
  }
  return osClients.client
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

/*
 * Gets the review types from the v5 API.  Used when mapping legacy reviews to the v5 submission reviews
  * @returns object Array of review types
 */
async function getReviewTypes () {
  const cacheValue = getFromInternalCache(REVIEW_TYPES_KEY)
  if (cacheValue) {
    return cacheValue
  } else {
    let reviewTypes = null
    reviewTypes = await fetchFromES({ perPage: 100 }, camelize('ReviewType'))
    reviewTypes = reviewTypes.rows
    if (reviewTypes) {
      setToInternalCache(REVIEW_TYPES_KEY, reviewTypes)
    }
    return reviewTypes
  }
}

/*
 * Returns the review type ID for the given legacy scorecard name
  * @returns string Review type ID GUID matching the scorecard name
 */
async function getReviewTypeId (scorecardName) {
  const reviewTypes = await getReviewTypes()
  for (const reviewType of reviewTypes) {
    if (reviewType.name === scorecardName) {
      logger.info(`Looking for: ${scorecardName}, found: ${JSON.stringify(reviewType, null, 4)}`)
      return reviewType.id
    }
  }
  logger.info(`Looking for: ${scorecardName}, found NO MATCH`)
  return null
}

/**
 * Parse the Query filters and prepare OS filter
 * @param  {Object} query Query filters passed in HTTP request
 * @param  {String} actResource Resource name in OS
 * @return {Object} search request body that can be passed to OS
 */
function prepOSFilter (query, actResource) {
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
    size: pageSize,
    from: (page - 1) * pageSize, // OS Index starts from 0
    _source: {
      exclude: ['resource'] // Remove the resource field which is not required
    },
    query: {
      bool: {
        filter: boolQuery
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
    searchCriteria.sort = esQuerySortArray
  }

  return searchCriteria
}

/**
 * Fetch data from ES and return to the caller
 * @param {Object} query Query filters passed in HTTP request
 * @param  {String} resource Resource name in ES
 * @return {Promise<Object>} Data fetched from ES based on the filters
 */
async function fetchFromES (query, resource) {
  const osClient = getOsClient()
  // Construct OS filter
  const filter = prepOSFilter(query, resource)
  // Search with constructed filter
  logger.debug(`The opensearch query is ${JSON.stringify(filter)}`)
  const docs = await osClient.search({
    index: config.get('osConfig.OS_INDEX'),
    body: filter
  })

  // Extract data from hits
  const rows = _.map(docs.body.hits.hits, single => single._source)

  const response = {
    total: docs.body.hits.total.value,
    pageSize: filter.size,
    page: query.page || 1,
    rows
  }
  return response
}

/**
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

/**
 * Get challenge resources
 * @param {String} challengeId the challenge id
 * @param {String} userId specific userId for which to check roles
 */
const getChallengeResources = async (challengeId, userId) => {
  let resourcesResponse

  // Get map of role id to role name
  const resourceRolesMap = await getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  const resourcesUrl = `${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}${userId ? `&memberId=${userId}` : ''}`
  try {
    resourcesResponse = _.get(await axiosInstance.get(resourcesUrl), 'data', [])
  } catch (ex) {
    logger.error(`Error while accessing ${resourcesUrl}`)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  const resources = {}
  _.each((resourcesResponse || []), (resource) => {
    if (!resources[resource.memberId]) {
      resources[resource.memberId] = {
        memberId: resource.memberId,
        memberHandle: resource.memberHandle,
        roles: []
      }
    }
    resources[resource.memberId].roles.push(resourceRolesMap[resource.roleId])
  })
  return resources
}

/**
 * Function to get challenge by id
 * @param {String} challengeId Challenge id
 * @returns {Promise}
 */
async function getChallenge (challengeId) {
  if (uuidValidate(challengeId)) {
    logger.debug(`${challengeId} detected as uuid. Fetching legacy challenge id`)
    try {
      const response = await axiosInstance.get(`${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      return response.data
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      throw errors.HttpStatusError(err.status || 500, `Cannot get challenge with id=${challengeId}`)
    }
  } else {
    logger.debug(`${challengeId} detected as legacy challenge id. Fetching legacy challenge id`)
    try {
      const response = await axiosInstance.get(`${config.CHALLENGEAPI_V5_URL}?legacyId=${challengeId}`)
      return response.data[0]
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}?legacyId=${challengeId}`)
      throw errors.HttpStatusError(err.status || 500, `Cannot get challenge with id=${challengeId}`)
    }
  }
}

async function advanceChallengePhase (challengeId, phase, operation, numAttempts = 1) {
  if (!challengeId || !phase || !operation) {
    throw new Error('Invalid arguments')
  }

  try {
    console.log(`[Advance-Phase]: Initiating challenge ${challengeId}. Phase: ${phase}. Operation: ${operation}`)

    const response = await axiosInstance.post(`${config.CHALLENGEAPI_V5_URL}/${challengeId}/advance-phase`, {
      phase,
      operation
    })

    if (response.status !== 200) {
      throw new Error(`Received status code ${response.status}`)
    }

    console.log(`[Advance-Phase]: Successfully advanced challenge ${challengeId}. Phase: ${phase}. Operation: ${operation}. With response: ${JSON.stringify(response.data)}`)
    return response.data
  } catch (err) {
    logger.warn(`[Advance-Phase]: Failed to advance challenge ${challengeId}. Error: ${JSON.stringify(err)}`)

    if (numAttempts <= 3) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(advanceChallengePhase(challengeId, phase, operation, ++numAttempts))
        }, 5000)
      })
    }
  }
}

/**
 * Get v5 challenge id (uuid) if legacy challenge id
 * @param {Integer} challengeId Challenge ID
 * @returns {Promise<String|undefined>} v5 uuid Challenge ID of the given challengeId
 */
async function getV5ChallengeId (challengeId) {
  if (!(uuidValidate(challengeId))) {
    const challenge = await getChallenge(challengeId)
    if (challenge) {
      return challenge.id
    } else {
      return undefined
    }
  }
  return challengeId
}

/**
 * Get submission phase ID of a challenge from Challenge API
 * @param challenge Challenge
 * @returns {Integer} Submission phase ID of the given challengeId
 */
function getSubmissionPhaseId (challenge) {
  let phaseId = null
  if (challenge) {
    const phases = _.get(challenge, 'phases', [])
    const checkPoint = _.filter(phases, { name: 'Checkpoint Submission', isOpen: true })
    const submissionPh = _.filter(phases, { name: 'Submission', isOpen: true })
    const openPh = _.filter(phases, { name: 'Open', isOpen: true })
    const finalFixPh = _.filter(phases, { name: 'Final Fix', isOpen: true })
    const approvalPh = _.filter(phases, { name: 'Approval', isOpen: true })
    if (checkPoint.length !== 0) {
      phaseId = checkPoint[0].phaseId
    } else if (submissionPh.length !== 0) {
      phaseId = submissionPh[0].phaseId
    } else if (openPh.length !== 0) {
      phaseId = openPh[0].phaseId
    } else if (finalFixPh.length !== 0) {
      phaseId = finalFixPh[0].phaseId
    } else if (approvalPh.length !== 0) {
      phaseId = approvalPh[0].phaseId
    }
  }
  return phaseId
}

/**
 * Function to check user access to create a submission
 * @param authUser Authenticated user
 * @param memberId Member Id of the submitter
 * @param challengeDetails Challenge
 * @returns {Promise}
 */
async function checkCreateAccess (authUser, memberId, challengeDetails) {
  let resources

  const challengeId = challengeDetails.id

  // User can only create submission for themselves
  if (authUser.userId !== memberId) {
    throw new errors.HttpStatusError(403, 'You are not allowed to submit on behalf of others')
  }

  try {
    resources = await axiosInstance.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  // Get map of role id to role name
  const resourceRolesMap = await getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  if (resources && challengeDetails) {
    const currUserRoles = _.get(resources, 'data', [])

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    // Get phases and winner detail from challengeDetails
    const { phases } = challengeDetails

    // Check if the User is assigned as the reviewer for the contest
    const reviewers = _.filter(currUserRoles, { role: 'Reviewer' })
    if (reviewers.length !== 0) {
      throw new errors.HttpStatusError(400, 'You cannot create a submission for a challenge while you are a reviewer')
    }

    // Check if the User is assigned as the iterative reviewer for the contest
    const iterativeReviewers = _.filter(currUserRoles, { role: 'Iterative Reviewer' })
    if (iterativeReviewers.length !== 0) {
      throw new errors.HttpStatusError(400, 'You cannot create a submission for a challenge while you are an iterative reviewer')
    }

    // Check if the User is registered for the contest
    const submitters = _.filter(currUserRoles, { role: 'Submitter' })
    if (submitters.length === 0) {
      throw new errors.HttpStatusError(403, 'Register for the contest before you can submit')
    }

    const submissionPhaseId = getSubmissionPhaseId(challengeDetails)

    if (submissionPhaseId == null) {
      throw new errors.HttpStatusError(403, 'You cannot create a submission in the current phase')
    }

    const currPhase = _.filter(phases, { phaseId: submissionPhaseId })

    if (currPhase[0].name === 'Final Fix' || currPhase[0].name === 'Approval') {
      // Check if the user created a submission in the Submission phase - only such users
      // will be allowed to submit during final phase
      const userSubmission = await fetchFromES({
        challengeId,
        memberId
      }, camelize('Submission'))

      // User requesting submission haven't made any submission - prevent them for creating one
      if (userSubmission.total === 0) {
        throw new errors.HttpStatusError(403, 'You are not expected to create a submission in the current phase')
      }
    }
  } else {
    // We don't have enough details to validate the access
    logger.debug('No enough details to validate the Permissions')
    throw new errors.HttpStatusError(503, `Not all information could be fetched about challenge with id ${challengeId}`)
  }
}

/**
 * Check the user's access to a challenge
 * @param {Object} authUser the user
 * @param {Array} resources the challenge resources
 */
async function getChallengeAccessLevel (authUser, challengeId) {
  if (authUser.isMachine) {
    return { hasFullAccess: true }
  }

  const resources = await getChallengeResources(challengeId, authUser.userId)

  // Case Insensitive Role checks
  const hasFullAccess = authUser.roles.findIndex(item => UserRoles.Admin.toLowerCase() === item.toLowerCase()) > -1 || _.intersectionWith(_.get(resources[authUser.userId], 'roles', []), [
    ProjectRoles.Manager,
    ProjectRoles.Copilot,
    ProjectRoles.Observer,
    ProjectRoles.Client_Manager
  ], (act, exp) => act.toLowerCase() === exp.toLowerCase()).length > 0

  const isReviewer = !hasFullAccess && _.intersectionWith(_.get(resources[authUser.userId], 'roles', []), [
    ProjectRoles.Reviewer,
    ProjectRoles.Iterative_Reviewer
  ], (act, exp) => act.toLowerCase() === exp.toLowerCase()).length > 0

  const isSubmitter = !hasFullAccess && !isReviewer && _.intersectionWith(_.get(resources[authUser.userId], 'roles', []), [
    ProjectRoles.Submitter
  ], (act, exp) => act.toLowerCase() === exp.toLowerCase()).length > 0

  const hasNoAccess = !hasFullAccess && !isReviewer && !isSubmitter

  return { hasFullAccess, isReviewer, isSubmitter, hasNoAccess }
}

/**
 * Function to check user access to get a submission
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @returns {Promise}
 */
async function checkGetAccess (authUser, submission) {
  let resources
  let challengeDetails
  let challengeId
  // Allow downloading Own submission
  if (submission.memberId === authUser.userId) {
    return true
  }

  try {
    challengeDetails = await getChallenge(submission.challengeId)
    challengeId = challengeDetails.id
  } catch (ex) {
    throw new errors.HttpStatusError(503, `Could not fetch details of challenge with id ${submission.challengeId}`)
  }

  try {
    resources = await axiosInstance.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  // Get map of role id to role name
  const resourceRolesMap = await getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  if (resources && challengeDetails) {
    // Fetch all roles of the User pertaining to the current challenge
    const currUserRoles = _.get(resources, 'data', [])

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    const subTrack = challengeDetails.legacy.subTrack

    // Check if the User is a Copilot
    const copilot = _.filter(currUserRoles, { role: 'Copilot' })
    // Copilot have access to all submissions regardless of Phases
    if (copilot.length !== 0) {
      return true
    }
    // Check if the User is a Client Manager
    const clientManager = _.filter(currUserRoles, { role: 'Client Manager' })
    // Client Managers have access to all submissions regardless of Phases
    if (clientManager.length !== 0) {
      return true
    }

    // Check if the User is a Manager
    const manager = _.filter(currUserRoles, { role: 'Manager' })
    // Managers have access to all submissions regardless of Phases
    if (manager.length !== 0) {
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
        const screeningPhaseStatus = getPhaseStatus('Screening', challengeDetails)
        const reviewPhaseStatus = getPhaseStatus('Review', challengeDetails)

        // Neither Screening Nor Review is Opened / Closed
        if (screeningPhaseStatus === 'Scheduled' && reviewPhaseStatus === 'Scheduled') {
          throw new errors.HttpStatusError(403, 'You can access the submission only when Screening / Review is open')
        }
      } else {
        const appealsResponseStatus = getPhaseStatus('Appeals Response', challengeDetails)

        // Appeals Response is not closed yet
        if (appealsResponseStatus !== 'Closed' && appealsResponseStatus !== 'Invalid') {
          throw new errors.HttpStatusError(403, 'You cannot access other submissions before the end of Appeals Response phase')
        } else {
          const userSubmission = await fetchFromES({
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

/**
 * Function to check user access to get a review
 * @param authUser Authenticated user
 * @param submission Submission Entity
 * @returns {Promise}
 */
async function checkReviewGetAccess (authUser, submission) {
  let resources
  let challengeDetails
  let challengeId
  try {
    challengeDetails = await getChallenge(submission.challengeId)
    challengeId = challengeDetails.id
  } catch (ex) {
    return false
  }

  try {
    resources = await axiosInstance.get(`${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resources?challengeId=${challengeId}&memberId=${authUser.userId}`)
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  // Get map of role id to role name
  const resourceRolesMap = await getRoleIdToRoleNameMap()

  // Check if role id to role name mapping is available. If not user's role cannot be determined.
  if (resourceRolesMap == null || _.size(resourceRolesMap) === 0) {
    throw new errors.HttpStatusError(503, `Could not determine the user's role in the challenge with id ${challengeId}`)
  }

  if (resources && challengeDetails) {
    // Fetch all roles of the User pertaining to the current challenge
    const currUserRoles = _.get(resources, 'data', [])

    // Populate the role names for the current user role ids
    _.forEach(currUserRoles, currentUserRole => {
      currentUserRole.role = resourceRolesMap[currentUserRole.roleId]
    })

    const subTrack = challengeDetails.legacy.subTrack

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
      const appealsResponseStatus = getPhaseStatus('Appeals Response', challengeDetails)

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
 * @returns {Promise<Buffer>} Buffer of downloaded file
 */
async function downloadFile (fileURL) {
  const { bucket, key } = AmazonS3URI(fileURL)
  logger.info(`downloadFile(): file is on S3 ${bucket} / ${key}`)
  const downloadedFile = await s3.getObject({ Bucket: bucket, Key: key }).promise()
  return downloadedFile.Body
}

/**
 * Function to create s3 readstream from given S3 URL
 * @param{String} fileURL S3 URL of the file to be downloaded
 * @returns {Object} ReadStream of downloaded file
 */
function createS3ReadStream (fileURL) {
  const { bucket, key } = AmazonS3URI(fileURL)
  logger.info(`create s3 readStream(): file is on S3 ${bucket} / ${key}`)
  return s3.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

/**
 * Function to validate if submission is in clean bucket
 * @param {String} fileURL S3 URL of the file to be downloaded
 * @returns {undefined}
 */
function validateCleanBucket (fileURL) {
  const { bucket } = AmazonS3URI(fileURL)
  if (bucket === config.get('aws.DMZ_BUCKET')) {
    throw new errors.HttpStatusError(403, 'The submission is still in AV scan stage.')
  }
  if (bucket === config.get('aws.QUARANTINE_BUCKET')) {
    throw new errors.HttpStatusError(403, 'The submission is not allowed to be downloaded.')
  }
}

/**
 * Wrapper function to post to bus api. Ensures that every event posted to bus api
 * is duplicated and posted to bus api again, but to a different "aggregate" topic
 * Also stores the original topic in the payload
 * @param {Object} payload Data that needs to be posted to the bus api
 * @returns {Promise<void>}
 */
async function postToBusApi (payload) {
  const busApiClient = getBusApiClient()
  const originalTopic = payload.topic

  await busApiClient.postEvent(payload)

  // Post to aggregate topic
  payload.topic = config.get('KAFKA_AGGREGATE_TOPIC')

  // Store the original topic
  payload.payload.originalTopic = originalTopic

  await busApiClient.postEvent(payload)
}

function canSeePrivateReviews (authUser) {
  return authUser.isMachine || _.some(['administrator', 'copilot'], role => _.includes(authUser.roles, role))
}

/**
 * Function to remove metadata details from reviews for members who shouldn't see them
 * @param  {Array} reviews The reviews to remove metadata from
 * @param  {Object} authUser The authenticated user details
 */
function cleanseReviews (reviews = []) {
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

  return cleansedReviews.filter(r => r != null)
}

/**
 * Function to get role id to role name map
 * @returns {Promise<Object|null>} <Role Id, Role Name> map
 */
async function getRoleIdToRoleNameMap () {
  let resourceRoles
  let resourceRolesMap = null

  const cacheKey = 'RoleIdToRoleNameMap'
  let records = getFromInternalCache(cacheKey)
  if (_.isEmpty(records)) {
    try {
      resourceRoles = await axiosInstance.get(`${config.RESOURCEAPI_V5_BASE_URL}/resource-roles`)
    } catch (ex) {
      logger.error(`Error while accessing ${config.RESOURCEAPI_V5_BASE_URL}/resource-roles`)
      resourceRoles = null
    }
    if (resourceRoles) {
      resourceRolesMap = {}
      _.forEach(resourceRoles.data, resourceRole => {
        resourceRolesMap[resourceRole.id] = resourceRole.name
      })
    }
    records = resourceRolesMap
    setToInternalCache(cacheKey, records)
  }

  return records
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
  } else if (submission.challengeId && !submission.legacyChallengeId) {
    submission.v5ChallengeId = submission.challengeId
  }
}

/**
 * Get all latest challenges
 * @param {Number} page page index
 * @returns {Promise<Array>} an array of challenge
 */
async function getLatestChallenges (page) {
  page = page || 1
  const url = `${config.CHALLENGEAPI_V5_URL}?createdDateStart=${config.FETCH_CREATED_DATE_START}&page=${page}&perPage=${config.FETCH_PAGE_SIZE}&isLightweight=true`
  try {
    const response = await axiosInstance.get(url)
    const challenges = _.map(_.filter(_.get(response, 'data'), 'legacyId'), c => _.pick(c, 'id', 'legacyId'))
    logger.debug(`Fetched ${challenges.length} challenges in this iteration. More may follow...`)
    if (_.get(response, 'headers.x-total-pages') > page) {
      const leftChallenges = await getLatestChallenges(page + 1)
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
  if (uuidValidate(scoreCardId)) {
    logger.debug(`${scoreCardId} detected as uuid. Converting to legacy scorecard id`)

    return config.get('V5TOLEGACYSCORECARDMAPPING')[scoreCardId]
  }

  return scoreCardId
}

function getFromInternalCache (key) {
  return internalCache.get(key)
}

function setToInternalCache (key, value) {
  internalCache.set(key, value)
}

function flushInternalCache () {
  internalCache.flushAll()
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getOsClient,
  fetchFromES,
  camelize,
  setPaginationHeaders,
  getSubmissionPhaseId,
  checkCreateAccess,
  getChallengeAccessLevel,
  checkGetAccess,
  checkReviewGetAccess,
  createS3ReadStream,
  downloadFile,
  validateCleanBucket,
  postToBusApi,
  canSeePrivateReviews,
  cleanseReviews,
  getRoleIdToRoleNameMap,
  getV5ChallengeId,
  getChallenge,
  adjustSubmissionChallengeId,
  getLatestChallenges,
  getLegacyScoreCardId,
  advanceChallengePhase,
  getFromInternalCache,
  setToInternalCache,
  flushInternalCache,
  getReviewTypes,
  getReviewTypeId
}
