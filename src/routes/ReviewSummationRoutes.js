/**
 * ReviewSummation API Routes
 */

module.exports = {
  '/reviewSummations': {
    post: {
      controller: 'ReviewSummationController',
      method: 'createReviewSummation',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['create:review_summation', 'all:review_summation']
    }
  },
  '/reviewSummations/:reviewSummationId': {
    get: {
      controller: 'ReviewSummationController',
      method: 'getReviewSummation',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review_summation', 'all:review_summation']
    },
    put: {
      controller: 'ReviewSummationController',
      method: 'updateReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_summation', 'all:review_summation']
    },
    patch: {
      controller: 'ReviewSummationController',
      method: 'patchReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_summation', 'all:review_summation']
    },
    delete: {
      controller: 'ReviewSummationController',
      method: 'deleteReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:review_summation', 'all:review_summation']
    }
  }
}
