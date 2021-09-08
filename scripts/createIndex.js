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
  const body = { mappings: {} }
  body.mappings[config.get('esConfig.ES_TYPE')] = {
    // keyword fields will do exact match
    // text field will be analyzed
    // fields not specified below will be 'text' by default
    properties: {
      resource: { type: 'keyword' },
      challengeId: { type: 'keyword' },
      legacyChallengeId: { type: 'keyword' },
      memberId: { type: 'keyword' },
      type: { type: 'keyword' },
      isFileSubmission: { type: 'boolean' },
      url: { type: 'keyword' },
      score: { type: 'float' },
      typeId: { type: 'keyword' },
      reviewerId: { type: 'keyword' },
      scoreCardId: { type: 'keyword' },
      submissionId: { type: 'keyword' },
      name: { type: 'text' },
      isActive: { type: 'keyword' },
      aggregateScore: { type: 'float' },
      isPassing: { type: 'boolean' },
      legacySubmissionId: { type: 'keyword' },
      submissionPhaseId: { type: 'keyword' },
      fileType: { type: 'keyword' },
      filename: { type: 'keyword' },
      review: { type: 'nested', properties: { score: { type: 'float' } } },
      reviewSummation: { type: 'nested' }
    }
  }
  yield esClient.indices.create({
    index: config.get('esConfig.ES_INDEX'),
    body
  })
  logger.info('ES Index creation succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
