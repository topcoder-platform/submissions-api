/**
 * Health Check Service
 */

const errors = require('common-errors')
const helper = require('../common/helper')

/**
 * Check if the opensearch connection is active
 */

async function check () {
  const osClient = helper.getOsClient()

  try {
    await osClient.ping()
  } catch (e) {
    throw new errors.HttpStatusError(503, 'Opensearch instance cannot be reached')
  }

  return {
    checksRun: 1
  }
}

module.exports = {
  check
}
