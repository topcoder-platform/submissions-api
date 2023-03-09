/**
 * ReviewSummation Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, events } = require('../../constants').busApiMeta
const HelperService = require('./HelperService')
const config = require('config')

const table = 'ReviewSummation'

const { ReviewSummationDomain } = require("@topcoder-framework/domain-submission");

const {
  DomainHelper: { getLookupCriteria, getScanCriteria },
} = require("@topcoder-framework/lib-common");

const reviewSummationDomain = new ReviewSummationDomain(
  config.GRPC_SUBMISSION_SERVER_HOST,
  config.GRPC_SUBMISSION_SERVER_PORT
);

/**
 * Function to get Review summation based on ID from DynamoDB
 * This function will be used all by other functions to check existence of Review summation
 * @param {Number} reviewSummationId reviewSummationId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
async function _getReviewSummation(reviewSummationId) {
  // Construct filter to retrieve record from Database
  return reviewSummationDomain.lookup(getLookupCriteria("id", reviewSummationId))
}

/**
 * Function to get Review summation based on ID from ES
 * @param {Number} reviewSummationId reviewSummationId which need to be found
 * @return {Object} Data found from database
 */
async function getReviewSummation(reviewSummationId) {
  const response = await helper.fetchFromES({ id: reviewSummationId }, helper.camelize(table))
  if (response.total === 0) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }
  // Return the retrieved Review summation
  return response.rows[0]
}

getReviewSummation.schema = {
  reviewSummationId: joi.string().uuid().required()
}

/**
 * Function to list review summations from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
async function listReviewSummations(query) {
  return await helper.fetchFromES(query, helper.camelize(table))
}

const listReviewSummationsQuerySchema = {
  scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  submissionId: joi.string().uuid(),
  aggregateScore: joi.score(),
  isPassing: joi.boolean(),
  isFinal: joi.boolean(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder()
}

listReviewSummationsQuerySchema.sortBy = joi.string().valid(_.difference(
  Object.keys(listReviewSummationsQuerySchema),
  ['page', 'perPage', 'orderBy']
))

listReviewSummations.schema = {
  query: joi.object().keys(listReviewSummationsQuerySchema).with('orderBy', 'sortBy')
}

/**
 * Function to create Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createReviewSummation(authUser, entity) {
  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    if (entity.reviewedDate) {
      throw new errors.HttpStatusError(403, 'You are not allowed to set the `reviewedDate` attribute on a review summation')
    }
  }

  const item = await reviewSummationDomain.create({
    ...entity,
    reviewedDate: entity.reviewedDate || currDate,
  });

  // Push Review Summation created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator: originator,
    timestamp: currDate, // time when submission was created
    'mime-type': mimeType,
    payload: _.extend({ resource: helper.camelize(table) }, item)
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReviewSummation.schema = {
  authUser: joi.object().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().required(),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  }).required()
}

/*
 * Function to update Review summation in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
async function _updateReviewSummation(authUser, reviewSummationId, entity) {
  const exist = await _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  let isPassing // Attribute to store boolean value

  if (entity.isPassing === undefined) {
    isPassing = exist.isPassing
  } else {
    isPassing = entity.isPassing
  }

  const currDate = (new Date()).toISOString()

  const updatedData = {
    aggregateScore: entity.aggregateScore || exist.aggregateScore,
    scoreCardId: entity.scoreCardId || exist.scoreCardId,
    submissionId: entity.submissionId || exist.submissionId,
    isPassing: isPassing,
    reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created,
    ...(entity.metadata || exist.metadata ? { metadata: _.merge({}, exist.metadata, entity.metadata) } : {}),
    ...(entity.isFinal || exist.isFinal ? { isFinal: entity.isFinal || exist.isFinal } : {})
  };

  await reviewSummationDomain.update({
    filterCriteria: getScanCriteria({
      id: reviewSummationId,
    }),
    updateInput: updatedData
  })

  // Push Review Summation updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator: originator,
    timestamp: currDate, // time when submission was updated
    'mime-type': mimeType,
    payload: _.extend({
      resource: helper.camelize(table),
      id: reviewSummationId,
      updated: currDate,
      updatedBy: authUser.handle || authUser.sub,
      reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created
    }, updatedData)
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(
    exist,
    updatedData,
    {
      updated: currDate,
      updatedBy: authUser.handle || authUser.sub,
      reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created
    }
  )
}

/**
 * Function to update Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
async function updateReviewSummation(authUser, reviewSummationId, entity) {
  return await _updateReviewSummation(authUser, reviewSummationId, entity)
}

updateReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().required(),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  }).required()
}

/**
 * Function to patch Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
async function patchReviewSummation(authUser, reviewSummationId, entity) {
  return await _updateReviewSummation(authUser, reviewSummationId, entity)
}

patchReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionId: joi.string().uuid(),
    aggregateScore: joi.score(),
    isPassing: joi.boolean(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  })
}

/**
 * Function to delete Review summation from database
 * @param {Number} reviewSummationId reviewSummationId which need to be deleted
 * @return {Promise}
 */
async function deleteReviewSummation(reviewSummationId) {
  const exist = await _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  await reviewSummationDomain.delete(getLookupCriteria("id", reviewSummationId))

  // Push Review Summation deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator: originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: reviewSummationId
    }
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)
}

deleteReviewSummation.schema = {
  reviewSummationId: joi.string().uuid().required()
}

module.exports = {
  getReviewSummation,
  listReviewSummations,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
