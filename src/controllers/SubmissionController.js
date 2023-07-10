/**
 * Submission Controller
 */

const SubmissionService = require('../services/SubmissionService')
const helper = require('../common/helper')

/**
 * Get submission details
 * @param req the http request
 * @param res the http response
 */
async function getSubmission (req, res) {
  res.json(await SubmissionService.getSubmission(req.authUser, req.params.submissionId))
}

/**
 * Download Submission from S3
 * @param req the http request
 * @param res the http response
 */
async function downloadSubmission (req, res) {
  const result = await SubmissionService.downloadSubmission(req.authUser, req.params.submissionId)
  let fileName
  if (result.submission.legacySubmissionId) {
    fileName = `submission-${result.submission.legacySubmissionId}-${result.submission.id}.zip`
  } else {
    fileName = `submission-${result.submission.id}.zip`
  }
  res.attachment(fileName)
  helper.createS3ReadStream(result.submission.url).pipe(res)
}

/**
 * List submissions from ES
 * @param req the http request
 * @param res the http response
 */
async function listSubmissions (req, res) {
  const data = await SubmissionService.listSubmissions(req.authUser, req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Upload and Create submission
 * @param req the http request
 * @param res the http response
 */
async function createSubmission (req, res) {
  res.json(await SubmissionService.createSubmission(req.authUser, req.files, req.body))
}

/**
 * Update submission
 * @param req the http request
 * @param res the http response
 */
async function updateSubmission (req, res) {
  res.json(await SubmissionService.updateSubmission(req.authUser, req.params.submissionId, req.body))
}

/**
 * Patch submission
 * @param req the http request
 * @param res the http response
 */
async function patchSubmission (req, res) {
  res.json(await SubmissionService.patchSubmission(req.authUser, req.params.submissionId, req.body))
}

/**
 * Delete submission
 * @param req the http request
 * @param res the http response
 */
async function deleteSubmission (req, res) {
  await SubmissionService.deleteSubmission(req.authUser, req.params.submissionId)
  res.status(204).send()
}

/**
 * Get submission count
 * @param req the http request
 * @param res the http response
 */
async function countSubmissions (req, res) {
  res.json(await SubmissionService.countSubmissions(req.params.challengeId))
}

module.exports = {
  getSubmission,
  downloadSubmission,
  listSubmissions,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission,
  countSubmissions
}
