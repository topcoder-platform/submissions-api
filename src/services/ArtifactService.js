/**
 * Artifact Service
 */

const AWS = require('aws-sdk')
const config = require('config')
const errors = require('common-errors')
const FileType = require('file-type')
const joi = require('joi')
const path = require('path')
const _ = require('lodash')
const s3 = new AWS.S3()
const logger = require('../common/logger')
const HelperService = require('./HelperService')
const commonHelper = require('../common/helper')

/*
 * Function to upload file to S3
 * @param {Object} file File to be uploaded
 * @param {String} name File name
 * @return {Promise}
 **/
async function _uploadToS3 (file, name) {
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
 * @return {Promise<Object>} File downloaded from S3
 */
async function downloadArtifact (authUser, submissionId, fileName) {
  // Check the validness of Submission ID
  const submission = await HelperService._checkRef({ submissionId })

  let challenge
  try {
    challenge = await commonHelper.getChallenge(submission.challengeId)
  } catch (e) {
    throw new errors.NotFoundError(`Could not load challenge: ${submission.challengeId}.\n Details: ${_.get(e, 'message')}`)
  }

  const { hasFullAccess, isSubmitter, hasNoAccess } = await commonHelper.getChallengeAccessLevel(authUser, submission.challengeId)

  if (hasNoAccess || (isSubmitter && challenge.isMM && submission.memberId.toString() !== authUser.userId.toString())) {
    throw new errors.HttpStatusError(403, 'You are not allowed to download this submission artifact.')
  }

  if (fileName.includes('internal') && !hasFullAccess) {
    throw new errors.HttpStatusError(403, 'Could not access artifact.')
  }

  const prefix = submissionId + '/' + fileName
  const artifacts = await s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: prefix }).promise()

  if (artifacts.Contents.length === 0) {
    throw new errors.HttpStatusError(400, `Artifact ${fileName} doesn't exist for ${submissionId}`)
  }

  const key = _.get(_.find(artifacts.Contents, { Key: `${prefix}.zip` }) || (artifacts.Contents.length === 1 ? artifacts.Contents[0] : {}), 'Key', null)
  if (!key) {
    throw new errors.HttpStatusError(400, `Artifact ${fileName} doesn't exist for ${submissionId}`)
  }

  const downloadedFile = await s3.getObject({ Bucket: config.aws.ARTIFACT_BUCKET, Key: key }).promise()
  // Return the retrieved Artifact
  logger.info(`downloadArtifact: returning artifact ${fileName} for Submission ID: ${submissionId}`)
  return { fileName: key.substring(key.lastIndexOf('/') + 1), file: downloadedFile.Body }
}

downloadArtifact.schema = joi.object({
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required(),
  fileName: joi.string().trim().required()
}).required()

/**
 * Function to list Artifacts present in S3 bucket
 * @param {String} submissionId Submission ID
 * @return {Promise<Object>} List of files present in S3 bucket under submissionId directory
 */
async function listArtifacts (authUser, submissionId) {
  // Check the validness of Submission ID
  const submission = await HelperService._checkRef({ submissionId })

  let challenge
  try {
    challenge = await commonHelper.getChallenge(submission.challengeId)
  } catch (e) {
    throw new errors.NotFoundError(`Could not load challenge: ${submission.challengeId}.\n Details: ${_.get(e, 'message')}`)
  }

  const { hasFullAccess, isSubmitter, hasNoAccess } = await commonHelper.getChallengeAccessLevel(authUser, submission.challengeId)

  if (hasNoAccess || (isSubmitter && challenge.isMM && submission.memberId.toString() !== authUser.userId.toString())) {
    throw new errors.HttpStatusError(403, 'You are not allowed to access this submission artifact.')
  }

  const artifacts = await s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: submissionId }).promise()
  const artifactsContents = _.map(artifacts.Contents, (at) => path.parse(at.Key).name)
  return { artifacts: hasFullAccess ? artifactsContents : _.filter(artifactsContents, artifactName => !artifactName.includes('internal')) }
}

listArtifacts.schema = joi.object({
  authUser: joi.object().required(),
  submissionId: joi.string().uuid().required()
}).required()

/**
 * Function to upload and create Artifact
 * @param {Object} files Artifact uploaded by the User
 * @param {String} submissionId Submission ID
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createArtifact (files, submissionId, entity) {
  // Check the presence of submissionId and reviewTypeId in DynamoDB
  entity.submissionId = submissionId
  await HelperService._checkRef(entity)
  let fileName
  logger.info('Creating a new Artifact')
  if (files && files.artifact) {
    const uFileType = (await FileType.fromBuffer(files.artifact.data)).ext // File type of uploaded file
    fileName = `${submissionId}/${files.artifact.name.split('.').slice(0, -1)}.${uFileType}`

    // Upload the artifact to S3
    await _uploadToS3(files.artifact, fileName)
  } else {
    throw new errors.HttpStatusError(400, 'Artifact is missing or not under attribute `artifact`')
  }
  return { artifact: fileName.substring(fileName.lastIndexOf('/') + 1) }
}

createArtifact.schema = joi.object({
  files: joi.any().required(),
  submissionId: joi.string().guid().required(),
  entity: joi.object()
}).required()

/**
 * Function to delete Artifact from S3
 * @param {String} submissionId Submission ID
 * @param {String} fileName File name which need to be deleted from S3
 */
async function deleteArtifact (submissionId, fileName) {
  // Check the validness of Submission ID
  await HelperService._checkRef({ submissionId })
  const artifacts = await s3.listObjects({ Bucket: config.aws.ARTIFACT_BUCKET, Prefix: `${submissionId}/${fileName}` }).promise()
  if (artifacts.Contents.length === 0) {
    throw new errors.HttpStatusError(404, `Artifact ${fileName} doesn't exist for submission ID: ${submissionId}`)
  }
  // Delete the object from S3
  await s3.deleteObject({ Bucket: config.aws.ARTIFACT_BUCKET, Key: artifacts.Contents[0].Key }).promise()
  logger.info(`deleteArtifact: deleted artifact ${fileName} of Submission ID: ${submissionId}`)
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact,
  deleteArtifact
}
