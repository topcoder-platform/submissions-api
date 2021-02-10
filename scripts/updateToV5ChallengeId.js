/**
 * Store v5 challenge id for current records
 */

const _ = require('lodash')
const co = require('co')
const config = require('config')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')
const helper = require('../src/common/helper')

/**
 * Update Submission's challenge id to v5
 * @param {Object} submission The submission record
 * @returns {Promise}
 */
function * updateRecord (submission) {
  const v5challengeId = yield helper.getV5ChallengeId(submission.challengeId)
  const record = {
    TableName: 'Submission',
    Key: {
      id: submission.id
    },
    UpdateExpression: `set challengeId = :c, legacyChallengeId = :l`,
    ExpressionAttributeValues: {
      ':c': v5challengeId,
      ':l': submission.challengeId
    }
  }
  if (!v5challengeId) {
    logger.warn(`the challengeId: ${submission.challengeId} is not having a v5 challengeId`)

    return
  } else if (v5challengeId === submission.challengeId) {
    logger.info(`the challengeId: ${submission.challengeId} is already a v5 challengeId`)
  }

  yield dbhelper.updateRecord(record)
}

/*
 * Update all submission's challenge id to v5
 * @returns {Promise}
 */
function * updateRecords () {
  const tableName = config.SUBMISSION_TABLE_NAME
  let promises = []
  const params = {
    TableName: tableName
  }
  // Process until all the records from DB is fetched
  while (true) {
    const records = yield dbhelper.scanRecords(params)
    const totalRecords = records.Items.length
    logger.debug(`Number of ${tableName}s fetched from DB - ${totalRecords}. More fetch iterations may follow (pagination in progress)`)
    for (let i = 0; i < totalRecords; i++) {
      const record = records.Items[i]
      promises.push(updateRecord(record))
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
    yield rs
  }
}

co(function * () {
  yield updateRecords()
}).catch((err) => {
  logger.logFullError(err)
})
