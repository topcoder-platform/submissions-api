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
      scopes: ['write:review', 'all:review']
    }
  },
  '/reviews/:reviewId': {
    get: {
      controller: 'ReviewController',
      method: 'getReview',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review', 'all:review']
    },
    put: {
      controller: 'ReviewController',
      method: 'updateReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:review', 'all:review']
    },
    patch: {
      controller: 'ReviewController',
      method: 'patchReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:review', 'all:review']
    },
    delete: {
      controller: 'ReviewController',
      method: 'deleteReview',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:review', 'all:review']
    }
  }
}
