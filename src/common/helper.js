/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const AWS = require('aws-sdk')
const co = require('co')
const config = require('config')
const elasticsearch = require('elasticsearch')
const logger = require('./logger')
const request = require('superagent')
const busApi = require('tc-bus-api-wrapper')

AWS.config.region = config.get('aws.AWS_REGION')
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

/*
 * Get submission phase ID of a challenge from Challenge API
 * @param challengeId Challenge ID
 * @returns {Integer} Submission phase ID of the given challengeId
 */
function * getSubmissionPhaseId (challengeId) {
  Promise.promisifyAll(request)
  let phaseId = null
  let response
  try {
    response = yield request.get(`${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
  } catch (ex) {
    logger.error(`Error while accessing ${config.CHALLENGEAPI_URL}/${challengeId}/phases`)
    logger.debug('Setting submissionPhaseId to Null')
    response = null
  }
  if (response) {
    const phases = _.get(response.body, 'result.content', [])
    const checkPoint = _.filter(phases, {phaseType: 'Checkpoint Submission', phaseStatus: 'Open'})
    const submissionPh = _.filter(phases, {phaseType: 'Submission', phaseStatus: 'Open'})
    if (checkPoint.length !== 0) {
      phaseId = checkPoint[0].id
    } else if (submissionPh.length !== 0) {
      phaseId = submissionPh[0].id
    }
  }
  return phaseId
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getEsClient,
  getBusApiClient,
  fetchFromES,
  camelize,
  setPaginationHeaders,
  getSubmissionPhaseId
}
