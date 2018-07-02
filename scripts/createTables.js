/**
 * Create tables in Amazon DynamoDB
 */

const co = require('co')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const { ReviewType } = require('../src/models/ReviewType')
const { Submission } = require('../src/models/Submission')

co(function * createTables () {
  logger.info('Table creation started!')
  yield dbhelper.createTable(ReviewType)
  yield dbhelper.createTable(Submission)
  logger.info('Table creation succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
