/**
 * ReviewType API Routes
 */

module.exports = {
  '/reviewTypes': {
    post: {
      controller: 'ReviewTypeController',
      method: 'createReviewType',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['create:review_type', 'all:review_type']
    },
    get: {
      controller: 'ReviewTypeController',
      method: 'listReviewTypes',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review_type', 'all:review_type']
    }
  },
  '/reviewTypes/:reviewTypeId': {
    get: {
      controller: 'ReviewTypeController',
      method: 'getReviewType',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review_type', 'all:review_type']
    },
    put: {
      controller: 'ReviewTypeController',
      method: 'updateReviewType',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_type', 'all:review_type']
    },
    patch: {
      controller: 'ReviewTypeController',
      method: 'patchReviewType',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_type', 'all:review_type']
    },
    delete: {
      controller: 'ReviewTypeController',
      method: 'deleteReviewType',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:review_type', 'all:review_type']
    }
  }
}
