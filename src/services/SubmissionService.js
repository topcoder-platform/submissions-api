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
const tracer = require('../common/tracer')

const table = 'Submission'

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @param {String} name File name
 * @param {Object} parentSpan the parent Span object
 * @return {Promise}
 **/
function * _uploadToS3 (file, name, parentSpan) {
  const uploadToS3Span = tracer.startChildSpans('SubmissionService._uploadToS3', parentSpan)
  uploadToS3Span.setTag('Key', name)

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
      if (err) {
        uploadToS3Span.setTag('error', true)
        uploadToS3Span.finish()
        return reject(err)
      } else {
        uploadToS3Span.finish()
        return resolve(data)
      }
    })
  })
}

/**
 * Function to get reviews for submission based on ID from DynamoDB
 * @param {String} submissionId submissionId to be used
 * @param {Object} parentSpan the parent Span object
 * @return {Object} Data retrieved from database
 */
function * _getReviewsForSubmission (submissionId, parentSpan) {
  const childSpan = tracer.startChildSpans('SubmissionService._getReviewsForSubmission', parentSpan)
  childSpan.setTag('submissionId', submissionId)

  try {
    const reviewFilter = {
      TableName: 'Review',
      IndexName: submissionIndex,
      KeyConditionExpression: 'submissionId = :p_submissionId',
      ExpressionAttributeValues: {
        ':p_submissionId': submissionId
      }
    }

    return yield dbhelper.queryRecords(reviewFilter, childSpan)
  } finally {
    childSpan.finish()
  }
}

/**
 * Function to get review summations for submission based on ID from DynamoDB
 * @param {String} submissionId submissionId to be used
 * @param {Object} parentSpan the parent Span object
 * @return {Object} Data retrieved from database
 */
function * _getReviewSummationsForSubmission (submissionId, parentSpan) {
  const childSpan = tracer.startChildSpans('SubmissionService._getReviewSummationsForSubmission', parentSpan)
  childSpan.setTag('submissionId', submissionId)

  try {
    const reviewSummationFilter = {
      TableName: 'ReviewSummation',
      IndexName: submissionIndex,
      KeyConditionExpression: 'submissionId = :p_submissionId',
      ExpressionAttributeValues: {
        ':p_submissionId': submissionId
      }
    }

    return yield dbhelper.queryRecords(reviewSummationFilter, childSpan)
  } finally {
    childSpan.finish()
  }
}

/**
 * Function to get submission based on ID from DynamoDB
 * This function will be used all by other functions to check existence of a submission
 * @param {String} submissionId submissionId which need to be retrieved
 * @param {Object} parentSpan the parent Span object
 * @param {Boolean} fetchReview if True, associated reviews and review summations will be fetched
 * @return {Object} Data retrieved from database
 */
function * _getSubmission (submissionId, parentSpan, fetchReview = true) {
  const getSubmissionSpan = tracer.startChildSpans('SubmissionService._getSubmission', parentSpan)
  getSubmissionSpan.setTag('submissionId', submissionId)
  getSubmissionSpan.setTag('fetchReview', fetchReview)

  try {
    // Construct filter to retrieve record from Database
    const filter = {
      TableName: table,
      Key: {
        'id': submissionId
      }
    }
    const result = yield dbhelper.getRecord(filter, getSubmissionSpan)
    const submission = result.Item
    if (fetchReview) {
      // Fetch associated reviews
      const review = yield _getReviewsForSubmission(submissionId, getSubmissionSpan)

      if (review.Count !== 0) {
        submission.review = review.Items
      }
      // Fetch associated review summations
      const reviewSummation = yield _getReviewSummationsForSubmission(submissionId, getSubmissionSpan)

      if (reviewSummation.Count !== 0) {
        submission.reviewSummation = reviewSummation.Items
      }
    }
    return submission
  } finally {
    getSubmissionSpan.finish()
  }
}

/**
 * Function to get submission based on ID from ES
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be retrieved
 * @param {Object} span the Span object
 * @return {Object} Data retrieved from database
 */
function * getSubmission (authUser, submissionId, span) {
  const getSubmissionSpan = tracer.startChildSpans('SubmissionService.getSubmission', span)
  getSubmissionSpan.setTag('submissionId', submissionId)

  try {
    const response = yield helper.fetchFromES({id: submissionId}, helper.camelize(table), getSubmissionSpan)
    let submissionRecord = null
    logger.info(`getSubmission: fetching submissionId ${submissionId}`)
    if (response.total === 0) { // CWD-- not in ES yet maybe? let's grab from the DB
      logger.info(`getSubmission: submissionId not found in ES: ${submissionId}`)
      submissionRecord = yield _getSubmission(submissionId, getSubmissionSpan)

      if (!_.get(submissionRecord, 'id', null)) {
        logger.info(`getSubmission: submissionId not found in ES nor the DB: ${submissionId}`)
        submissionRecord = null
      }
    } else {
      logger.info(`getSubmission: submissionId found in ES: ${submissionId}`)
      submissionRecord = response.rows[0]

      if (!submissionRecord.review || submissionRecord.review.length < 1) {
        logger.info(`submission ${submissionId} from ES has no reviews. Double checking the db`)
        const review = yield _getReviewsForSubmission(submissionId, getSubmissionSpan)
        logger.info(`${review}`)
        submissionRecord.review = review.Items || []
      }

      if (!submissionRecord.reviewSummation || submissionRecord.reviewSummation.length < 1) {
        logger.info(`submission ${submissionId} from ES has no reviewSummations. Double checking the db`)
        const reviewSummation = yield _getReviewSummationsForSubmission(submissionId, getSubmissionSpan)
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
      yield helper.checkGetAccess(authUser, submissionRecord, getSubmissionSpan)
    }

    // Return the retrieved submission
    logger.info(`getSubmission: returning data for submissionId: ${submissionId}`)
    return submissionRecord
  } finally {
    getSubmissionSpan.finish()
  }
}

getSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required()
}

/**
 * Function to download submission from S3
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId ID of the Submission which need to be retrieved
 * @param {Object} span the Span object
 * @return {Object} Submission retrieved from S3
 */
function * downloadSubmission (authUser, submissionId, span) {
  const downloadSubmissionSpan = tracer.startChildSpans('SubmissionService.downloadSubmission', span)
  downloadSubmissionSpan.setTag('submissionId', submissionId)

  try {
    const record = yield getSubmission(authUser, submissionId, downloadSubmissionSpan)
    const downloadedFile = yield helper.downloadFile(record.url, downloadSubmissionSpan)
    return { submission: record, file: downloadedFile }
  } finally {
    downloadSubmissionSpan.finish()
  }
}

downloadSubmission.schema = {
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required()
}

/**
 * Function to list submissions from Elastic Search
 * @param {Object} authUser Authenticated User
 * @param {Object} query Query filters passed in HTTP request
 * @param {Object} span the Span object
 * @return {Object} Data fetched from ES
 */
function * listSubmissions (authUser, query, span) {
  const listSubmissionsSpan = tracer.startChildSpans('SubmissionService.listSubmissions', span)
  let data = []

  try {
    data = yield helper.fetchFromES(query, helper.camelize(table), listSubmissionsSpan)
    logger.info(`listSubmissions: returning ${data.rows.length} submissions for query: ${JSON.stringify(query)}`)

    data.rows = _.map(data.rows, (submission) => {
      if (submission.review) {
        submission.review = helper.cleanseReviews(submission.review, authUser)
      }
      return submission
    })
  } finally {
    listSubmissionsSpan.finish()
  }

  return data
}

const listSubmissionsQuerySchema = {
  type: joi.string(),
  url: joi.string().uri().trim(),
  memberId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  legacyUploadId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder(),
  'review.score': joi.score(),
  'review.legacyReviewId': joi.id(),
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
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * createSubmission (authUser, files, entity, span) {
  const createSubmissionSpan = tracer.startChildSpans('SubmissionService.createSubmission', span)

  try {
    logger.info('Creating a new submission')
    if (files && entity.url) {
      logger.info('Cannot create submission. Neither file nor url to upload has been passed')
      throw new errors.HttpStatusError(400, `Either file to be uploaded or URL should be present`)
    }

    if (!files && !entity.url) {
      logger.info('Cannot create submission. Ambiguous parameters. Both file and url have been provided. Unsure which to use')
      throw new errors.HttpStatusError(400, `Either file to be uploaded or URL should be present`)
    }

    let url = entity.url
    // Submission ID will be used for file name in S3 bucket as well
    const submissionId = uuid()

    if (files && files.submission) {
      const pFileType = entity.fileType || fileType // File type parameter
      const uFileType = fileTypeFinder(files.submission.data).ext // File type of uploaded file
      if (pFileType !== uFileType) {
        logger.info('Actual file type of the file does not match the file type attribute in the request')
        throw new errors.HttpStatusError(400, `fileType parameter doesn't match the type of the uploaded file`)
      }
      const file = yield _uploadToS3(files.submission, `${submissionId}.${uFileType}`, createSubmissionSpan)
      url = file.Location
    } else if (files) {
      throw new errors.HttpStatusError(400, 'The file should be uploaded under the "submission" attribute')
    }

    const currDate = (new Date()).toISOString()

    const item = {
      id: submissionId,
      type: entity.type,
      url: url,
      memberId: entity.memberId,
      challengeId: entity.challengeId,
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
      item.submissionPhaseId = yield helper.getSubmissionPhaseId(entity.challengeId, createSubmissionSpan)
    }

    if (entity.fileType) {
      item.fileType = entity.fileType
    } else {
      item.fileType = fileType
    }

    logger.info('Check User access before creating the submission')
    if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
      yield helper.checkCreateAccess(authUser, item, createSubmissionSpan)
    }

    // Prepare record to be inserted
    const record = {
      TableName: table,
      Item: item
    }

    logger.info('Prepared submission item to insert into Dynamodb. Inserting...')
    yield dbhelper.insertRecord(record, createSubmissionSpan)

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

    logger.info('Prepared submission create event payload to pass to THE bus')

    // Post to Bus API using Client
    yield helper.postToBusApi(reqBody, createSubmissionSpan)

    // Inserting records in DynamoDB doesn't return any response
    // Hence returning the entity which is in compliance with Swagger
    return item
  } finally {
    createSubmissionSpan.finish()
  }
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
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
  }).required()
}

/*
 * Function to update submission
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be updated
 * @param {Object} entity Data to be updated
 * @param {Object} parentSpan the parent Span object
 * @return {Promise}
 **/
function * _updateSubmission (authUser, submissionId, entity, parentSpan) {
  const updateSubmissionSpan = tracer.startChildSpans('SubmissionService._updateSubmission', parentSpan)
  updateSubmissionSpan.setTag('submissionId', submissionId)

  try {
    logger.info(`Updating submission with submission id ${submissionId}`)

    const exist = yield _getSubmission(submissionId, updateSubmissionSpan)
    if (!exist) {
      logger.info(`Submission with ID = ${submissionId} is not found`)
      throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
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

    yield dbhelper.updateRecord(record, updateSubmissionSpan)
    const updatedSub = yield _getSubmission(submissionId, updateSubmissionSpan)

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
    yield helper.postToBusApi(reqBody, updateSubmissionSpan)

    // Updating records in DynamoDB doesn't return any response
    // Hence returning the response which will be in compliance with Swagger
    return _.extend(exist, entity, { 'updated': currDate, 'updatedBy': authUser.handle || authUser.sub })
  } finally {
    updateSubmissionSpan.finish()
  }
}

/**
 * Function to update submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be updated
 * @param {Object} entity Data to be updated
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * updateSubmission (authUser, submissionId, entity, span) {
  return yield _updateSubmission(authUser, submissionId, entity, span)
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
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
  }).required()
}

/**
 * Function to patch submission
 * @param {Object} authUser Authenticated User
 * @param {String} submissionId submissionId which need to be patched
 * @param {Object} entity Data to be patched
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * patchSubmission (authUser, submissionId, entity, span) {
  return yield _updateSubmission(authUser, submissionId, entity, span)
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
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
  })
}

/**
 * Function to delete submission
 * @param {Object} authUser Authenticated user (that is making the request)
 * @param {String} submissionId submissionId which need to be deleted
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * deleteSubmission (authUser, submissionId, span) {
  const deleteSubmissionSpan = tracer.startChildSpans('SubmissionService.deleteSubmission', span)
  deleteSubmissionSpan.setTag('submissionId', submissionId)

  try {
    const submissionRecord = yield _getSubmission(submissionId, deleteSubmissionSpan)
    if (!submissionRecord) {
      throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
    }

    if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
      // If not administrator, verify that the submission is owned by the user
      if (submissionRecord.memberId !== authUser.userId) {
        throw new errors.HttpStatusError(403, 'You cannot access other member\'s submission')
      }

      // Now verify that the Submission phase for the challenge is still active
      // If not, non admin user cannot delete the submission
      const activeSubmissionPhaseId = yield helper.getSubmissionPhaseId(submissionRecord.challengeId, deleteSubmissionSpan)

      if (!activeSubmissionPhaseId) {
        throw new errors.HttpStatusError(403, 'You cannot delete the submission because submission phase is not active')
      }
    }

    // All checks passed - proceed to delete
    // First, delete reviews and review summations for the submission
    if (submissionRecord.review) {
      const reviewService = require('./ReviewService')
      for (let i = 0; i < submissionRecord.review.length; i++) {
        const review = submissionRecord.review[i]
        yield reviewService.deleteReview(review.id, deleteSubmissionSpan)
      }
    }

    if (submissionRecord.reviewSummation) {
      const reviewSummationService = require('./ReviewSummationService')
      for (let i = 0; i < submissionRecord.reviewSummation.length; i++) {
        const reviewSummation = submissionRecord.reviewSummation[i]
        yield reviewSummationService.deleteReviewSummation(reviewSummation.id, deleteSubmissionSpan)
      }
    }

    // Importing at the beginning of this service causes a circular dependency. Hence, dynamically invoking it
    const artifactService = require('./ArtifactService')

    // Next delete the artifacts for the submission
    const submissionArtifacts = yield artifactService.listArtifacts(submissionRecord.id, deleteSubmissionSpan)

    for (let i = 0; i < submissionArtifacts.artifacts.length; i++) {
      yield artifactService.deleteArtifact(submissionRecord.id, submissionArtifacts.artifacts[i], deleteSubmissionSpan)
    }

    // Finally delete the submission itself
    const filter = {
      TableName: table,
      Key: {
        id: submissionId
      }
    }

    yield dbhelper.deleteRecord(filter, deleteSubmissionSpan)

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
    yield helper.postToBusApi(reqBody, deleteSubmissionSpan)
  } finally {
    deleteSubmissionSpan.finish()
  }
}

deleteSubmission.schema = {
  authUser: joi.object().required(),
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
