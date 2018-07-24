/**
 * ReviewType API Routes
 */

module.exports = {
  '/reviewTypes': {
    post: {
      controller: 'ReviewTypeController',
      method: 'createReviewType',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    },
    get: {
      controller: 'ReviewTypeController',
      method: 'listReviewTypes',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    }
  },
  '/reviewTypes/:reviewTypeId': {
    get: {
      controller: 'ReviewTypeController',
      method: 'getReviewType',
      auth: 'jwt',
      access: ['Administrator', 'Copilot']
    },
    put: {
      controller: 'ReviewTypeController',
      method: 'updateReviewType',
      auth: 'jwt',
      access: ['Administrator']
    },
    patch: {
      controller: 'ReviewTypeController',
      method: 'patchReviewType',
      auth: 'jwt',
      access: ['Administrator']
    },
    delete: {
      controller: 'ReviewTypeController',
      method: 'deleteReviewType',
      auth: 'jwt',
      access: ['Administrator']
    }
  }
}
