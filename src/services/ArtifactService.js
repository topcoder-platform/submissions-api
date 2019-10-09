/**
 * Artifact Service
 */

const AWS = require('aws-sdk')
const config = require('config')
const errors = require('common-errors')
const fileTypeFinder = require('file-type')
const joi = require('joi')
const path = require('path')
const _ = require('lodash')
const s3 = new AWS.S3()
const logger = require('../common/logger')
const HelperService = require('./HelperService')

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @param {String} name File name
 * @return {Promise}
 **/
function * _uploadToS3 (file, name) {
  const params = {
    Bucket: config.aws.ARTIFACT_BUCKET,
    Key: name,
    Body: file.data,
    ContentType: file.mimetype,
    Metadata: {
      originalname: file.name
    }
  }
  // Upload to S3
  return s3.upload(params).promise()
}

/**
 * Function to download Artifact from S3
 * @param {String} submissionId Submission ID
 * @param {String} fileName File name which need to be downloaded from S3
 * @return {Object} File downloaded from S3
 */
function * downloadArtifact (submissionId, fileName) {
  // Check the validness of Submission ID
  yield HelperService._checkRef({ submissionId })
  const artifacts = yield s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: `${submissionId}/${fileName}` }).promise()
  if (artifacts.Contents.length === 0) {
    throw new errors.HttpStatusError(400, `Artifact ${fileName} doesn't exist for ${submissionId}`)
  }
  const key = artifacts.Contents[0].Key
  const downloadedFile = yield s3.getObject({ Bucket: config.aws.ARTIFACT_BUCKET, Key: key }).promise()
  // Return the retrieved Artifact
  logger.info(`downloadArtifact: returning artifact ${fileName} for Submission ID: ${submissionId}`)
  return { fileName: key.substring(key.lastIndexOf('/') + 1), file: downloadedFile.Body }
}

downloadArtifact.schema = {
  submissionId: joi.string().uuid().required(),
  fileName: joi.string().trim().required()
}

/**
 * Function to list Artifacts present in S3 bucket
 * @param {String} submissionId Submission ID
 * @return {Object} List of files present in S3 bucket under submissionId directory
 */
function * listArtifacts (submissionId) {
  // Check the validness of Submission ID
  yield HelperService._checkRef({ submissionId })
  const artifacts = yield s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: submissionId }).promise()
  return { artifacts: _.map(artifacts.Contents, (at) => path.parse(at.Key).name) }
}

listArtifacts.schema = {
  submissionId: joi.string().uuid().required()
}

/**
 * Function to upload and create Artifact
 * @param {Object} files Artifact uploaded by the User
 * @param {String} submissionId Submission ID
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createArtifact (files, submissionId, entity) {
  // Check the presence of submissionId and reviewTypeId in DynamoDB
  entity.submissionId = submissionId
  yield HelperService._checkRef(entity)
  let fileName
  logger.info('Creating a new Artifact')
  if (files && files.artifact) {
    const uFileType = fileTypeFinder(files.artifact.data).ext // File type of uploaded file
    fileName = `${submissionId}/${files.artifact.name}.${uFileType}`

    // Upload the artifact to S3
    yield _uploadToS3(files.artifact, fileName)
  } else {
    throw new errors.HttpStatusError(400, 'Artifact is missing or not under attribute `artifact`')
  }
  return { artifact: fileName.substring(fileName.lastIndexOf('/') + 1) }
}

createArtifact.schema = {
  files: joi.any().required(),
  submissionId: joi.string().guid().required(),
  entity: joi.object()
}

/**
 * Function to delete Artifact from S3
 * @param {String} submissionId Submission ID
 * @param {String} fileName File name which need to be deleted from S3
 */
function * deleteArtifact (submissionId, fileName) {
  // Check the validness of Submission ID
  yield HelperService._checkRef({ submissionId })
  const artifacts = yield s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: `${submissionId}/${fileName}` }).promise()
  if (artifacts.Contents.length === 0) {
    throw new errors.HttpStatusError(404, `Artifact ${fileName} doesn't exist for submission ID: ${submissionId}`)
  }
  // Delete the object from S3
  yield s3.deleteObject({ Bucket: config.aws.ARTIFACT_BUCKET, Key: artifacts.Contents[0].Key }).promise()
  logger.info(`deleteArtifact: deleted artifact ${fileName} of Submission ID: ${submissionId}`)
}

downloadArtifact.schema = {
  submissionId: joi.string().uuid().required(),
  fileName: joi.string().trim().required()
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact,
  deleteArtifact
}
