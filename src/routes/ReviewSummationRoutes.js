/**
 * ReviewSummation API Routes
 */

module.exports = {
  '/reviewSummations': {
    post: {
      controller: 'ReviewSummationController',
      method: 'createReviewSummation',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    }
  },
  '/reviewSummations/:reviewSummationId': {
    get: {
      controller: 'ReviewSummationController',
      method: 'getReviewSummation',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    },
    put: {
      controller: 'ReviewSummationController',
      method: 'updateReviewSummation',
      auth: 'jwt',
      access: ['Administrator']
    },
    patch: {
      controller: 'ReviewSummationController',
      method: 'patchReviewSummation',
      auth: 'jwt',
      access: ['Administrator']
    },
    delete: {
      controller: 'ReviewSummationController',
      method: 'deleteReviewSummation',
      auth: 'jwt',
      access: ['Administrator']
    }
  }
}
