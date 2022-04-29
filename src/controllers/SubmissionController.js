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
function * getSubmission (req, res) {
  res.json(yield SubmissionService.getSubmission(req.authUser, req.params.submissionId))
}

/**
 * Download Submission from S3
 * @param req the http request
 * @param res the http response
 */
function * downloadSubmission (req, res) {
  const result = yield SubmissionService.downloadSubmission(req.authUser, req.params.submissionId)
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
function * listSubmissions (req, res) {
  const data = yield SubmissionService.listSubmissions(req.authUser, req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Upload and Create submission
 * @param req the http request
 * @param res the http response
 */
function * createSubmission (req, res) {
  res.json(yield SubmissionService.createSubmission(req.authUser, req.files, req.body))
}

/**
 * Update submission
 * @param req the http request
 * @param res the http response
 */
function * updateSubmission (req, res) {
  res.json(yield SubmissionService.updateSubmission(req.authUser, req.params.submissionId, req.body))
}

/**
 * Patch submission
 * @param req the http request
 * @param res the http response
 */
function * patchSubmission (req, res) {
  res.json(yield SubmissionService.patchSubmission(req.authUser, req.params.submissionId, req.body))
}

/**
 * Delete submission
 * @param req the http request
 * @param res the http response
 */
function * deleteSubmission (req, res) {
  yield SubmissionService.deleteSubmission(req.params.submissionId)
  res.status(204).send()
}

module.exports = {
  getSubmission,
  downloadSubmission,
  listSubmissions,
  createSubmission,
  updateSubmission,
  patchSubmission,
  deleteSubmission
}
