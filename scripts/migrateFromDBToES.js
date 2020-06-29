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
  let promises = []
  let batchCounter = 1
  const params = {
    TableName: tableName
  }
  // Process until all the records from DB is fetched
  while (true) {
    const records = yield dbhelper.scanRecords(params)
    const totalRecords = records.Items.length
    logger.debug(`Number of ${tableName}s fetched from DB - ` + totalRecords)
    for (let i = 0; i < totalRecords; i++) {
      const record = {
        index: config.get('esConfig.ES_INDEX_V2'),
        type: config.get('esConfig.ES_TYPE'),
        id: records.Items[i].id,
        body: {
          doc: _.extend({ resource: helper.camelize(tableName) }, records.Items[i]),
          doc_as_upsert: true
        }
      }
      promises.push(esClient.update(record))

      if (i % config.ES_BATCH_SIZE === 0) {
        logger.debug(`${tableName} - Processing batch # ` + batchCounter)
        yield promises
        promises = []
        batchCounter++
      }
    }

    // Continue fetching the remaining records from Database
    if (typeof records.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = records.LastEvaluatedKey
    } else {
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
