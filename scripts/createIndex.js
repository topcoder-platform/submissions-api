/**
 * Create index in Opensearch
 */

const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

async function createIndex () {
  logger.info('ES Index creation started!')
  const osClient = helper.getOsClient()
  const body = { mappings: {} }
  body.mappings[config.get('osConfig.ES_TYPE')] = {
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
      review: { type: 'nested' },
      reviewSummation: { type: 'nested' }
    }
  }
  await osClient.indices.create({
    index: config.get('osConfig.OS_INDEX'),
    body
  })
  logger.info('OS Index creation succeeded!')
  process.exit(0)
}

createIndex().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
