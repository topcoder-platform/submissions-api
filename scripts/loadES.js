/**
 * Load ES indices for testing
 */

const _ = require('lodash')
const co = require('co')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')
const config = require('config')

const reviewTypes = require('./data/ReviewTypes.json')
const submissions = require('./data/Submissions.json')
const reviews = require('./data/Reviews.json')
const reviewSummations = require('./data/ReviewSummations.json')

const esClient = helper.getEsClient()

/*
 * Load Review Types from JSON into ES
 */
function * loadReviewTypes () {
  const promises = []
  reviewTypes.forEach((reviewType) => {
    let record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: reviewType.id,
      body: _.extend({'resource': 'reviewType'}, reviewType)
    }
    promises.push(esClient.create(record))
  })
  yield promises
}

/*
 * Load Submissions from JSON into ES
 */
function * loadSubmissions () {
  const promises = []
  submissions.forEach((submission) => {
    let record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: submission.id,
      body: _.extend({'resource': 'submission'}, submission)
    }
    promises.push(esClient.create(record))
  })
  yield promises
}

/*
 * Load Reviews from JSON into ES
 */
function * loadReviews () {
  const promises = []
  reviews.forEach((review) => {
    let record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: review.id,
      body: _.extend({'resource': 'review'}, review)
    }
    promises.push(esClient.create(record))
  })
  yield promises
}

/*
 * Load Review Summations from JSON into ES
 */
function * loadReviewSummations () {
  const promises = []
  reviewSummations.forEach((reviewSummation) => {
    let record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: reviewSummation.id,
      body: _.extend({'resource': 'reviewSummation'}, reviewSummation)
    }
    promises.push(esClient.create(record))
  })
  yield promises
}

co(function * loadES () {
  logger.info('ES Loading started!')
  yield loadReviewTypes()
  yield loadSubmissions()
  yield loadReviews()
  yield loadReviewSummations()
  logger.info('ES Loading succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
