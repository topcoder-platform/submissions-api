/**
 * Review Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const logger = require('winston')
const config = require('config')

const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, events } = require('../../constants').busApiMeta
const HelperService = require('./HelperService')
const SubmissionService = require('./SubmissionService')

const { ReviewDomain } = require("@topcoder-framework/domain-submission");

const {
  DomainHelper: { getLookupCriteria, getScanCriteria },
} = require("@topcoder-framework/lib-common");

const reviewDomain = new ReviewDomain(
  config.GRPC_SUBMISSION_SERVER_HOST,
  config.GRPC_SUBMISSION_SERVER_PORT
);

const table = 'Review'

/**
 * Function to get review based on ID from DynamoDB
 * This function will be used all by other functions to check existence of review
 * @param {Number} reviewId reviewId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
async function _getReview(reviewId) {
  // Construct filter to retrieve record from Database
  return reviewDomain.lookup(getLookupCriteria("id", reviewId))
}

/**
 * Function to get review based on ID from ES
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be found
 * @return {Object} Data found from database or ES
 */
async function getReview(authUser, reviewId) {
  let review
  const response = await helper.fetchFromES(
    {
      id: reviewId
    },
    helper.camelize(table)
  )

  if (response.total === 0) {
    logger.info(`Couldn't find review ${reviewId} in ES. Checking db`)
    review = await _getReview(reviewId)
    logger.debug(`Review: ${review}`)

    if (!review) {
      throw new errors.HttpStatusError(
        404,
        `Review with ID = ${reviewId} is not found`
      )
    }
  } else {
    review = response.rows[0]
  }

  // Fetch submission without review and review summations
  const submission = await SubmissionService._getSubmission(
    review.submissionId,
    false
  )
  logger.info('Check User access before returning the review')
  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    await helper.checkReviewGetAccess(authUser, submission)
  }
  // Return the review
  return review
}

getReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi
    .string()
    .uuid()
    .required()
}

/**
 * Function to list reviews from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
async function listReviews(query) {
  if (query.scoreCardId) {
    // Always use legacy scorecard id since v5 isn't stored in db
    query.scoreCardId = helper.getLegacyScoreCardId(query.scoreCardId)

    if (!query.scoreCardId) {
      throw new errors.HttpStatusError(400, 'Legacy scorecard id not found for the provided v5 scorecard id')
    }
  }

  return await helper.fetchFromES(query, helper.camelize(table))
}

const listReviewsQuerySchema = {
  score: joi.score(),
  typeId: joi.string().uuid(),
  reviewerId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  submissionId: joi.string().uuid(),
  status: joi.reviewStatus(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder()
}

listReviewsQuerySchema.sortBy = joi
  .string()
  .valid(
    _.difference(Object.keys(listReviewsQuerySchema), [
      'page',
      'perPage',
      'orderBy'
    ])
  )

listReviews.schema = {
  query: joi
    .object()
    .keys(listReviewsQuerySchema)
    .with('orderBy', 'sortBy')
}

/**
 * Function to create review in database
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createReview(authUser, entity) {
  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  const currDate = new Date().toISOString()

  const possibleV5ScoreCardId = entity.scoreCardId

  // Always use legacy id instead of v5 legacy id
  entity.scoreCardId = helper.getLegacyScoreCardId(entity.scoreCardId)

  if (!entity.scoreCardId) {
    throw new errors.HttpStatusError(400, 'Legacy scorecard id not found for the provided v5 scorecard id')
  }

  if (entity.scoreCardId !== possibleV5ScoreCardId) {
    // Remember the v5 score card id too that was passed
    entity.v5ScoreCardId = possibleV5ScoreCardId
  }

  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    if (entity.reviewedDate) {
      throw new errors.HttpStatusError(403, 'You are not allowed to set the `reviewedDate` attribute on a review')
    }
  }

  const createdItem = await reviewDomain.create({
    ...entity,
    status: entity.status || 'completed',
    reviewedDate: entity.reviewedDate || item.created,
  })

  // Push Review created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator: originator,
    timestamp: currDate, // time when submission was created
    'mime-type': mimeType,
    payload: _.extend(
      {
        resource: helper.camelize(table)
      },
      createdItem
    )
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return createdItem
}

createReview.schema = {
  authUser: joi.object().required(),
  entity: joi
    .object()
    .keys({
      score: joi.when('status', {
        is: joi.string().valid('completed'),
        then: joi.required(),
        otherwise: joi.optional()
      }),
      typeId: joi
        .string()
        .uuid()
        .required(),
      reviewerId: joi
        .alternatives()
        .try(joi.id(), joi.string().uuid())
        .required()
        .error(errors => ({
          message: '"reviewerId" must be a number or a string'
        })),
      scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
      submissionId: joi
        .string()
        .uuid()
        .required(),
      status: joi.reviewStatus(),
      metadata: joi.object(),
      reviewedDate: joi.string()
    })
    .required()
}

/*
 * Function to update review in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
async function _updateReview(authUser, reviewId, entity) {
  const exist = await _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(
      404,
      `Review with ID = ${reviewId} is not found`
    )
  }

  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  const currDate = new Date().toISOString()

  let scoreCardId = exist.scoreCardId
  let v5ScoreCardId = exist.v5ScoreCardId

  if (entity.scoreCardId) {
    scoreCardId = helper.getLegacyScoreCardId(entity.scoreCardId)

    if (!scoreCardId) {
      throw new errors.HttpStatusError(400, 'Legacy scorecard id not found for the provided v5 scorecard id')
    }

    if (entity.scoreCardId !== scoreCardId) {
      v5ScoreCardId = entity.scoreCardId
    } else if (v5ScoreCardId) {
      // Since we currently have a static mapping b/w legacy and v5 scorecard ids,
      // there is no way for us to fetch the v5 scorecard id for a legacy scorecard id
      // In this scenario, the review already had a v5 scorecard id, so if it's legacy
      // scorecard id gets updated, we would also need to update the v5 scorecard id
      // which we cannot - hence the error. Ideally, in this case, a new review needs to be created
      throw new errors.HttpStatusError(400, `Cannot update legacy scorecard id since review with id ${reviewId} already has a v5 scorecard id`)
    }
  }

  const updatedData = {
    score: entity.score || exist.score,
    scoreCardId,
    submissionId: entity.submissionId || exist.submissionId,
    typeId: entity.typeId || exist.typeId,
    reviewerId: entity.reviewerId || exist.reviewerId,
    status: entity.status || exist.status || 'completed',
    reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created,
    ...(v5ScoreCardId ? { v5ScoreCardId } : {}),
    ...(entity.metadata || exist.metadata ? { metadata: _.merge({}, exist.metadata, entity.metadata) } : {})
  }

  await reviewDomain.update({
    filterCriteria: getScanCriteria({
      id: reviewId,
    }),
    updateInput: updatedData
  })

  // Push Review updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator: originator,
    timestamp: currDate, // time when submission was updated
    'mime-type': mimeType,
    payload: _.extend(
      {
        resource: helper.camelize(table),
        id: reviewId,
        updated: currDate,
        updatedBy: authUser.handle || authUser.sub,
        reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created
      },
      updatedData,
      {
        scoreCardId,
        v5ScoreCardId
      }
    )
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, updatedData, {
    updated: currDate,
    updatedBy: authUser.handle || authUser.sub,
    reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created,
    scoreCardId,
    v5ScoreCardId
  })
}

/**
 * Function to update review in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
async function updateReview(authUser, reviewId, entity) {
  return await _updateReview(authUser, reviewId, entity)
}

updateReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi
    .string()
    .uuid()
    .required(),
  entity: joi
    .object()
    .keys({
      score: joi.score().required(),
      typeId: joi
        .string()
        .uuid()
        .required(),
      reviewerId: joi
        .alternatives()
        .try(joi.id(), joi.string().uuid())
        .required(),
      scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
      submissionId: joi
        .string()
        .uuid()
        .required(),
      status: joi.reviewStatus(),
      metadata: joi.object(),
      reviewedDate: joi.string()
    })
    .required()
}

/**
 * Function to patch review in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
async function patchReview(authUser, reviewId, entity) {
  return await _updateReview(authUser, reviewId, entity)
}

patchReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi
    .string()
    .uuid()
    .required(),
  entity: joi.object().keys({
    score: joi.score(),
    typeId: joi.string().uuid(),
    reviewerId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionId: joi.string().uuid(),
    status: joi.reviewStatus(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  })
}

/**
 * Function to delete review from database
 * @param {Number} reviewId reviewId which need to be deleted
 * @return {Promise}
 */
async function deleteReview(reviewId) {
  const exist = await _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(
      404,
      `Review with ID = ${reviewId} is not found`
    )
  }

  await reviewDomain.delete(getLookupCriteria("id", reviewId))

  // Push Review deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator: originator,
    timestamp: new Date().toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: reviewId
    }
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)
}

deleteReview.schema = {
  reviewId: joi
    .string()
    .uuid()
    .required()
}

module.exports = {
  getReview,
  listReviews,
  createReview,
  updateReview,
  patchReview,
  deleteReview
}
