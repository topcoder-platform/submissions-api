/**
 * Artifact Controller
 */

const ArtifactService = require('../services/ArtifactService')
const { logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Download Artifact from S3
 * @param req the http request
 * @param res the http response
 */
function * downloadArtifact (req, res) {
  const result = yield ArtifactService.downloadArtifact(req.params.submissionId, req.params.file, req.span)
  res.attachment(result.fileName)

  logResultOnSpan(req.span, httpStatus.OK)

  res.send(result.file)
}

/**
 * List Artifacts from S3 bucket
 * @param req the http request
 * @param res the http response
 */
function * listArtifacts (req, res) {
  const result = yield ArtifactService.listArtifacts(req.params.submissionId, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Upload and Create Artifact
 * @param req the http request
 * @param res the http response
 */
function * createArtifact (req, res) {
  const result = yield ArtifactService.createArtifact(req.files, req.params.submissionId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Delete artifact from S3
 * @param req the http request
 * @param res the http response
 */
function * deleteArtifact (req, res) {
  yield ArtifactService.deleteArtifact(req.params.submissionId, req.params.file, req.span)

  logResultOnSpan(req.span, httpStatus.NO_CONTENT)

  res.status(204).send()
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact,
  deleteArtifact
}
