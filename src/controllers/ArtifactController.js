/**
 * Artifact Controller
 */

const ArtifactService = require('../services/ArtifactService')

/**
 * Download Artifact from S3
 * @param req the http request
 * @param res the http response
 */
function * downloadArtifact (req, res) {
  const result = yield ArtifactService.downloadArtifact(req.params.submissionId, req.params.file)
  res.attachment(result.fileName)
  res.send(result.file)
}

/**
 * List Artifacts from S3 bucket
 * @param req the http request
 * @param res the http response
 */
function * listArtifacts (req, res) {
  res.json(yield ArtifactService.listArtifacts(req.params.submissionId))
}

/**
 * Upload and Create Artifact
 * @param req the http request
 * @param res the http response
 */
function * createArtifact (req, res) {
  res.json(yield ArtifactService.createArtifact(req.files, req.params.submissionId, req.body))
}

/**
 * Delete artifact from S3
 * @param req the http request
 * @param res the http response
 */
function * deleteArtifact (req, res) {
  yield ArtifactService.deleteArtifact(req.params.submissionId, req.params.file)
  res.status(204).json()
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact,
  deleteArtifact
}
