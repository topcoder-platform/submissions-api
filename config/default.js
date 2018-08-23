/**
 * Default configuration file
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING || false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  WEB_SERVER_PORT: process.env.PORT || 3000,
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : '["https://api.topcoder.com"]',
  HOST: process.env.HOST || 'localhost:3000',
  API_VERSION: process.env.API_VERSION || '/api/v5',
  DEFAULT_MESSAGE: 'Internal Server Error',
  aws: {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used by the application
    AWS_READ_UNITS: process.env.AWS_READ_UNITS || 5,
    AWS_WRITE_UNITS: process.env.AWS_WRITE_UNITS || 5,
    S3_BUCKET: process.env.S3_BUCKET || 'tc-testing-submissions' // S3 Bucket to which submissions need to be uploaded
  },
  BUSAPI_EVENTS_URL: process.env.BUSAPI_EVENTS_URL || 'https://api.topcoder-dev.com/v5/bus/events',
  CHALLENGEAPI_URL: process.env.CHALLENGEAPI_URL || 'https://api.topcoder-dev.com/v3/challenges',
  AUTH0_URL: process.env.AUTH0_URL, // Auth0 credentials for Submission Service
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  esConfig: {
    HOST: process.env.ES_HOST,
    API_VERSION: process.env.ES_API_VERSION || '6.3',
    ES_INDEX: process.env.ES_INDEX || 'submission',
    ES_TYPE: process.env.ES_TYPE || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  },
  PAGE_SIZE: process.env.PAGE_SIZE || 20,
  MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE || 100
}
