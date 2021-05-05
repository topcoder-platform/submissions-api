/**
 * Configuration file to be used while running tests
 */

module.exports = {
  DISABLE_LOGGING: false, // If true, logging will be disabled
  LOG_LEVEL: 'info',
  WEB_SERVER_PORT: 3010,
  API_VERSION: process.env.API_VERSION || '/api/v5',
  aws: {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used by the application
    AWS_READ_UNITS: process.env.AWS_READ_UNITS || 5,
    AWS_WRITE_UNITS: process.env.AWS_WRITE_UNITS || 5,
    S3_BUCKET: process.env.S3_BUCKET_TEST || 'eisbilir-bucket', // S3 Bucket to which submissions need to be uploaded
    ARTIFACT_BUCKET: process.env.ARTIFACT_BUCKET || 'eisbilir-artifact'
  },
  esConfig: {
    ES_INDEX: process.env.ES_INDEX_TEST || 'submission-test',
    ES_TYPE: process.env.ES_TYPE_TEST || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  },
  USER_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlNoYXJhdGhrdW1hcjkyIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0OTMwNTAiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiU2hhcmF0aGt1bWFyOTJAdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.2gtNJwhcv7MYc-muX3Nv-B0RdWbhMRl7-xrwFUsLazM',
  COPILOT_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJDb3BpbG90Il0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6ImNhbGxtZWthdG9vdGllIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0OTMwMTIiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiY2FsbG1la2F0b290aWVAdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.AR1-A7zm8Rur-P36De4GUsSO1FsSb2CWby8KUZ66Dm0',
  ADMIN_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJBZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlRvbnlKIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0MzMyODgiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiYWRtaW5AdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.pIHUtMwIV07ZgfaUk9916X49rgjKclM9kzQP419LBo0',

  AUTH_SECRET: process.env.AUTH_SECRET || 'UgL4(SEAM*~yc7L~vWrKKN&GHrwyc9N[@nVxm,X?#b4}7:xbzM',
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : '["https://api.topcoder.com","https://api.topcoder-dev.com","https://topcoder-dev.auth0.com/"]',
  AUTH0_URL: process.env.AUTH0_URL || 'https://topcoder-dev.auth0.com/oauth/token', // Auth0 credentials for Submission Service
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET || '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://m2m.topcoder-dev.com/',
  AUTH_V2_URL: process.env.AUTH_V2_URL || 'https://topcoder-dev.auth0.com/oauth/ro',
  AUTH_V2_CLIENT_ID: process.env.AUTH_V2_CLIENT_ID || 'JFDo7HMkf0q2CkVFHojy3zHWafziprhT',
  AUTH_V3_URL: process.env.AUTH_V3_URL || 'https://api.topcoder-dev.com/v3/authorizations',
  ADMIN_CREDENTIALS_USERNAME: process.env.ADMIN_CREDENTIALS_USERNAME || '',
  ADMIN_CREDENTIALS_PASSWORD: process.env.ADMIN_CREDENTIALS_PASSWORD || '',
  COPILOT_CREDENTIALS_USERNAME: process.env.COPILOT_CREDENTIALS_USERNAME || '',
  COPILOT_CREDENTIALS_PASSWORD: process.env.COPILOT_CREDENTIALS_PASSWORD || '',
  USER_CREDENTIALS_USERNAME: process.env.USER_CREDENTIALS_USERNAME || '',
  USER_CREDENTIALS_PASSWORD: process.env.USER_CREDENTIALS_PASSWORD || '',
  BUSAPI_EVENTS_URL: process.env.BUSAPI_EVENTS_URL || 'localhost:4000/v5/bus/events',
  BUSAPI_URL: process.env.BUSAPI_URL || 'localhost:4000/v5',
  CHALLENGEAPI_V5_URL: process.env.CHALLENGEAPI_V5_URL || 'localhost:4000/v5/challenges',
  RESOURCEAPI_V5_BASE_URL: process.env.RESOURCEAPI_V5_BASE_URL || 'localhost:4000/v5'
}
