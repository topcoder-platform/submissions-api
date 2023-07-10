/**
 * Delete index in Elasticsearch
 */

const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

async function deleteIndex () {
  logger.info('ES Index deletion started!')
  const esClient = helper.getEsClient()
  await esClient.indices.delete({
    index: config.get('esConfig.ES_INDEX')
  })
  logger.info('ES Index deletion succeeded!')
  process.exit(0)
}

deleteIndex().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
