/**
 * Migrate Data from Dynamo DB to ES
 */

const _ = require('lodash')
const co = require('co')
const config = require('config')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const helper = require('../src/common/helper')

const esClient = helper.getEsClient()

/*
 * Migrate Reviewtypes from DB to ES
 */
function * migrateReviewTypes () {
  let promises = []
  let batchCounter = 1
  let params = {
    TableName: 'ReviewType'
  }
  // Process until all the records from DB is fetched
  while (true) {
    let reviewTypes = yield dbhelper.scanRecords(params)
    let totalReviewTypes = reviewTypes.Items.length
    logger.debug('Number of Review Types fetched from DB - ' + totalReviewTypes)
    for (let i = 0; i < totalReviewTypes; i++) {
      let record = {
        index: config.get('esConfig.ES_INDEX'),
        type: config.get('esConfig.ES_TYPE'),
        id: reviewTypes.Items[i].id,
        body: { doc: _.extend({ resource: 'reviewType' }, reviewTypes.Items[i]),
          doc_as_upsert: true }
      }
      promises.push(esClient.update(record))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug('Review Type - Processing batch # ' + batchCounter)
        yield promises
        promises = []
        batchCounter++
      }
    }

    // Continue fetching the remaining records from Database
    if (typeof reviewTypes.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = reviewTypes.LastEvaluatedKey
    } else {
      break // If there are no more records to process, exit the loop
    }
  }
}

/*
 * Migrate Submissions from DB to ES
 */
function * migrateSubmissions () {
  let promises = []
  let batchCounter = 1
  let params = {
    TableName: 'Submission'
  }
  // Process until all the records from DB is fetched
  while (true) {
    let submissions = yield dbhelper.scanRecords(params)
    let totalSubmissions = submissions.Items.length
    logger.debug('Number of Submissions fetched from DB - ' + totalSubmissions)
    for (let i = 0; i < totalSubmissions; i++) {
      let record = {
        index: config.get('esConfig.ES_INDEX'),
        type: config.get('esConfig.ES_TYPE'),
        id: submissions.Items[i].id,
        body: { doc: _.extend({ resource: 'submission' }, submissions.Items[i]),
          doc_as_upsert: true }
      }
      promises.push(esClient.update(record))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug('Submission - Processing batch # ' + batchCounter)
        yield promises
        promises = []
        batchCounter++
      }
    }

    // Continue fetching the remaining records from Database
    if (typeof submissions.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = submissions.LastEvaluatedKey
    } else {
      break // If there are no more records to process, exit the loop
    }
  }
}

/*
 * Migrate Reviews from DB to ES
 */
function * migrateReviews () {
  let promises = []
  let batchCounter = 1
  let params = {
    TableName: 'Review'
  }
  // Process until all the records from DB is fetched
  while (true) {
    let reviews = yield dbhelper.scanRecords(params)
    let totalReviews = reviews.Items.length
    logger.debug('Number of Submissions fetched from DB - ' + totalReviews)
    for (let i = 0; i < totalReviews; i++) {
      let record = {
        index: config.get('esConfig.ES_INDEX'),
        type: config.get('esConfig.ES_TYPE'),
        id: reviews.Items[i].id,
        body: { doc: _.extend({ resource: 'review' }, reviews.Items[i]),
          doc_as_upsert: true }
      }
      promises.push(esClient.update(record))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug('Review - Processing batch # ' + batchCounter)
        yield promises
        promises = []
        batchCounter++
      }
    }

    // Continue fetching the remaining records from Database
    if (typeof reviews.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = reviews.LastEvaluatedKey
    } else {
      break // If there are no more records to process, exit the loop
    }
  }
}

/*
 * Migrate ReviewSummations from DB to ES
 */
function * migrateReviewSummations () {
  let promises = []
  let batchCounter = 1
  let params = {
    TableName: 'ReviewSummation'
  }
  // Process until all the records from DB is fetched
  while (true) {
    let reviewSummations = yield dbhelper.scanRecords(params)
    let totalReviewSummations = reviewSummations.Items.length
    logger.debug('Number of Submissions fetched from DB - ' + totalReviewSummations)
    for (let i = 0; i < totalReviewSummations; i++) {
      let record = {
        index: config.get('esConfig.ES_INDEX'),
        type: config.get('esConfig.ES_TYPE'),
        id: reviewSummations.Items[i].id,
        body: { doc: _.extend({ resource: 'reviewSummation' }, reviewSummations.Items[i]),
          doc_as_upsert: true }
      }
      promises.push(esClient.update(record))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug('Review Summation - Processing batch # ' + batchCounter)
        yield promises
        promises = []
        batchCounter++
      }
    }

    // Continue fetching the remaining records from Database
    if (typeof reviewSummations.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = reviewSummations.LastEvaluatedKey
    } else {
      break // If there are no more records to process, exit the loop
    }
  }
}

co(function * () {
  yield migrateReviewTypes()
  yield migrateSubmissions()
  yield migrateReviews()
  yield migrateReviewSummations()
}).catch((err) => {
  logger.logFullError(err)
})
