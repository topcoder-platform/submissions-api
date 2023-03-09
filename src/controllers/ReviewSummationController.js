/**
 * ReviewSummation Controller
 */

const ReviewSummationService = require('../services/ReviewSummationService')
const helper = require('../common/helper')

/**
 * Get review summation
 * @param req the http request
 * @param res the http response
 */
async function getReviewSummation(req, res) {
  res.json(await ReviewSummationService.getReviewSummation(req.params.reviewSummationId))
}

/**
 * List Review Summations from ES
 * @param req the http request
 * @param res the http response
 */
async function listReviewSummations(req, res) {
  const data = await ReviewSummationService.listReviewSummations(req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Create review summation
 * @param req the http request
 * @param res the http response
 */
async function createReviewSummation(req, res) {
  res.json(await ReviewSummationService.createReviewSummation(req.authUser, req.body))
}

/**
 * Update review summation
 * @param req the http request
 * @param res the http response
 */
async function updateReviewSummation(req, res) {
  res.json(await ReviewSummationService.updateReviewSummation(req.authUser, req.params.reviewSummationId, req.body))
}

/**
 * Patch review summation
 * @param req the http request
 * @param res the http response
 */
async function patchReviewSummation(req, res) {
  res.json(await ReviewSummationService.patchReviewSummation(req.authUser, req.params.reviewSummationId, req.body))
}

/**
 * Delete review summation
 * @param req the http request
 * @param res the http response
 */
async function deleteReviewSummation(req, res) {
  await ReviewSummationService.deleteReviewSummation(req.params.reviewSummationId)
  res.status(204).send()
}

module.exports = {
  getReviewSummation,
  listReviewSummations,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
