/**
 * Contains Informix helper methods for loading reviews from Informix 
 */
const config = require('config')
const logger = require('./logger')
const helper = require('./helper')
const informix = require('informixdb')
const ReviewService = require('../services/ReviewService')
const ReviewSummationService = require('../services/ReviewSummationService')
/*
 * This function loads the online review details for a given submission from Informix.
 * It uses the data to create review and reviewSummation objects which are then saved
 * back to DynamoDB through the relevant services, and to ES through Bus API messages
 * processed by the submission-processor-es code
 */
async function loadOnlineReviewDetails (authUser, submission) {
  const reviewSummation = {}
  const reviewsCreated = []

  // We can only load in OR details from the legacy submission ID.
  // If we don't have that, we can't do anything
  if (submission && submission.legacySubmissionId) {
    const query = `
        SELECT 
            submission.submission_id as submission_id,
            submission.final_score as aggregate_score,
            scorecard.min_score as min_score,
            submission.placement as placement,
            review.review_id as review_id,
            review.score as review_score,
            review.scorecard_id as scorecard_id,
            review.create_date as create_date,
            review.modify_date as modify_date,
            review.create_user as reviewer,
            scorecard_type_lu.name as scorecard_name
        FROM submission 
            inner join review on review.submission_id = submission.submission_id
            inner join scorecard on scorecard.scorecard_id = review.scorecard_id
            inner join scorecard_type_lu on scorecard.scorecard_type_id = scorecard_type_lu.scorecard_type_id
        WHERE submission.submission_id=${submission.legacySubmissionId} and review.committed=1`

    const reviews = queryInformix(query)

    for await (const dbReview of reviews) {
      if (!submission.review) {
        submission.review = []
      }

      const reviewToAdd = {}
      reviewToAdd.score = dbReview.review_score
      reviewToAdd.submissionId = submission.id
      reviewToAdd.scoreCardId = dbReview.scorecard_id
      reviewToAdd.typeId = await helper.getReviewTypeId(dbReview.scorecard_name)
      reviewToAdd.reviewedDate = new Date(dbReview.create_date).toISOString()
      reviewToAdd.reviewerId = dbReview.reviewer
      reviewToAdd.status = 'completed'
      reviewToAdd.metadata = { source: 'Online Review' }

      submission.review.push(reviewToAdd)
      reviewsCreated.push(reviewToAdd)

      reviewSummation.scoreCardId = dbReview.scorecard_id
      reviewSummation.submissionId = submission.id
      reviewSummation.aggregateScore = dbReview.aggregate_score
      reviewSummation.isPassing = dbReview.aggregate_score >= dbReview.min_score
      reviewSummation.reviewedDate = new Date(dbReview.create_date).toISOString()
    }

    // Add the reviews created to DynamoDB
    for (const review of reviewsCreated) {
      await ReviewService.createReview(authUser, review)
    }

    // Adds the review summation to DynamoDB
    await ReviewSummationService.createReviewSummation(authUser, reviewSummation)
  }
  return submission
}

function queryInformix (query) {
  const connectionString = 'SERVER=' + config.get('INFORMIX.SERVER') +
    ';DATABASE=' + config.get('INFORMIX.DATABASE') +
    ';HOST=' + config.get('INFORMIX.HOST') +
    ';Protocol=' + config.get('INFORMIX.PROTOCOL') +
    ';SERVICE=' + config.get('INFORMIX.PORT') +
    ';DB_LOCALE=' + config.get('INFORMIX.DB_LOCALE') +
    ';UID=' + config.get('INFORMIX.USER') +
    ';PWD=' + config.get('INFORMIX.PASSWORD')

  let result = null
  logger.info(query)

  try {
    const conn = informix.openSync(connectionString)
    result = conn.querySync(query)
    conn.closeSync()
  } catch (ex) {
    logger.error(ex)
  }

  return result
}

module.exports = {
  queryInformix,
  loadOnlineReviewDetails
}
