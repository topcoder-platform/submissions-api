/**
 * Store v5 challenge id for current records
 */

const _ = require('lodash')
const config = require('config')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const helper = require('../src/common/helper')

/**
 * Update Submission's challenge id to v5
 * @param {Object} submission The submission record
 * @param {Array} failedContainer The failed records container
 * @param {String} v5challengeId The v5 challenge id
 * @returns {Promise}
 */
async function updateRecord (submission, failedContainer, v5challengeId) {
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
  try {
    await dbhelper.updateRecord(record)
  } catch (err) {
    logger.error(`update submission record error: ${err.message}`)
    failedContainer.push(submission)
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
  // Process until all the records from DB is fetched
  const challengeIds = await helper.getLatestChallenges()
  logger.debug(`Number of challenges fetched from api - ${challengeIds.length}.`)
  const params = {
    TableName: tableName
  }
  while (true) {
    const records = await dbhelper.scanRecords(params)
    const totalRecords = records.Items.length
    logger.debug(`Number of ${tableName}s fetched from DB - ${totalRecords}. More fetch iterations may follow (pagination in progress)`)
    for (let i = 0; i < totalRecords; i++) {
      const record = records.Items[i]
      const v5ChallengeId = _.get(_.find(challengeIds, ['legacyId', record.challengeId]), 'id')
      if (v5ChallengeId) {
        promises.push(updateRecord(record, failedRecords, v5ChallengeId))
      }
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
