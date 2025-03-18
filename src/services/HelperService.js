/**
 * Helper Service
 */

const errors = require('common-errors')

const ReviewTypeService = require('./ReviewTypeService')
const dbhelper = require('../common/dbhelper')

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

    return existReviewType
  }

  if (entity.submissionId) {
    const existSubmission = await _getSubmission(entity.submissionId)

    if (!existSubmission) {
      throw new errors.HttpStatusError(400, `Submission with ID = ${entity.submissionId} does not exist`)
    }

    return existSubmission
  }
}

/**
 * Function to get submission based on ID from DynamoDB
 * This function will be used to check existence of a submission
 * @param {String} submissionId submissionId which need to be retrieved
 * @return {Promise<Object>} Data retrieved from database
 */
async function _getSubmission (submissionId) {
  const table = 'Submission'
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      id: submissionId
    }
  }
  const result = await dbhelper.getRecord(filter)
  const submission = result.Item
  return submission
}
module.exports = {
  _checkRef,
  _getSubmission
}
