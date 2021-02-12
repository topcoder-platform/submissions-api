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
 * Migrate records from DB to ES
 * @param tableName {String} DynamoDB table name
 * @returns {Promise}
 */
function * migrateRecords (tableName) {
  let body = []
  let batchCounter = 1
  const params = {
    TableName: tableName
  }
  // Process until all the records from DB is fetched
  while (true) {
    const records = yield dbhelper.scanRecords(params)
    logger.debug(`Number of ${tableName}s currently fetched from DB - ` + records.Items.length)
    let i = 0
    for (const item of records.Items) {
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
        yield esClient.bulk({
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
        yield esClient.bulk({
          index: config.get('esConfig.ES_INDEX'),
          type: config.get('esConfig.ES_TYPE'),
          body
        })
      }
      break // If there are no more records to process, exit the loop
    }
  }
}

co(function * () {
  const promises = []
  promises.push(migrateRecords('ReviewType'))
  promises.push(migrateRecords('Submission'))
  promises.push(migrateRecords('Review'))
  promises.push(migrateRecords('ReviewSummation'))
  // Process migration in parallel
  yield promises
}).catch((err) => {
  logger.logFullError(err)
})
