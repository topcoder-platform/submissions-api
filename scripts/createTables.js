/**
 * Create tables in Amazon DynamoDB
 */

const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const { ReviewType } = require('../src/models/ReviewType')
const { Submission } = require('../src/models/Submission')
const { Review } = require('../src/models/Review')
const { ReviewSummation } = require('../src/models/ReviewSummation')

async function createTables () {
  logger.info('Table creation started!')
  await dbhelper.createTable(ReviewType)
  await dbhelper.createTable(Submission)
  await dbhelper.createTable(Review)
  await dbhelper.createTable(ReviewSummation)
  logger.info('Table creation succeeded!')
  process.exit(0)
}
createTables().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
