/**
 * Delete index in Elasticsearch
 */

const co = require('co')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

co(function * deleteIndex () {
  logger.info('ES Index deletion started!')
  const esClient = helper.getEsClient()
  yield esClient.indices.delete({
    index: config.get('esConfig.ES_INDEX')
  })
  yield esClient.indices.delete({
    index: config.get('esConfig.ES_INDEX_V2')
  })
  logger.info('ES Index deletion succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
