/**
 * Store v5 challenge id for current records
 */

const _ = require('lodash')
const config = require('config')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const helper = require('../src/common/helper')

const esClient = helper.getEsClient()

/**
 * Update Submission's challenge id to v5
 * @param {Object} submission The submission record
 * @param {Array} failedContainer The failed records container
 * @returns {Promise}
 */
async function updateRecord (submission, failedContainer) {
  let v5challengeId
  try {
    v5challengeId = await helper.getV5ChallengeId(submission.challengeId)
  } catch (err) {
    logger.error(`fetching the details of the challenge(${submission.challengeId}) failed, ${err.message}`)
    failedContainer.push(submission)
    return
  }
  const record = {
    TableName: 'Submission',
    Key: {
      id: submission.id
    },
    UpdateExpression: 'set challengeId = :c, legacyChallengeId = :l',
    ExpressionAttributeValues: {
      ':c': v5challengeId,
      ':l': submission.challengeId
    }
  }
  if (!v5challengeId) {
    logger.warn(`the challengeId: ${submission.challengeId} is not having a v5 challengeId`)
    failedContainer.push(submission)
    return
  } else if (v5challengeId === submission.challengeId) {
    logger.info(`the challengeId: ${submission.challengeId} is already a v5 challengeId`)
  }

  await dbhelper.updateRecord(record)
  try {
    const response = await esClient.update({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: submission.id,
      body: { doc: { challengeId: v5challengeId, legacyChallengeId: submission.challengeId } }
    })
    logger.info(`updated ES for submission ${submission.id}, response: ${JSON.stringify(response)}`)
  } catch (error) {
    logger.error(error.message)
  }
}

/*
 * Update all submission's challenge id to v5
 * @returns {Promise}
 */
async function updateRecords () {
  const tableName = config.SUBMISSION_TABLE_NAME
  const promises = []
  const failedRecords = []
  const legacyChallengeIds = JSON.parse(config.MIGRATE_CHALLENGES)
  const queryParams = _.fromPairs(_.map(legacyChallengeIds, (c, i) => [`:challengeId${i}`, c]))
  const params = {
    TableName: tableName,
    FilterExpression: `#challengeId IN (${_.join(_.keys(queryParams), ',')})`,
    ExpressionAttributeNames: {
      '#challengeId': 'challengeId'
    },
    ExpressionAttributeValues: queryParams
  }
  // Process until all the records from DB is fetched
  while (true) {
    const records = await dbhelper.scanRecords(params)
    const totalRecords = records.Items.length
    logger.debug(`Number of ${tableName}s fetched from DB - ${totalRecords}. More fetch iterations may follow (pagination in progress)`)
    for (let i = 0; i < totalRecords; i++) {
      const record = records.Items[i]
      promises.push(updateRecord(record, failedRecords))
    }
    // Continue fetching the remaining records from Database
    if (typeof records.LastEvaluatedKey !== 'undefined') {
      params.ExclusiveStartKey = records.LastEvaluatedKey
    } else {
      break // If there are no more records to process, exit the loop
    }
  }
  logger.debug(`All records fetched. Proceeding to update them in batches of ${config.UPDATE_V5_CHALLENGE_BATCH_SIZE}`)
  const paraRecords = _.chunk(promises, config.UPDATE_V5_CHALLENGE_BATCH_SIZE)
  for (const rs of paraRecords) {
    await Promise.all(rs)
  }
  logger.info(`Processed ${promises.length - failedRecords.length} records successfully`)
  if (failedRecords.length > 0) {
    logger.warn(`Processing of ${failedRecords.length} records failed`)
    logger.info(`Failed records: ${_.join(_.map(failedRecords, f => JSON.stringify(_.pick(f, ['id', 'challengeId'])), ','))}`)
  }
}

async function init () {
  await updateRecords()
}

init().catch((err) => {
  logger.logFullError(err)
})
