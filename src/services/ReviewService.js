/**
 * Review Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const dbhelper = require('../common/dbhelper')

const HelperService = require('./HelperService')

const table = 'Review'

/**
 * Function to get review based on ID
 * This function will be used all by other functions to check existence of review
 * @param {Number} reviewId reviewId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * _getReview (reviewId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      'id': reviewId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get review based on ID
 * @param {Number} reviewId reviewId which need to be found
 * @return {Object} Data found from database
 */
function * getReview (reviewId) {
  const exist = yield _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
  }
  // Return the retrieved review
  return exist
}

getReview.schema = {
  reviewId: joi.string().uuid().required()
}

/**
 * Function to create review in database
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createReview (authUser, entity) {
  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  const item = _.extend({
    'id': uuid(),
    'created': currDate,
    'updated': currDate,
    'createdBy': authUser.handle,
    'updatedBy': authUser.handle }, entity)

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  yield dbhelper.insertRecord(record)
  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReview.schema = {
  authUser: joi.object().required(),
  entity: joi.object().keys({
    score: joi.score().required(),
    typeId: joi.string().uuid().required(),
    reviewerId: joi.string().uuid().required(),
    scoreCardId: joi.string().uuid().required(),
    submissionId: joi.string().uuid().required()
  }).required()
}

/*
 * Function to update review in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
function * _updateReview (authUser, reviewId, entity) {
  const exist = yield _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
  }

  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      'id': reviewId
    },
    UpdateExpression: `set score = :s, scoreCardId = :sc, submissionId = :su, 
                        typeId = :t, reviewerId = :r,
                        updated = :ua, updatedBy = :ub`,
    ExpressionAttributeValues: {
      ':s': entity.score || exist.score,
      ':sc': entity.scoreCardId || exist.scoreCardId,
      ':su': entity.submissionId || exist.submissionId,
      ':t': entity.typeId || exist.typeId,
      ':r': entity.reviewerId || exist.reviewerId,
      ':ua': currDate,
      ':ub': authUser.handle
    }
  }
  yield dbhelper.updateRecord(record)
  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity, { 'updated': currDate, 'updatedBy': authUser.handle })
}

/**
 * Function to update review in database
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
function * updateReview (authUser, reviewId, entity) {
  return yield _updateReview(authUser, reviewId, entity)
}

updateReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi.string().uuid().required(),
  entity: joi.object().keys({
    score: joi.score().required(),
    typeId: joi.string().uuid().required(),
    reviewerId: joi.string().uuid().required(),
    scoreCardId: joi.string().uuid().required(),
    submissionId: joi.string().uuid().required()
  }).required()
}

/**
 * Function to patch review in database
 * @param {Number} reviewId reviewId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
function * patchReview (authUser, reviewId, entity) {
  return yield _updateReview(authUser, reviewId, entity)
}

patchReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi.string().uuid().required(),
  entity: joi.object().keys({
    score: joi.score().required(),
    typeId: joi.string().uuid(),
    reviewerId: joi.string().uuid(),
    scoreCardId: joi.string().uuid(),
    submissionId: joi.string().uuid()
  })
}

/**
 * Function to delete review from database
 * @param {Number} reviewId reviewId which need to be deleted
 * @return {Promise}
 */
function * deleteReview (reviewId) {
  const exist = yield _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      'id': reviewId
    }
  }

  yield dbhelper.deleteRecord(filter)
}

deleteReview.schema = {
  reviewId: joi.string().uuid().required()
}

module.exports = {
  getReview,
  createReview,
  updateReview,
  patchReview,
  deleteReview
}
