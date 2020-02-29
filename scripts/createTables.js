/**
 * Create tables in Amazon DynamoDB
 */

const co = require('co')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const { ReviewType } = require('../src/models/ReviewType')
const { Submission } = require('../src/models/Submission')
const { SubmissionArtifactMap } = require('../src/models/SubmissionArtifactMap')
const { Review } = require('../src/models/Review')
const { ReviewSummation } = require('../src/models/ReviewSummation')

co(function * createTables () {
  logger.info('Table creation started!')
  yield dbhelper.createTable(ReviewType)
  yield dbhelper.createTable(Submission)
  yield dbhelper.createTable(SubmissionArtifactMap)
  yield dbhelper.createTable(Review)
  yield dbhelper.createTable(ReviewSummation)
  logger.info('Table creation succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
