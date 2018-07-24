/**
 * Create index in Elasticsearch
 */

const co = require('co')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

co(function * createIndex () {
  logger.info('ES Index creation started!')
  const esClient = helper.getEsClient()
  yield esClient.indices.create({
    index: config.get('esConfig.ES_INDEX')
  })
  logger.info('ES Index creation succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
