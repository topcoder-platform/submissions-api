/**
 * Submission Controller
 */

const SubmissionService = require('../services/SubmissionService')
const { setPaginationHeaders, logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Get submission details
 * @param req the http request
 * @param res the http response
 */
function * getSubmission (req, res) {
  const result = yield SubmissionService.getSubmission(req.authUser, req.params.submissionId, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Download Submission from S3
 * @param req the http request
 * @param res the http response
 */
function * downloadSubmission (req, res) {
  const result = yield SubmissionService.downloadSubmission(req.authUser, req.params.submissionId, req.span)
  let fileName
  if (result.submission.legacySubmissionId) {
    fileName = `submission-${result.submission.legacySubmissionId}-${result.submission.id}.zip`
  } else {
    fileName = `submission-${result.submission.id}.zip`
  }
  res.attachment(fileName)

  logResultOnSpan(req.span, httpStatus.OK)

  res.send(result.file)
}

/**
 * List submissions from ES
 * @param req the http request
 * @param res the http response
 */
function * listSubmissions (req, res) {
  const data = yield SubmissionService.listSubmissions(req.query, req.span)
  setPaginationHeaders(req, res, data)
}

/**
 * Upload and Create submission
 * @param req the http request
 * @param res the http response
 */
function * createSubmission (req, res) {
  const result = yield SubmissionService.createSubmission(req.authUser, req.files, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Update submission
 * @param req the http request
 * @param res the http response
 */
function * updateSubmission (req, res) {
  const result = yield SubmissionService.updateSubmission(req.authUser, req.params.submissionId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Patch submission
 * @param req the http request
 * @param res the http response
 */
function * patchSubmission (req, res) {
  const result = yield SubmissionService.patchSubmission(req.authUser, req.params.submissionId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Delete submission
 * @param req the http request
 * @param res the http response
 */
function * deleteSubmission (req, res) {
  yield SubmissionService.deleteSubmission(req.params.submissionId, req.span)

  logResultOnSpan(req.span, httpStatus.NO_CONTENT)

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
