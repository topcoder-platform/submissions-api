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
      scopes: ['create:submission', 'all:submission'],
      blockByIp: true
    },
    get: {
      controller: 'SubmissionController',
      method: 'listSubmissions',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission'],
      blockByIp: false
    }
  },
  '/submissions/:submissionId': {
    get: {
      controller: 'SubmissionController',
      method: 'getSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission'],
      blockByIp: true
    },
    put: {
      controller: 'SubmissionController',
      method: 'updateSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:submission', 'all:submission'],
      blockByIp: true
    },
    patch: {
      controller: 'SubmissionController',
      method: 'patchSubmission',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['update:submission', 'all:submission'],
      blockByIp: true
    },
    delete: {
      controller: 'SubmissionController',
      method: 'deleteSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['delete:submission', 'all:submission'],
      blockByIp: true
    }
  },
  '/submissions/:submissionId/download': {
    get: {
      controller: 'SubmissionController',
      method: 'downloadSubmission',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission'],
      blockByIp: true
    }
  },
  '/submissions/:submissionId/artifacts': {
    post: {
      controller: 'ArtifactController',
      method: 'createArtifact',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['create:submission', 'all:submission'],
      blockByIp: true
    },
    get: {
      controller: 'ArtifactController',
      method: 'listArtifacts',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission'],
      blockByIp: true
    }
  },
  '/submissions/:submissionId/artifacts/:file': {
    delete: {
      controller: 'ArtifactController',
      method: 'deleteArtifact',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['delete:submission', 'all:submission'],
      blockByIp: true
    }
  },
  '/submissions/:submissionId/artifacts/:file/download': {
    get: {
      controller: 'ArtifactController',
      method: 'downloadArtifact',
      auth: 'jwt',
      access: ['Topcoder User', 'Administrator', 'Copilot'],
      scopes: ['read:submission', 'all:submission'],
      blockByIp: true
    }
  }
}
