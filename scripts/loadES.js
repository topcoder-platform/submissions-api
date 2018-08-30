/**
 * Load ES indices for testing
 * WARNING: This script will remove existing data from ES
 */

const co = require('co')
const logger = require('../src/common/logger')
const { loadES } = require('./ESloadHelper')

co(function * () {
  yield loadES()
}).catch((err) => {
  logger.logFullError(err)
})
