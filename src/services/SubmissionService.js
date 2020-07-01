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

const table = 'Submission'

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @param {String} name File name
 * @return {Promise}
 **/
function * _uploadToS3 (file, name) {
  return new Promise((resolve, reject) => {
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
    s3.upload(params, (err, data) => {
      if (err) return reject(err)
      else resolve(data)
    })
  })
}

function * _getReviewsForSubmission (submissionId) {
  const reviewFilter = {
    TableName: 'Review',
    IndexName: submissionIndex,
    KeyConditionExpression: 'submissionId = :p_submissionId',
    ExpressionAttributeValues: {
      ':p_submissionId': submissionId
    }
  }

  return yield dbhelper.queryRecords(reviewFilter)
}

function * _getReviewSummationsForSubmission (submissionId) {
  const reviewSummationFilter = {
    TableName: 'ReviewSummation',
    IndexName: submissionIndex,
    KeyConditionExpression: 'submissionId = :p_submissionId',
    ExpressionAttributeValues: {
      ':p_submissionId': submissionId
    }
  }

  return yield dbhelper.queryRecords(reviewSummationFilter)
}

/**
 * Function to get submission based on ID from DynamoDB
 * This function will be used all by other functions to check existence of a submission
 * @param {String} submissionId submissionId which need to be retrieved
 * @param {Boolean} fetchReview if True, associated reviews and review summations will be fetched
 * @return {Object} Data retrieved from database
 */
function * _getSubmission (submissionId, fetchReview = true) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      id: submissionId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  const submission = result.Item
  if (fetchReview) {
    // Fetch associated reviews
    const review = yield _getReviewsForSubmission(submissionId)

    if (review.Count !== 0) {
      submission.review = review.Items
    }
    // Fetch associated review summations
    const reviewSummation = yield _getReviewSummationsForSubmission(submissionId)

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
function * getSubmission (authUser, submissionId) {
  const response = yield helper.fetchFromES({ id: submissionId }, helper.camelize(table))
  let submissionRecord = null
  logger.info(`getSubmission: fetching submissionId ${submissionId}`)
  if (response.total === 0) { // CWD-- not in ES yet maybe? let's grab from the DB
    logger.info(`getSubmission: submissionId not found in ES: ${submissionId}`)
    submissionRecord = yield _getSubmission(submissionId)

    if (!_.get(submissionRecord, 'id', null)) {
      logger.info(`getSubmission: submissionId not found in ES nor the DB: ${submissionId}`)
      submissionRecord = null
    }
  } else {
    logger.info(`getSubmission: submissionId found in ES: ${submissionId}`)
    submissionRecord = response.rows[0]

    if (!submissionRecord.review || submissionRecord.review.length < 1) {
      logger.info(`submission ${submissionId} from ES has no reviews. Double checking the db`)
      const review = yield _getReviewsForSubmission(submissionId)
      logger.info(`${review}`)
      submissionRecord.review = review.Items || []
    }

    if (!submissionRecord.reviewSummation || submissionRecord.reviewSummation.length < 1) {
      logger.info(`submission ${submissionId} from ES has no reviewSummations. Double checking the db`)
      const reviewSummation = yield _getReviewSummationsForSubmission(submissionId)
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
    yield helper.checkGetAccess(authUser, submissionRecord)
  }

  submissionRecord.review = helper.cleanseReviews(submissionRecord.review, authUser)

  // Return the retrieved submission
  logger.info(`getSubmission: returning data for submissionId: ${submissionId}`)
  return submissionRecord
}

getSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required()
}

/**
 * Function to download submission from S3
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId ID of the Submission which need to be retrieved
 * @return {Object} Submission retrieved from S3
 */
function * downloadSubmission (authUser, submissionId) {
  const record = yield getSubmission(authUser, submissionId)
  const downloadedFile = yield helper.downloadFile(record.url)
  return { submission: record, file: downloadedFile }
}

/**
 * Function to list submissions from Elastic Search
 * @param {Object} authUser Authenticated User
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
function * listSubmissions (authUser, query) {
  if (query.challengeId) {
    // Submission api only works with legacy challenge id
    // If it is a v5 challenge id, get the associated legacy challenge id
    query.challengeId = yield helper.getLegacyChallengeId(query.challengeId)
  }

  const data = yield helper.fetchFromES(query, helper.camelize(table))
  logger.info(`listSubmissions: returning ${data.length} submissions for query: ${JSON.stringify(query)}`)

  data.rows = _.map(data.rows, (submission) => {
    if (submission.review) {
      submission.review = helper.cleanseReviews(submission.review, authUser)
    }
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
  'review.scoreCardId': joi.id(),
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
function * createSubmission (authUser, files, entity) {
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
    const file = yield _uploadToS3(files.submission, `${submissionId}.${uFileType}`)
    url = file.Location
  } else if (files) {
    throw new errors.HttpStatusError(400, 'The file should be uploaded under the "submission" attribute')
  }

  // Submission api only works with legacy challenge id
  // If it is a v5 challenge id, get the associated legacy challenge id
  const challengeId = yield helper.getLegacyChallengeId(entity.challengeId)

  const currDate = (new Date()).toISOString()

  const item = {
    id: submissionId,
    type: entity.type,
    url: url,
    memberId: entity.memberId,
    challengeId: challengeId,
    created: currDate,
    updated: currDate,
    createdBy: authUser.handle || authUser.sub,
    updatedBy: authUser.handle || authUser.sub
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
    item.submissionPhaseId = yield helper.getSubmissionPhaseId(challengeId)
  }

  if (entity.fileType) {
    item.fileType = entity.fileType
  } else {
    item.fileType = fileType
  }

  logger.info('Check User access before creating the submission')
  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    logger.info(`Calling checkCreateAccess for ${JSON.stringify(authUser)}`)
    yield helper.checkCreateAccess(authUser, item)
  } else {
    logger.info(`No need to call checkCreateAccess for ${JSON.stringify(authUser)}`)
  }

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  logger.info('Prepared submission item to insert into Dynamodb. Inserting...')
  yield dbhelper.insertRecord(record)

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
  yield helper.postToBusApi(reqBody)

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
    submissionPhaseId: joi.id()
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
function * _updateSubmission (authUser, submissionId, entity) {
  logger.info(`Updating submission with submission id ${submissionId}`)

  const exist = yield _getSubmission(submissionId)
  if (!exist) {
    logger.info(`Submission with ID = ${submissionId} is not found`)
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  if (entity.challengeId) {
    // Submission api only works with legacy challenge id
    // If it is a v5 challenge id, get the associated legacy challenge id
    entity.challengeId = yield helper.getLegacyChallengeId(entity.challengeId)
  }

  const currDate = (new Date()).toISOString()
  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      id: submissionId
    },
    UpdateExpression: `set #type = :t, #url = :u, memberId = :m, challengeId = :c,
                        updated = :ua, updatedBy = :ub`,
    ExpressionAttributeValues: {
      ':t': entity.type || exist.type,
      ':u': entity.url || exist.url,
      ':m': entity.memberId || exist.memberId,
      ':c': entity.challengeId || exist.challengeId,
      ':ua': currDate,
      ':ub': authUser.handle || authUser.sub
    },
    ExpressionAttributeNames: {
      '#type': 'type',
      '#url': 'url'
    }
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

  yield dbhelper.updateRecord(record)
  const updatedSub = yield _getSubmission(submissionId)

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
      memberId: updatedSub.memberId,
      submissionPhaseId: updatedSub.submissionPhaseId,
      type: updatedSub.type
    }, entity)
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity, { updated: currDate, updatedBy: authUser.handle || authUser.sub })
}

/**
 * Function to update submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
function * updateSubmission (authUser, submissionId, entity) {
  return yield _updateSubmission(authUser, submissionId, entity)
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
    submissionPhaseId: joi.id()
  }).required()
}

/**
 * Function to patch submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
function * patchSubmission (authUser, submissionId, entity) {
  return yield _updateSubmission(authUser, submissionId, entity)
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
    submissionPhaseId: joi.id()
  })
}

/**
 * Function to delete submission
 * @param {String} submissionId submissionId which need to be deleted
 * @return {Promise}
 */
function * deleteSubmission (submissionId) {
  const exist = yield _getSubmission(submissionId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      id: submissionId
    }
  }

  yield dbhelper.deleteRecord(filter)

  // Push Submission deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator: originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: submissionId
    }
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)
}

deleteSubmission.schema = {
  submissionId: joi.string().guid().required()
}

module.exports = {
  getSubmission,
  _getSubmission,
  downloadSubmission,
  listSubmissions,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission
}
