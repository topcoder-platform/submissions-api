/**
 * Submission Service
 */

const AWS = require('aws-sdk')
const config = require('config')
const errors = require('common-errors')
const fileTypeFinder = require('file-type')
const joi = require('joi')
const _ = require('lodash')
const uuid = require('uuid/v4')
const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, fileType, events } = require('../../constants').busApiMeta
const { submissionIndex } = require('../../constants')
const s3 = new AWS.S3()
const logger = require('winston')

const {
  DomainHelper: { getScanCriteria },
} = require("@topcoder-framework/lib-common");

const { SubmissionDomain } = require("@topcoder-framework/domain-submission");


const submissionDomain = new SubmissionDomain(
  config.GRPC_CHALLENGE_SERVER_HOST,
  config.GRPC_CHALLENGE_SERVER_PORT
);

const table = 'Submission'

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @param {String} name File name
 * @return {Promise}
 **/
async function _uploadToS3(file, name) {
  const params = {
    Bucket: config.aws.S3_BUCKET,
    Key: name,
    Body: file.data,
    ContentType: file.mimetype,
    Metadata: {
      originalname: file.name
    }
  }
  // Upload to S3
  await s3.upload(params).promise()
}

async function _getReviewsForSubmission(submissionId) {
  const reviewFilter = {
    TableName: 'Review',
    IndexName: submissionIndex,
    KeyConditionExpression: 'submissionId = :p_submissionId',
    ExpressionAttributeValues: {
      ':p_submissionId': submissionId
    }
  }

  return await dbhelper.queryRecords(reviewFilter)
}

async function _getReviewSummationsForSubmission(submissionId) {
  const reviewSummationFilter = {
    TableName: 'ReviewSummation',
    IndexName: submissionIndex,
    KeyConditionExpression: 'submissionId = :p_submissionId',
    ExpressionAttributeValues: {
      ':p_submissionId': submissionId
    }
  }

  return await dbhelper.queryRecords(reviewSummationFilter)
}

/**
 * Function to get submission based on ID from DynamoDB
 * This function will be used all by other functions to check existence of a submission
 * @param {String} submissionId submissionId which need to be retrieved
 * @param {Boolean} fetchReview if True, associated reviews and review summations will be fetched
 * @return {Object} Data retrieved from database
 */
async function _getSubmission(submissionId, fetchReview = true) {
  const scanCriteria = getScanCriteria({
    id: submissionId
  });

  const result = await submissionDomain.scan({
    scanCriteria
  })
  const submission = result[0];
  if (fetchReview) {
    // Fetch associated reviews
    const review = await _getReviewsForSubmission(submissionId)

    if (review.Count !== 0) {
      submission.review = review.Items
    }
    // Fetch associated review summations
    const reviewSummation = await _getReviewSummationsForSubmission(submissionId)

    if (reviewSummation.Count !== 0) {
      submission.reviewSummation = reviewSummation.Items
    }
  }
  return submission
}

/**
 * Function to get submission based on ID from ES
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
async function getSubmission(authUser, submissionId) {
  const response = await helper.fetchFromES({ id: submissionId }, helper.camelize(table))
  let submissionRecord = null
  logger.info(`getSubmission: fetching submissionId ${submissionId}`)
  await _getSubmission(submissionId)
  if (response.total === 0) { // CWD-- not in ES yet maybe? let's grab from the DB
    logger.info(`getSubmission: submissionId not found in ES: ${submissionId}`)
    submissionRecord = await _getSubmission(submissionId)

    if (!_.get(submissionRecord, 'id', null)) {
      logger.info(`getSubmission: submissionId not found in ES nor the DB: ${submissionId}`)
      submissionRecord = null
    }
  } else {
    logger.info(`getSubmission: submissionId found in ES: ${submissionId}`)
    submissionRecord = response.rows[0]

    if (!submissionRecord.review || submissionRecord.review.length < 1) {
      logger.info(`submission ${submissionId} from ES has no reviews. Double checking the db`)
      const review = await _getReviewsForSubmission(submissionId)
      logger.info(`${review}`)
      submissionRecord.review = review.Items || []
    }

    if (!submissionRecord.reviewSummation || submissionRecord.reviewSummation.length < 1) {
      logger.info(`submission ${submissionId} from ES has no reviewSummations. Double checking the db`)
      const reviewSummation = await _getReviewSummationsForSubmission(submissionId)
      logger.info(`${reviewSummation}`)
      submissionRecord.reviewSummation = reviewSummation.Items || []
    }
  }

  if (!submissionRecord) { // CWD-- couldn't find it in ES nor the DB
    logger.info(`getSubmission: submissionId not found in ES nor DB so throwing 404: ${submissionId}`)
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  logger.info('Check User access before returning the submission')
  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    await helper.checkGetAccess(authUser, submissionRecord)
  }

  submissionRecord.review = helper.cleanseReviews(submissionRecord.review, authUser)

  // Return the retrieved submission
  logger.info(`getSubmission: returning data for submissionId: ${submissionId}`)
  helper.adjustSubmissionChallengeId(submissionRecord)
  return submissionRecord
}

getSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required()
}

/**
 * Function to get submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId ID of the Submission which need to be retrieved
 * @return {Object} Submission retrieved
 */
async function downloadSubmission(authUser, submissionId) {
  const record = await getSubmission(authUser, submissionId)
  return { submission: record }
}

/**
 * Function to list submissions from Elastic Search
 * @param {Object} authUser Authenticated User
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
async function listSubmissions(authUser, query) {
  console.log('listSubmissions: query: ', query)
  if (query.challengeId) {
    // Submission api now only works with v5 challenge id
    // If it is a legacy challenge id, get the associated v5 challenge id
    query.challengeId = await helper.getV5ChallengeId(query.challengeId)
  }

  // TODO - support v5 for review scorecardid
  if (query['review.scoreCardId']) {
    query['review.scoreCardId'] = helper.getLegacyScoreCardId(query['review.scoreCardId'])

    if (!query['review.scoreCardId']) {
      throw new errors.HttpStatusError(400, 'Legacy scorecard id not found for the provided v5 scorecard id')
    }
  }

  console.log('fetching from ES before');
  const data = await helper.fetchFromES(query, helper.camelize(table));
  console.log('fetching from ES after');
  logger.info(`Data returned from ES: ${JSON.stringify(data, null, 4)}`)
  logger.info(`listSubmissions: returning ${data.length} submissions for query: ${JSON.stringify(query)}`)

  data.rows = _.map(data.rows, (submission) => {
    if (submission.review) {
      submission.review = helper.cleanseReviews(submission.review, authUser)
    }
    helper.adjustSubmissionChallengeId(submission)
    return submission
  })
  return data
}

const listSubmissionsQuerySchema = {
  type: joi.string(),
  url: joi.string().uri().trim(),
  memberId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  legacyUploadId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  submissionPhaseId: joi.id(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder(),
  'review.score': joi.score(),
  'review.typeId': joi.string().uuid(),
  'review.reviewerId': joi.string().uuid(),
  'review.scoreCardId': joi.alternatives().try(joi.id(), joi.string().uuid()),
  'review.submissionId': joi.string().uuid(),
  'review.status': joi.reviewStatus(),
  'reviewSummation.scoreCardId': joi.id(),
  'reviewSummation.submissionId': joi.string().uuid(),
  'reviewSummation.aggregateScore': joi.score(),
  'reviewSummation.isPassing': joi.boolean()
}

listSubmissionsQuerySchema.sortBy = joi.string().valid(_.difference(
  Object.keys(listSubmissionsQuerySchema),
  ['page', 'perPage', 'orderBy']
))

listSubmissions.schema = {
  authUser: joi.object().required(),
  query: joi.object().keys(listSubmissionsQuerySchema).with('orderBy', 'sortBy')
}

/**
 * Function to upload and create submission
 * @param {Object} authUser Authenticated User
 * @param {Object} files Submission uploaded by the User
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createSubmission(authUser, files, entity) {
  logger.info('Creating a new submission')
  if (files && entity.url) {
    logger.info('Cannot create submission. Neither file nor url to upload has been passed')
    throw new errors.HttpStatusError(400, 'Either file to be uploaded or URL should be present')
  }

  if (!files && !entity.url) {
    logger.info('Cannot create submission. Ambiguous parameters. Both file and url have been provided. Unsure which to use')
    throw new errors.HttpStatusError(400, 'Either file to be uploaded or URL should be present')
  }

  let url = entity.url
  // Submission ID will be used for file name in S3 bucket as well
  const submissionId = uuid()

  if (files && files.submission) {
    const pFileType = entity.fileType || fileType // File type parameter
    const uFileType = fileTypeFinder(files.submission.data).ext // File type of uploaded file
    if (pFileType !== uFileType) {
      logger.info('Actual file type of the file does not match the file type attribute in the request')
      throw new errors.HttpStatusError(400, 'fileType parameter doesn\'t match the type of the uploaded file')
    }
    const file = await _uploadToS3(files.submission, `${submissionId}.${uFileType}`)
    url = file.Location
  } else if (files) {
    throw new errors.HttpStatusError(400, 'The file should be uploaded under the "submission" attribute')
  }

  // Submission api only works with legacy challenge id
  // If it is a v5 challenge id, get the associated legacy challenge id
  const challengeId = await helper.getV5ChallengeId(entity.challengeId)
  const legacyChallengeId = await helper.getLegacyChallengeId(entity.challengeId)
  const currDate = (new Date()).toISOString()

  const item = {
    id: submissionId,
    type: entity.type,
    url: url,
    memberId: entity.memberId,
    challengeId,
    created: currDate,
    updated: currDate,
    createdBy: authUser.handle || authUser.sub,
    updatedBy: authUser.handle || authUser.sub
  }

  // Pure v5 challenges won't have a legacy challenge id
  if (legacyChallengeId) {
    item.legacyChallengeId = legacyChallengeId
  }

  if (entity.legacySubmissionId) {
    item.legacySubmissionId = entity.legacySubmissionId
  }

  if (entity.legacyUploadId) {
    item.legacyUploadId = entity.legacyUploadId
  }

  if (entity.submissionPhaseId) {
    item.submissionPhaseId = entity.submissionPhaseId
  } else {
    item.submissionPhaseId = await helper.getSubmissionPhaseId(entity.challengeId)
  }

  if (entity.fileType) {
    item.fileType = entity.fileType
  } else {
    item.fileType = fileType
  }

  logger.info('Check User access before creating the submission')
  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    logger.info(`Calling checkCreateAccess for ${JSON.stringify(authUser)}`)
    await helper.checkCreateAccess(authUser, item)

    if (entity.submittedDate) {
      throw new errors.HttpStatusError(403, 'You are not allowed to set the `submittedDate` attribute on a submission')
    }
  } else {
    logger.info(`No need to call checkCreateAccess for ${JSON.stringify(authUser)}`)
  }

  item.submittedDate = entity.submittedDate || item.created

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  logger.info('Prepared submission item to insert into Dynamodb. Inserting...')
  logger.info(JSON.stringify(record, null, 2))
  await dbhelper.insertRecord(record)

  // After save to db, adjust challengeId to busApi and response
  helper.adjustSubmissionChallengeId(item)

  // Push Submission created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator: originator,
    timestamp: currDate, // time when submission was created
    'mime-type': mimeType,
    payload: _.extend({ resource: helper.camelize(table) }, item)
  }

  // If the file is uploaded, set properties accordingly
  if (files && files.submission) {
    reqBody.payload.isFileSubmission = true
    reqBody.payload.filename = files.submission.name
  } else { // If the file URL is provided, handle accordingly
    reqBody.payload.isFileSubmission = false
  }

  logger.info('Prepared submission create event payload to pass to the Bus')
  logger.info(`Posting to bus ${JSON.stringify(reqBody)}`)
  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the entity which is in compliance with Swagger
  logger.info(`done creating submission. Returning: ${JSON.stringify(item)}`)
  return item
}

createSubmission.schema = {
  authUser: joi.object().required(),
  files: joi.any(),
  entity: joi.object().keys({
    type: joi.string().required(),
    fileType: joi.string(),
    url: joi.string().uri().trim(),
    memberId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    legacyUploadId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionPhaseId: joi.id(),
    submittedDate: joi.string()
  }).required()
}

/*
 * Function to update submission
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
async function _updateSubmission(authUser, submissionId, entity) {
  logger.info(`Updating submission with submission id ${submissionId}`)

  const exist = await _getSubmission(submissionId)
  if (!exist) {
    logger.info(`Submission with ID = ${submissionId} is not found`)
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  const currDate = (new Date()).toISOString()
  let challengeId = exist.challengeId
  let legacyChallengeId = exist.legacyChallengeId
  if (entity.challengeId) {
    challengeId = await helper.getV5ChallengeId(entity.challengeId)
    legacyChallengeId = await helper.getLegacyChallengeId(entity.challengeId)
  }
  if (exist.legacyChallengeId && !legacyChallengeId) {
    // Original submission contains a legacy challenge id
    // But with this update, it does not
    // Prevent updates to current submission
    // else we will be left with a submission with wrong legacy challenge id
    throw new errors.HttpStatusError(400, `Cannot update submission with v5 challenge id since it already has a legacy challenge id associated with it`)
  }
  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      id: submissionId
    },
    UpdateExpression: `set #type = :t, #url = :u, memberId = :m, challengeId = :c, updated = :ua, updatedBy = :ub, submittedDate = :sb`,
    ExpressionAttributeValues: {
      ':t': entity.type || exist.type,
      ':u': entity.url || exist.url,
      ':m': entity.memberId || exist.memberId,
      ':c': challengeId,
      ':ua': currDate,
      ':ub': authUser.handle || authUser.sub,
      ':sb': entity.submittedDate || exist.submittedDate || exist.created
    },
    ExpressionAttributeNames: {
      '#type': 'type',
      '#url': 'url'
    }
  }

  if (legacyChallengeId) {
    record.UpdateExpression = record.UpdateExpression + ', legacyChallengeId = :lc'
    record.ExpressionAttributeValues[':lc'] = legacyChallengeId
  }

  // If legacy submission ID exists, add it to the update expression
  if (entity.legacySubmissionId || exist.legacySubmissionId) {
    record.UpdateExpression = record.UpdateExpression + ', legacySubmissionId = :ls'
    record.ExpressionAttributeValues[':ls'] = entity.legacySubmissionId || exist.legacySubmissionId
  }

  // If legacy upload ID exists, add it to the update expression
  if (entity.legacyUploadId || exist.legacyUploadId) {
    record.UpdateExpression = record.UpdateExpression + ', legacyUploadId = :lu'
    record.ExpressionAttributeValues[':lu'] = entity.legacyUploadId || exist.legacyUploadId
  }

  // If submissionPhaseId exists, add it to the update expression
  if (entity.submissionPhaseId || exist.submissionPhaseId) {
    record.UpdateExpression = record.UpdateExpression + ', submissionPhaseId = :sp'
    record.ExpressionAttributeValues[':sp'] = entity.submissionPhaseId || exist.submissionPhaseId
  }

  logger.info('Prepared submission item to update in Dynamodb. Updating...')

  await dbhelper.updateRecord(record)
  const updatedSub = await _getSubmission(submissionId)

  helper.adjustSubmissionChallengeId(updatedSub)
  // Push Submission updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator: originator,
    timestamp: currDate, // time when submission was updated
    'mime-type': mimeType,
    payload: _.extend({
      resource: helper.camelize(table),
      id: submissionId,
      challengeId: updatedSub.challengeId,
      v5ChallengeId: updatedSub.v5ChallengeId,
      memberId: updatedSub.memberId,
      submissionPhaseId: updatedSub.submissionPhaseId,
      type: updatedSub.type,
      submittedDate: updatedSub.submittedDate,
      legacyChallengeId: updatedSub.legacyChallengeId
    }, entity)
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(
    exist,
    entity,
    {
      updated: currDate,
      updatedBy: authUser.handle || authUser.sub,
      submittedDate: updatedSub.submittedDate,
      challengeId: updatedSub.challengeId,
      v5ChallengeId: updatedSub.v5ChallengeId
    }
  )
}

/**
 * Function to update submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
async function updateSubmission(authUser, submissionId, entity) {
  return await _updateSubmission(authUser, submissionId, entity)
}

updateSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required(),
  entity: joi.object().keys({
    type: joi.string(),
    url: joi.string().uri().trim().required(),
    memberId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    legacyUploadId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionPhaseId: joi.id(),
    submittedDate: joi.string()
  }).required()
}

/**
 * Function to patch submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
async function patchSubmission(authUser, submissionId, entity) {
  return await _updateSubmission(authUser, submissionId, entity)
}

patchSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required(),
  entity: joi.object().keys({
    type: joi.string(),
    url: joi.string().uri().trim(),
    memberId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    legacyUploadId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionPhaseId: joi.id(),
    submittedDate: joi.string()
  })
}

/**
 * Function to delete submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be deleted
 * @return {Promise}
 */
async function deleteSubmission(authUser, submissionId) {
  const exist = await _getSubmission(submissionId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && exist.memberId !== authUser.userId) {
    throw new errors.HttpStatusError(403, 'You do not have permissions to delete this submission.')
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      id: submissionId
    }
  }

  await dbhelper.deleteRecord(filter)

  // Push Submission deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator: originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: submissionId,
      legacyId: exist.legacySubmissionId
    }
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)
}

deleteSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().guid().required()
}

SubmissionService = {
  getSubmission,
  _getSubmission,
  downloadSubmission,
  listSubmissions,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission
}
module.exports = SubmissionService;