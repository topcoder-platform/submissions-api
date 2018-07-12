/**
 * Review API Routes
 */

module.exports = {
  '/reviews': {
    post: {
      controller: 'ReviewController',
      method: 'createReview',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    }
  },
  '/reviews/:reviewId': {
    get: {
      controller: 'ReviewController',
      method: 'getReview',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    },
    put: {
      controller: 'ReviewController',
      method: 'updateReview',
      auth: 'jwt',
      access: ['Administrator']
    },
    patch: {
      controller: 'ReviewController',
      method: 'patchReview',
      auth: 'jwt',
      access: ['Administrator']
    },
    delete: {
      controller: 'ReviewController',
      method: 'deleteReview',
      auth: 'jwt',
      access: ['Administrator']
    }
  }
}
