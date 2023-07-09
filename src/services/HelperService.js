/**
 * Helper Service
 */

const errors = require('common-errors')

const ReviewTypeService = require('./ReviewTypeService')
const SubmissionService = require('./SubmissionService')

/**
 * Function to check references in the given entity
 * @param {Object} entity entity in which references need to be checked
 * @throws {Error} if any of the reference is invalid
 */
async function _checkRef (entity) {
  if (entity.typeId) {
    const existReviewType = await ReviewTypeService._getReviewType(entity.typeId)

    if (!existReviewType) {
      throw new errors.HttpStatusError(400, `Review type with ID = ${entity.typeId} does not exist`)
    }
  }

  if (entity.submissionId) {
    const existSubmission = await SubmissionService._getSubmission(entity.submissionId, false)

    if (!existSubmission) {
      throw new errors.HttpStatusError(400, `Submission with ID = ${entity.submissionId} does not exist`)
    }
  }
}

module.exports = {
  _checkRef
}
