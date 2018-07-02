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
const s3 = new AWS.S3()

const table = 'Submission'

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @return {Promise}
 **/
function * _uploadToS3 (file) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: config.S3_BUCKET,
      Key: uuid(),
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
 * Function to get submission based on ID
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
 * Function to get submission based on ID
 * @param {String} submissionId submissionId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * getSubmission (submissionId) {
  const exist = yield _getSubmission(submissionId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Submission with ID = ${submissionId} is not found`)
  }
  // Return the retrieved submission
  return exist
}

getSubmission.schema = {
  submissionId: joi.string().uuid().required()
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

  if (files && files.submission) {
    const file = yield _uploadToS3(files.submission)
    console.log(file)
    url = file.Location
  }

  const currDate = (new Date()).toISOString()

  const item = {
    'id': uuid(),
    'type': entity.type,
    'url': url,
    'memberId': entity.memberId,
    'challengeId': entity.challengeId,
    'created': currDate,
    'updated': currDate,
    'createdBy': authUser.handle,
    'updatedBy': authUser.handle
  }

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  yield dbhelper.insertRecord(record)
  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the entity which is in compliance with Swagger
  return item
}

createSubmission.schema = {
  authUser: joi.object().required(),
  files: joi.any(),
  entity: joi.object().keys({
    type: joi.string().required(),
    url: joi.string().uri().trim(),
    memberId: joi.string().uuid().required(),
    challengeId: joi.string().uuid().required()
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
                        updatedAt = :ua, updatedBy = :ub`,
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
  yield dbhelper.updateRecord(record)
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
    memberId: joi.string().uuid().required(),
    challengeId: joi.string().uuid().required()
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
    memberId: joi.string().uuid(),
    challengeId: joi.string().uuid()
  })
}

/**
 * Function to delete submission
 * @param {String} submissionId submissionId which need to be deleted
 * @return {Promise}
 */
function * deleteSubmission (submissionId) {
  const exist = yield getSubmission(submissionId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${submissionId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      'id': submissionId
    }
  }

  yield dbhelper.deleteRecord(filter)
}

deleteSubmission.schema = {
  submissionId: joi.string().guid().required()
}

module.exports = {
  getSubmission,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission
}
