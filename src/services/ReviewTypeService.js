/**
 * Reviewtype Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const dbhelper = require('../common/dbhelper')

const table = 'ReviewType'

/**
 * Function to get review type based on ID
 * This function will be used all by other functions to check existence of review type
 * @param {Number} reviewTypeId ReviewTypeId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * _getReviewType (reviewTypeId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      'id': reviewTypeId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get review type based on ID
 * @param {Number} reviewTypeId ReviewTypeId which need to be found
 * @return {Object} Data found from database
 */
function * getReviewType (reviewTypeId) {
  const exist = yield _getReviewType(reviewTypeId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }
  // Return the retrieved review type
  return exist
}

getReviewType.schema = {
  reviewTypeId: joi.string().uuid().required()
}

/**
 * Function to create review type in database
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createReviewType (entity) {
  const item = _.extend({ 'id': uuid() }, entity)
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

createReviewType.schema = {
  entity: joi.object().keys({
    name: joi.string().required(),
    isActive: joi.boolean().required()
  }).required()
}

/*
 * Function to update review type in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Number} reviewTypeId ReviewTypeId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
function * _updateReviewType (reviewTypeId, entity) {
  const exist = yield _getReviewType(reviewTypeId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }
  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      'id': reviewTypeId
    },
    UpdateExpression: 'set #name = :n, isActive = :a',
    ExpressionAttributeValues: {
      ':n': entity.name || exist.name,
      ':a': entity.isActive || exist.isActive
    },
    ExpressionAttributeNames: {
      '#name': 'name'
    }
  }
  yield dbhelper.updateRecord(record)
  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity)
}

/**
 * Function to update review type in database
 * @param {Number} reviewTypeId ReviewTypeId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
function * updateReviewType (reviewTypeId, entity) {
  return yield _updateReviewType(reviewTypeId, entity)
}

updateReviewType.schema = {
  reviewTypeId: joi.string().uuid().required(),
  entity: joi.object().keys({
    name: joi.string().required(),
    isActive: joi.boolean().required()
  }).required()
}

/**
 * Function to patch review type in database
 * @param {Number} reviewTypeId ReviewTypeId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
function * patchReviewType (reviewTypeId, entity) {
  return yield _updateReviewType(reviewTypeId, entity)
}

patchReviewType.schema = {
  reviewTypeId: joi.string().uuid().required(),
  entity: joi.object().keys({
    name: joi.string(),
    isActive: joi.boolean()
  })
}

/**
 * Function to delete review type from database
 * @param {Number} reviewTypeId ReviewTypeId which need to be deleted
 * @return {Promise}
 */
function * deleteReviewType (reviewTypeId) {
  const exist = yield _getReviewType(reviewTypeId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      'id': reviewTypeId
    }
  }

  yield dbhelper.deleteRecord(filter)
}

deleteReviewType.schema = {
  reviewTypeId: joi.string().uuid().required()
}

module.exports = {
  getReviewType,
  createReviewType,
  updateReviewType,
  patchReviewType,
  deleteReviewType
}
