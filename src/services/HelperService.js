/**
 * Helper Service
 */

const errors = require('common-errors')

const ReviewTypeService = require('./ReviewTypeService')
const SubmissionService = require('./SubmissionService')
const tracer = require('../common/tracer')

/**
 * Function to check references in the given entity
 * @param {Object} entity entity in which references need to be checked
 * @param {Object} parentSpan the parent Span object
 * @return {boolean} Returns true if all references are valid
 * @throws {Error} if any of the reference is invalid
 */
function * _checkRef (entity, parentSpan) {
  const checkRefSpan = tracer.startChildSpans('HelperService._checkRef', parentSpan)

  try {
    if (entity.typeId) {
      checkRefSpan.setTag('entity.typeId', entity.typeId)
      const existReviewType = yield ReviewTypeService._getReviewType(entity.typeId, checkRefSpan)

      if (!existReviewType) {
        throw new errors.HttpStatusError(400, `Review type with ID = ${entity.typeId} does not exist`)
      }
    }

    if (entity.submissionId) {
      checkRefSpan.setTag('entity.submissionId', entity.submissionId)
      const existSubmission = yield SubmissionService._getSubmission(entity.submissionId, checkRefSpan, false)

      if (!existSubmission) {
        throw new errors.HttpStatusError(400, `Submission with ID = ${entity.submissionId} does not exist`)
      }
    }
  } finally {
    checkRefSpan.finish()
  }
}

module.exports = {
  _checkRef
}
