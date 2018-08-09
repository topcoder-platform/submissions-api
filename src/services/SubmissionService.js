/**
 * Submission Service
 */

const AWS = require('aws-sdk')
const config = require('config')
const errors = require('common-errors')
const joi = require('joi')
const _ = require('lodash')
const uuid = require('uuid/v4')
const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, fileType, events } = require('../../constants').busApiMeta
const s3 = new AWS.S3()

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

/**
 * Function to get submission based on ID from DynamoDB
 * This function will be used all by other functions to check existence of a submission
 * @param {String} submissionId submissionId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * _getSubmission (submissionId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      'id': submissionId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get submission based on ID from ES
 * @param {String} submissionId submissionId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * getSubmission (submissionId) {
  const response = yield helper.fetchFromES({id: submissionId}, helper.camelize(table))
  if (response.total === 0) {
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }
  // Return the retrieved submission
  return response.rows[0]
}

getSubmission.schema = {
  submissionId: joi.string().uuid().required()
}

/**
 * Function to list submissions from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
function * listSubmissions (query) {
  return yield helper.fetchFromES(query, helper.camelize(table))
}

listSubmissions.schema = {
  query: joi.object().keys({
    type: joi.string(),
    url: joi.string().uri().trim(),
    memberId: joi.string().uuid(),
    challengeId: joi.string().uuid(),
    page: joi.id(),
    perPage: joi.pageSize()
  })
}

/**
 * Function to upload and create submission
 * @param {Object} authUser Authenticated User
 * @param {Object} files Submission uploaded by the User
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createSubmission (authUser, files, entity) {
  if (files && entity.url) {
    throw new errors.HttpStatusError(400, `Either file to be uploaded or URL should be present`)
  }

  if (!files && !entity.url) {
    throw new errors.HttpStatusError(400, `Either file to be uploaded or URL should be present`)
  }

  let url = entity.url
  // Submission ID will be used for file name in S3 bucket as well
  const submissionId = uuid()

  if (files && files.submission) {
    const file = yield _uploadToS3(files.submission, submissionId)
    url = file.Location
  }

  const currDate = (new Date()).toISOString()

  const item = {
    'id': submissionId,
    'type': entity.type,
    'url': url,
    'memberId': entity.memberId,
    'challengeId': entity.challengeId,
    'created': currDate,
    'updated': currDate,
    'createdBy': authUser.handle,
    'updatedBy': authUser.handle
  }

  if (entity.legacySubmissionId) {
    item['legacySubmissionId'] = entity.legacySubmissionId
  }

  if (entity.submissionPhaseId) {
    item['submissionPhaseId'] = entity.submissionPhaseId
  }

  if (entity.fileType) {
    item['fileType'] = entity.fileType
  } else {
    item['fileType'] = fileType
  }

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  yield dbhelper.insertRecord(record)

  // Push Submission created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.create,
    'originator': originator,
    'timestamp': currDate, // time when submission was created
    'mime-type': mimeType,
    'payload': _.extend({ 'resource': helper.camelize(table) }, item)
  }

  // If the file is uploaded, set properties accordingly
  if (files && files.submission) {
    reqBody['payload']['isFileSubmission'] = true
    reqBody['payload']['filename'] = files.submission.name
  } else { // If the file URL is provided, handle accordingly
    reqBody['payload']['isFileSubmission'] = false
  }

  // Post to Bus API using Helper function
  yield helper.postToBusAPI(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the entity which is in compliance with Swagger
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
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
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
  const exist = yield _getSubmission(submissionId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }

  const currDate = (new Date()).toISOString()
  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      'id': submissionId
    },
    UpdateExpression: `set #type = :t, #url = :u, memberId = :m, challengeId = :c,
                        updated = :ua, updatedBy = :ub`,
    ExpressionAttributeValues: {
      ':t': entity.type || exist.type,
      ':u': entity.url || exist.url,
      ':m': entity.memberId || exist.memberId,
      ':c': entity.challengeId || exist.challengeId,
      ':ua': currDate,
      ':ub': authUser.handle
    },
    ExpressionAttributeNames: {
      '#type': 'type',
      '#url': 'url'
    }
  }

  // If legacy submission ID exists, add it to the update expression
  if (entity.legacySubmissionId || exist.legacySubmissionId) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, legacySubmissionId = :ls`
    record['ExpressionAttributeValues'][':ls'] = entity.legacySubmissionId || exist.legacySubmissionId
  }

  // If submissionPhaseId exists, add it to the update expression
  if (entity.submissionPhaseId || exist.submissionPhaseId) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, submissionPhaseId = :sp`
    record['ExpressionAttributeValues'][':sp'] = entity.submissionPhaseId || exist.submissionPhaseId
  }

  yield dbhelper.updateRecord(record)

  // Push Submission updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.update,
    'originator': originator,
    'timestamp': currDate, // time when submission was updated
    'mime-type': mimeType,
    'payload': _.extend({ 'resource': helper.camelize(table),
      'id': submissionId,
      'updated': currDate,
      'updatedBy': authUser.handle }, entity)
  }

  // Post to Bus API using Helper function
  yield helper.postToBusAPI(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity, { 'updated': currDate, 'updatedBy': authUser.handle })
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
    type: joi.string().required(),
    url: joi.string().uri().trim().required(),
    memberId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    challengeId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    legacySubmissionId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
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
    submissionPhaseId: joi.alternatives().try(joi.id(), joi.string().uuid())
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
      'id': submissionId
    }
  }

  yield dbhelper.deleteRecord(filter)

  // Push Submission deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.delete,
    'originator': originator,
    'timestamp': (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    'payload': {
      'resource': helper.camelize(table),
      'id': submissionId
    }
  }

  // Post to Bus API using Helper function
  yield helper.postToBusAPI(reqBody)
}

deleteSubmission.schema = {
  submissionId: joi.string().guid().required()
}

module.exports = {
  getSubmission,
  _getSubmission,
  listSubmissions,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission
}
