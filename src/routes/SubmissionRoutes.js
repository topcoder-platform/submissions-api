/**
 * Submission API Routes
 */

module.exports = {
  '/submissions': {
    post: {
      controller: 'SubmissionController',
      method: 'createSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot']
    }
  },
  '/submissions/:submissionId': {
    get: {
      controller: 'SubmissionController',
      method: 'getSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot']
    },
    put: {
      controller: 'SubmissionController',
      method: 'updateSubmission',
      auth: 'jwt',
      access: ['Administrator']
    },
    patch: {
      controller: 'SubmissionController',
      method: 'patchSubmission',
      auth: 'jwt',
      access: ['Administrator']
    },
    delete: {
      controller: 'SubmissionController',
      method: 'deleteSubmission',
      auth: 'jwt',
      access: ['Administrator']
    }
  }
}
