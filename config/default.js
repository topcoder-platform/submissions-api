/**
 * Default configuration file
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING || false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  WEB_SERVER_PORT: process.env.PORT || 3000,
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : '["https://api.topcoder.com"]',
  API_VERSION: 'api/v5',
  DEFAULT_MESSAGE: 'Internal Server Error',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used by the application
  AWS_READ_UNITS: 5,
  AWS_WRITE_UNITS: 5,
  S3_BUCKET: process.env.S3_BUCKET || 'tc-testing-submissions' // S3 Bucket to which submissions need to be uploaded
}
