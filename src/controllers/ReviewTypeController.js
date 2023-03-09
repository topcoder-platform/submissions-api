/**
 * ReviewType Controller
 */

const ReviewTypeService = require('../services/ReviewTypeService')
const helper = require('../common/helper')

/**
 * Get review type
 * @param req the http request
 * @param res the http response
 */
async function getReviewType(req, res) {
  res.json(await ReviewTypeService.getReviewType(req.params.reviewTypeId))
}

/**
 * List review types from ES
 * @param req the http request
 * @param res the http response
 */
async function listReviewTypes(req, res) {
  const data = await ReviewTypeService.listReviewTypes(req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Create review type
 * @param req the http request
 * @param res the http response
 */
async function createReviewType(req, res) {
  res.json(await ReviewTypeService.createReviewType(req.body))
}

/**
 * Update review type
 * @param req the http request
 * @param res the http response
 */
async function updateReviewType(req, res) {
  res.json(await ReviewTypeService.updateReviewType(req.params.reviewTypeId, req.body))
}

/**
 * Patch review type
 * @param req the http request
 * @param res the http response
 */
async function patchReviewType(req, res) {
  res.json(await ReviewTypeService.patchReviewType(req.params.reviewTypeId, req.body))
}

/**
 * Delete review type
 * @param req the http request
 * @param res the http response
 */
async function deleteReviewType(req, res) {
  await ReviewTypeService.deleteReviewType(req.params.reviewTypeId)
  res.status(204).send()
}

module.exports = {
  getReviewType,
  listReviewTypes,
  createReviewType,
  updateReviewType,
  patchReviewType,
  deleteReviewType
}
