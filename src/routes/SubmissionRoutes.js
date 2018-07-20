/**
 * Submission API Routes
 */

module.exports = {
  '/submissions': {
    post: {
      controller: 'SubmissionController',
      method: 'createSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['write:submission', 'all:submission']
    }
  },
  '/submissions/:submissionId': {
    get: {
      controller: 'SubmissionController',
      method: 'getSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission']
    },
    put: {
      controller: 'SubmissionController',
      method: 'updateSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:submission', 'all:submission']
    },
    patch: {
      controller: 'SubmissionController',
      method: 'patchSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:submission', 'all:submission']
    },
    delete: {
      controller: 'SubmissionController',
      method: 'deleteSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['write:submission', 'all:submission']
    }
  }
}
