/**
 * Artifact Controller
 */

const ArtifactService = require('../services/ArtifactService')

/**
 * Download Artifact from S3
 * @param req the http request
 * @param res the http response
 */
async function downloadArtifact (req, res) {
  const result = await ArtifactService.downloadArtifact(req.params.submissionId, req.params.file)
  res.attachment(result.fileName)
  res.send(result.file)
}

/**
 * List Artifacts from S3 bucket
 * @param req the http request
 * @param res the http response
 */
async function listArtifacts (req, res) {
  res.json(await ArtifactService.listArtifacts(req.authUser, req.params.submissionId))
}

/**
 * Upload and Create Artifact
 * @param req the http request
 * @param res the http response
 */
async function createArtifact (req, res) {
  res.json(await ArtifactService.createArtifact(req.files, req.params.submissionId, req.body))
}

/**
 * Delete artifact from S3
 * @param req the http request
 * @param res the http response
 */
async function deleteArtifact (req, res) {
  await ArtifactService.deleteArtifact(req.params.submissionId, req.params.file)
  res.status(204).json()
}

module.exports = {
  downloadArtifact,
  listArtifacts,
  createArtifact,
  deleteArtifact
}
