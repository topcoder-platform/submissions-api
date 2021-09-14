/**
 * Review API postman test clean route
 */

module.exports = {
  '/submissions/internal/jobs/clean': {
    post: {
      controller: 'CleanUpController',
      method: 'cleanUpTestData',
      auth: 'jwt',
      access: ['Administrator'],
      scopes: ['all:submission']
    }
  }
}
