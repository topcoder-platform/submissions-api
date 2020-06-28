/**
 * Copies the existing index to a new index and updates the type of challengeId
 * to be keyword (It is long in the source index)
 */

const co = require('co')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

co(function * createIndex () {
  logger.info('ES Index creation started!')
  const esClient = helper.getEsClient()
  const indices = yield esClient.indices.get({
    index: config.get('esConfig.ES_INDEX')
  })
  const existingIndex = indices[config.get('esConfig.ES_INDEX')]
  const existingMappings = existingIndex.mappings[config.get('esConfig.ES_TYPE')]
  const body = { mappings: {} }
  body.mappings[config.get('esConfig.ES_TYPE')] = {
    properties: {
      ...existingMappings.properties,
      challengeId: { type: 'keyword' }
    }
  }
  yield esClient.indices.create({
    index: config.get('esConfig.ES_INDEX_V2'),
    body
  })
  logger.info('ES Index creation succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
