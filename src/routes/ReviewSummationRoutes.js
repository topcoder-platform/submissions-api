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
      scopes: ['create:review_summation', 'all:review_summation'],
      blockByIp: true
    },
    get: {
      controller: 'ReviewSummationController',
      method: 'listReviewSummations',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review_summation', 'all:review_summation'],
      blockByIp: true
    }
  },
  '/reviewSummations/:reviewSummationId': {
    get: {
      controller: 'ReviewSummationController',
      method: 'getReviewSummation',
      auth: 'jwt',
      access: ['Administrator', 'Copilot'],
      scopes: ['read:review_summation', 'all:review_summation'],
      blockByIp: true
    },
    put: {
      controller: 'ReviewSummationController',
      method: 'updateReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_summation', 'all:review_summation'],
      blockByIp: true
    },
    patch: {
      controller: 'ReviewSummationController',
      method: 'patchReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:review_summation', 'all:review_summation'],
      blockByIp: true
    },
    delete: {
      controller: 'ReviewSummationController',
      method: 'deleteReviewSummation',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:review_summation', 'all:review_summation'],
      blockByIp: true
    }
  }
}
