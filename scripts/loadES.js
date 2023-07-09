/**
 * Load ES indices for testing
 * WARNING: This script will remove existing data from ES
 */

const logger = require('../src/common/logger')
const { loadES } = require('./ESloadHelper')

async function load () {
  await loadES()
}

load().catch((err) => {
  logger.logFullError(err)
})
