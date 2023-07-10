/**
 * Import static data
 */

const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')

const reviewTypes = require('./data/ReviewTypes.json')
const submissions = require('./data/Submissions.json')
const reviews = require('./data/Reviews.json')
const reviewSummations = require('./data/ReviewSummations.json')

async function loadData () {
  logger.info('Data import started!')
  const promises = []
  reviewTypes.forEach((reviewType) => {
    const record = {
      TableName: 'ReviewType',
      Item: reviewType
    }
    promises.push(dbhelper.insertRecord(record))
  })

  submissions.forEach((submission) => {
    const record = {
      TableName: 'Submission',
      Item: submission
    }
    promises.push(dbhelper.insertRecord(record))
  })

  reviews.forEach((review) => {
    const record = {
      TableName: 'Review',
      Item: review
    }
    promises.push(dbhelper.insertRecord(record))
  })

  reviewSummations.forEach((reviewSummation) => {
    const record = {
      TableName: 'ReviewSummation',
      Item: reviewSummation
    }
    promises.push(dbhelper.insertRecord(record))
  })

  await Promise.all(promises)
  logger.info('Data import succeeded!')
  process.exit(0)
}

loadData().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
