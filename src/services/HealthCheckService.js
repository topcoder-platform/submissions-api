/**
 * Health Check Service
 */

const errors = require('common-errors')
const helper = require('../common/helper')
const tracer = require('../common/tracer')

/**
 * Check if the elasticsearch connection is active
 * @param {Object} span the Span object
 */

function * check (span) {
  const checkSpan = tracer.startChildSpans('HealthCheckService.check', span)

  const esClient = helper.getEsClient()

  try {
    yield esClient.ping({
      requestTimeout: 10000
    })
  } catch (e) {
    checkSpan.setTag('error', true)
    throw new errors.HttpStatusError(503, 'Elasticsearch instance cannot be reached')
  } finally {
    checkSpan.finish()
  }

  return {
    checksRun: 1
  }
}

module.exports = {
  check
}
