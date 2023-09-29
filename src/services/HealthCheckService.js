/**
 * Health Check Service
 */

const errors = require('common-errors')
const helper = require('../common/helper')

/**
 * Check if the elasticsearch connection is active
 */

async function check () {
  const esClient = helper.getEsClient()

  try {
    await esClient.ping({}, {
      requestTimeout: 30000
    })
  } catch (e) {
    throw new errors.HttpStatusError(503, 'Elasticsearch instance cannot be reached')
  }

  return {
    checksRun: 1
  }
}

module.exports = {
  check
}
