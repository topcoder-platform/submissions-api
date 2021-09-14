/**
 * Delete tables in Amazon DynamoDB
 */

const co = require('co')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const { ReviewType } = require('../src/models/ReviewType')
const { Submission } = require('../src/models/Submission')
const { Review } = require('../src/models/Review')
const { ReviewSummation } = require('../src/models/ReviewSummation')

co(function * deleteTables () {
  logger.info('Table deletion started!')
  yield dbhelper.deleteTable(ReviewType.TableName)
  yield dbhelper.deleteTable(Submission.TableName)
  yield dbhelper.deleteTable(Review.TableName)
  yield dbhelper.deleteTable(ReviewSummation.TableName)
  logger.info('Table deletion succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
