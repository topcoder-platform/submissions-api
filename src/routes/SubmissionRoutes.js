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
      scopes: ['create:submission', 'all:submission']
    },
    get: {
      controller: 'SubmissionController',
      method: 'listSubmissions',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission']
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
      scopes: ['update:submission', 'all:submission']
    },
    patch: {
      controller: 'SubmissionController',
      method: 'patchSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:submission', 'all:submission']
    },
    delete: {
      controller: 'SubmissionController',
      method: 'deleteSubmission',
      auth: 'jwt',
      access: ['Administrator', 'Topcoder User', 'Copilot'],
      scopes: ['delete:submission', 'all:submission']
    }
  },
  '/submissions/:submissionId/download': {
    get: {
      controller: 'SubmissionController',
      method: 'downloadSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission']
    }
  },
  '/submissions/:submissionId/artifacts': {
    post: {
      controller: 'ArtifactController',
      method: 'createArtifact',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['create:submission', 'all:submission']
    },
    get: {
      controller: 'ArtifactController',
      method: 'listArtifacts',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission']
    }
  },
  '/submissions/:submissionId/artifacts/:file': {
    delete: {
      controller: 'ArtifactController',
      method: 'deleteArtifact',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:submission', 'all:submission']
    }
  },
  '/submissions/:submissionId/artifacts/:file/download': {
    get: {
      controller: 'ArtifactController',
      method: 'downloadArtifact',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission']
    }
  }
}
