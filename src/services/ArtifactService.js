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
const tracer = require('../common/tracer')

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
 * @param {Object} span the Span object
 * @return {Object} File downloaded from S3
 */
function * downloadArtifact (submissionId, fileName, span) {
  const downloadArtifactSpan = tracer.startChildSpans('ArtifactService.downloadArtifactSpan', span)
  downloadArtifactSpan.setTag('submissionId', submissionId)
  downloadArtifactSpan.setTag('fileName', fileName)

  try {
    // Check the validness of Submission ID
    yield HelperService._checkRef({submissionId}, downloadArtifactSpan)

    const listObjectsSpan = tracer.startChildSpans('S3.listObjects', downloadArtifactSpan)
    listObjectsSpan.setTag('Bucket', config.aws.ARTIFACT_BUCKET)
    listObjectsSpan.setTag('Prefix', `${submissionId}/${fileName}`)

    let artifacts
    try {
      artifacts = yield s3.listObjects({Bucket: config.aws.ARTIFACT_BUCKET, Prefix: `${submissionId}/${fileName}`}).promise()
      if (artifacts.Contents.length === 0) {
        throw new errors.HttpStatusError(400, `Artifact ${fileName} doesn't exist for ${submissionId}`)
      }
    } finally {
      listObjectsSpan.finish()
    }

    const key = artifacts.Contents[0].Key

    const getObjectsSpan = tracer.startChildSpans('S3.getObject', downloadArtifactSpan)
    getObjectsSpan.setTag('Bucket', config.aws.ARTIFACT_BUCKET)
    getObjectsSpan.setTag('Key', key)

    let downloadedFile
    try {
      downloadedFile = yield s3.getObject({ Bucket: config.aws.ARTIFACT_BUCKET, Key: key }).promise()
    } finally {
      getObjectsSpan.finish()
    }

    // Return the retrieved Artifact
    logger.info(`downloadArtifact: returning artifact ${fileName} for Submission ID: ${submissionId}`)

    return { fileName: key.substring(key.lastIndexOf('/') + 1), file: downloadedFile.Body }
  } finally {
    downloadArtifactSpan.finish()
  }
}

downloadArtifact.schema = {
  submissionId: joi.string().uuid().required(),
  fileName: joi.string().trim().required()
}

/**
 * Function to list Artifacts present in S3 bucket
 * @param {String} submissionId Submission ID
 * @param {Object} span the Span object
 * @return {Object} List of files present in S3 bucket under submissionId directory
 */
function * listArtifacts (submissionId, span) {
  const listArtifactsSpan = tracer.startChildSpans('ArtifactService.listArtifacts', span)
  listArtifactsSpan.setTag('submissionId', submissionId)

  try {
    // Check the validness of Submission ID
    yield HelperService._checkRef({submissionId}, listArtifactsSpan)

    const listObjectsSpan = tracer.startChildSpans('S3.listObjects', listArtifactsSpan)
    listObjectsSpan.setTag('Bucket', config.aws.ARTIFACT_BUCKET)
    listObjectsSpan.setTag('Prefix', submissionId)

    let artifacts
    try {
      artifacts = yield s3.listObjects({Bucket: config.aws.ARTIFACT_BUCKET, Prefix: submissionId}).promise()
    } finally {
      listObjectsSpan.finish()
    }

    return { artifacts: _.map(artifacts.Contents, (at) => path.parse(at.Key).name) }
  } finally {
    listArtifactsSpan.finish()
  }
}

listArtifacts.schema = {
  submissionId: joi.string().uuid().required()
}

/**
 * Function to upload and create Artifact
 * @param {Object} files Artifact uploaded by the User
 * @param {String} submissionId Submission ID
 * @param {Object} entity Data to be inserted
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * createArtifact (files, submissionId, entity, span) {
  const createArtifactSpan = tracer.startChildSpans('ArtifactService.createArtifact', span)
  createArtifactSpan.setTag('submissionId', submissionId)

  try {
    // Check the presence of submissionId and reviewTypeId in DynamoDB
    entity.submissionId = submissionId
    yield HelperService._checkRef(entity, createArtifactSpan)
    let fileName
    logger.info('Creating a new Artifact')
    if (files && files.artifact) {
      const uFileType = fileTypeFinder(files.artifact.data).ext // File type of uploaded file
      fileName = `${submissionId}/${entity.typeId}.${uFileType}`

      const headObjectSpan = tracer.startChildSpans('S3.headObject', createArtifactSpan)
      headObjectSpan.setTag('Bucket', config.aws.ARTIFACT_BUCKET)
      headObjectSpan.setTag('Key', fileName)

      // Check the existence of file in S3 bucket
      let exist
      try {
        exist = yield s3.headObject({ Bucket: config.aws.ARTIFACT_BUCKET,
          Key: fileName}).promise()
      } catch (err) {
        if (err.statusCode !== 404) throw err
      } finally {
        headObjectSpan.finish()
      }

      if (exist) {
        throw new errors.HttpStatusError(409, `Artifact ${entity.typeId}.${uFileType} already exists for Submission ${submissionId}`)
      }

      const uploadToS3Span = tracer.startChildSpans('S3.upload', createArtifactSpan)
      uploadToS3Span.setTag('Key', fileName)
      try {
        // Upload the artifact to S3
        yield _uploadToS3(files.artifact, fileName)
      } finally {
        uploadToS3Span.finish()
      }
    } else {
      throw new errors.HttpStatusError(400, 'Artifact is missing or not under attribute `artifact`')
    }
    return { artifact: fileName.substring(fileName.lastIndexOf('/') + 1) }
  } finally {
    createArtifactSpan.finish()
  }
}

createArtifact.schema = {
  files: joi.any().required(),
  submissionId: joi.string().guid().required(),
  entity: joi.object().keys({
    typeId: joi.string().uuid().required()
  }).required()
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact
}
