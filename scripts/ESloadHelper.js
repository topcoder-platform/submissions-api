/**
 * Helper functions to load data in ES
 */

const _ = require('lodash')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')
const config = require('config')

const reviewTypes = require('./data/ReviewTypes.json')
const submissions = require('./data/Submissions.json')
const reviews = require('./data/Reviews.json')
const reviewSummations = require('./data/ReviewSummations.json')

const esClient = helper.getEsClient()

/*
 * Delete all data from ES
 */
function deleteDatafromES () {
  logger.info('Clear data from ES if any')
  const filter = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    q: '*'
  }
  return esClient.deleteByQuery(filter)
}

/*
 * Load Review Types from JSON into ES
 */
async function loadReviewTypes () {
  const promises = []
  reviewTypes.forEach((reviewType) => {
    const record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: reviewType.id,
      body: _.extend({ resource: 'reviewType' }, reviewType)
    }
    promises.push(esClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Submissions from JSON into ES
 */
async function loadSubmissions () {
  const promises = []
  submissions.forEach((submission) => {
    const record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: submission.id,
      body: _.extend({ resource: 'submission' }, submission)
    }
    promises.push(esClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Reviews from JSON into ES
 */
async function loadReviews () {
  const promises = []
  reviews.forEach((review) => {
    const record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: review.id,
      body: _.extend({ resource: 'review' }, review)
    }
    promises.push(esClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Review Summations from JSON into ES
 */
async function loadReviewSummations () {
  const promises = []
  reviewSummations.forEach((reviewSummation) => {
    const record = {
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: reviewSummation.id,
      body: _.extend({ resource: 'reviewSummation' }, reviewSummation)
    }
    promises.push(esClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load data into ES after removing existing data
 */
async function loadES () {
  await deleteDatafromES()
  logger.info('ES Loading started!')
  await loadReviewTypes()
  await loadSubmissions()
  await loadReviews()
  await loadReviewSummations()
  logger.info('ES Loading succeeded!')
}

module.exports = {
  deleteDatafromES,
  loadReviewTypes,
  loadSubmissions,
  loadReviews,
  loadReviewSummations,
  loadES
}
