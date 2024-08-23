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

const osClient = helper.getOsClient()

/*
 * Delete all data from OS
 */
function deleteDatafromOS () {
  logger.info('Clear data from OS if any')
  const filter = {
    index: config.get('osConfig.OS_INDEX'),
    q: '*'
  }
  return osClient.deleteByQuery(filter)
}

/*
 * Load Review Types from JSON into OS
 */
async function loadReviewTypes () {
  const promises = []
  reviewTypes.forEach((reviewType) => {
    const record = {
      index: config.get('osConfig.OS_INDEX'),
      id: reviewType.id,
      body: _.extend({ resource: 'reviewType' }, reviewType)
    }
    promises.push(osClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Submissions from JSON into OS
 */
async function loadSubmissions () {
  const promises = []
  submissions.forEach((submission) => {
    const record = {
      index: config.get('osConfig.OS_INDEX'),
      id: submission.id,
      body: _.extend({ resource: 'submission' }, submission)
    }
    promises.push(osClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Reviews from JSON into OS
 */
async function loadReviews () {
  const promises = []
  reviews.forEach((review) => {
    const record = {
      index: config.get('osConfig.OS_INDEX'),
      id: review.id,
      body: _.extend({ resource: 'review' }, review)
    }
    promises.push(osClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load Review Summations from JSON into OS
 */
async function loadReviewSummations () {
  const promises = []
  reviewSummations.forEach((reviewSummation) => {
    const record = {
      index: config.get('osConfig.OS_INDEX'),
      id: reviewSummation.id,
      body: _.extend({ resource: 'reviewSummation' }, reviewSummation)
    }
    promises.push(osClient.create(record))
  })
  await Promise.all(promises)
}

/*
 * Load data into OS after removing existing data
 */
async function loadOS () {
  await deleteDatafromOS()
  logger.info('OS Loading started!')
  await loadReviewTypes()
  await loadSubmissions()
  await loadReviews()
  await loadReviewSummations()
  logger.info('OS Loading succeeded!')
}

module.exports = {
  deleteDatafromOS,
  loadReviewTypes,
  loadSubmissions,
  loadReviews,
  loadReviewSummations,
  loadOS
}
