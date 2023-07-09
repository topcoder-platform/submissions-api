/**
 * Migrate Data from Dynamo DB to ES
 */

const _ = require('lodash')
const config = require('config')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const helper = require('../src/common/helper')

const esClient = helper.getEsClient()

/*
 * Migrate records from DB to ES
 * @param tableName {String} DynamoDB table name
 * @param customFunction {Function} custom function to handle record
 * @returns {Promise}
 */
async function migrateRecords (tableName, customFunction) {
  let body = []
  let batchCounter = 1
  const params = {
    TableName: tableName
  }
  // Process until all the records from DB is fetched
  while (true) {
    const records = await dbhelper.scanRecords(params)
    logger.debug(`Number of ${tableName}s currently fetched from DB - ` + records.Items.length)
    let i = 0
    for (const recordItem of records.Items) {
      const item = customFunction(recordItem)
      // action
      body.push({
        index: {
          _id: item.id
        }
      })
      // data
      body.push(_.extend({ resource: helper.camelize(tableName) }, item))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug(`${tableName} - Processing batch # ` + batchCounter)
        await esClient.bulk({
          index: config.get('esConfig.ES_INDEX'),
          type: config.get('esConfig.ES_TYPE'),
          body
        })
        body = []
        batchCounter++
      }
      i++
    }

    // Continue fetching the remaining records from Database
    if (typeof records.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = records.LastEvaluatedKey
    } else {
      if (body.length > 0) {
        logger.debug(`${tableName} - Final batch processing...`)
        await esClient.bulk({
          index: config.get('esConfig.ES_INDEX'),
          type: config.get('esConfig.ES_TYPE'),
          body
        })
      }
      break // If there are no more records to process, exit the loop
    }
  }
}

async function init () {
  const promises = []
  const reviews = []
  const reviewSummations = []
  promises.push(migrateRecords('ReviewType', t => t))
  promises.push(migrateRecords('Review', t => {
    reviews.push(t)
    return t
  }))
  promises.push(migrateRecords('ReviewSummation', t => {
    reviewSummations.push(t)
    return t
  }))
  // Process migration in parallel
  await Promise.all(promises)
  await migrateRecords('Submission', t => {
    t.review = _.map(_.filter(reviews, ['submissionId', t.id]), r => _.omit(r, ['resource']))
    t.reviewSummation = _.map(_.filter(reviewSummations, ['submissionId', t.id]), r => _.omit(r, ['resource']))
    if (_.isEmpty(t.review)) {
      t = _.omit(t, ['review'])
    }
    if (_.isEmpty(t.reviewSummation)) {
      t = _.omit(t, ['reviewSummation'])
    }
    return t
  })
}
init().catch((err) => {
  logger.logFullError(err)
})
