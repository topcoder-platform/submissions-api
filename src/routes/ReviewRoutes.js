/**
 * Review API Routes
 */

module.exports = {
  '/reviews': {
    post: {
      controller: 'ReviewController',
      method: 'createReview',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['create:review', 'all:review'],
      blockByIp: true
    },
    get: {
      controller: 'ReviewController',
      method: 'listReviews',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review', 'all:review'],
      blockByIp: true
    }
  },
  '/reviews/:reviewId': {
    get: {
      controller: 'ReviewController',
      method: 'getReview',
      auth: 'jwt',
      access: ['Administrator', 'Copilot', 'Topcoder User'],
      scopes: ['read:review', 'all:review'],
      blockByIp: true
    },
    put: {
      controller: 'ReviewController',
      method: 'updateReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review', 'all:review'],
      blockByIp: true
    },
    patch: {
      controller: 'ReviewController',
      method: 'patchReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review', 'all:review'],
      blockByIp: true
    },
    delete: {
      controller: 'ReviewController',
      method: 'deleteReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:review', 'all:review'],
      blockByIp: true
    }
  }
}
