/**
 * Default configuration file
 */
require('dotenv').config()
module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING || false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  WEB_SERVER_PORT: process.env.PORT || 3000,
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : '["https://api.topcoder.com","https://topcoder-dev.auth0.com/"]',
  HOST: process.env.HOST || 'localhost:3000',
  API_VERSION: process.env.API_VERSION || '/api/v5',
  DEFAULT_MESSAGE: 'Internal Server Error',
  aws: {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used by the application
    AWS_READ_UNITS: process.env.AWS_READ_UNITS || 5,
    AWS_WRITE_UNITS: process.env.AWS_WRITE_UNITS || 5,
    DMZ_BUCKET: process.env.AWS_DMZ_BUCKET || 'tc-testing-submissions', // S3 Bucket to which submissions need to be uploaded
    QUARANTINE_BUCKET: process.env.AWS_QUARANTINE_BUCKET,
    ARTIFACT_BUCKET: process.env.ARTIFACT_BUCKET || 'tc-testing-submissions' // S3 bucket to which artifacts need to be uploaded
  },
  BUSAPI_URL: process.env.BUSAPI_URL || 'https://api.topcoder-dev.com/v5',
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || 'error.notification',
  KAFKA_AGGREGATE_TOPIC: process.env.KAFKA_AGGREGATE_TOPIC || 'submission.notification.aggregate',
  CHALLENGEAPI_V5_URL: process.env.CHALLENGEAPI_V5_URL || 'https://api.topcoder-dev.com/v5/challenges',
  RESOURCEAPI_V5_BASE_URL: process.env.RESOURCEAPI_V5_BASE_URL || 'https://api.topcoder-dev.com/v5',
  AUTH0_URL: process.env.AUTH0_URL, // Auth0 credentials for Submission Service
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  osConfig: {
    HOST: process.env.OS_HOST || 'localhost:9200',
    OS_INDEX: process.env.OS_INDEX || 'submission-api',
    OS_TYPE: process.env.OS_TYPE || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  },
  PAGE_SIZE: process.env.PAGE_SIZE || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  ES_BATCH_SIZE: process.env.ES_BATCH_SIZE || 1000,
  UPDATE_V5_CHALLENGE_BATCH_SIZE: process.env.UPDATE_V5_CHALLENGE_BATCH_SIZE || 100,
  SUBMISSION_TABLE_NAME: process.env.SUBMISSION_TABLE_NAME || 'Submission',
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  FETCH_CREATED_DATE_START: process.env.FETCH_CREATED_DATE_START || '2021-01-01',
  FETCH_PAGE_SIZE: process.env.FETCH_PAGE_SIZE || 500,
  MIGRATE_CHALLENGES: process.env.MIGRATE_CHALLENGES || [],

  V5TOLEGACYSCORECARDMAPPING: {
    'c56a4180-65aa-42ec-a945-5fd21dec0501': 30001363,
    'c56a4180-65aa-42ec-a945-5fd21dec0502': 123456789,
    'c56a4180-65aa-42ec-a945-5fd21dec0503': 30001031,
    'c56a4180-65aa-42ec-a945-5fd21dec0504': 987654321,
    'c56a4180-65aa-42ec-a945-5fd21dec0505': 987123456,
    '9ecc88e5-a4ee-44a4-8ec1-70bd98022510': 123789456,
    'd6d31f34-8ee5-4589-ae65-45652fcc01a6': 30000720
  },

  INTERNAL_CACHE_TTL: process.env.INTERNAL_CACHE_TTL || 1800,
  INFORMIX: {
    SERVER: process.env.INFORMIX_SERVER || 'informixoltp_tcp', // informix server
    DATABASE: process.env.INFORMIX_DATABASE || 'tcs_catalog', // informix database
    HOST: process.env.INFORMIX_HOST || 'localhost', // host
    PROTOCOL: process.env.INFORMIX_PROTOCOL || 'onsoctcp',
    PORT: process.env.INFORMIX_PORT || '2021', // port
    DB_LOCALE: process.env.INFORMIX_DB_LOCALE || 'en_US.57372',
    USER: process.env.INFORMIX_USER || 'informix', // user
    PASSWORD: process.env.INFORMIX_PASSWORD || '1nf0rm1x', // password
    POOL_MAX_SIZE: parseInt(process.env.MAXPOOL, 10) || 60,
    maxsize: parseInt(process.env.MAXSIZE) || 0,
    minpool: parseInt(process.env.MINPOOL, 10) || 1,
    idleTimeout: parseInt(process.env.IDLETIMEOUT, 10) || 3600,
    timeout: parseInt(process.env.TIMEOUT, 10) || 30000
  }
}
