/**
 * Configuration file to be used while running tests
 */

module.exports = {
  DISABLE_LOGGING: false, // If true, logging will be disabled
  LOG_LEVEL: 'info',
  WEB_SERVER_PORT: 3010,
  AUTH_SECRET: 'mysecret',
  VALID_ISSUERS: '["https://api.topcoder.com"]',
  API_VERSION: process.env.API_VERSION || '/api/v5',
  aws: {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used by the application
    AWS_READ_UNITS: process.env.AWS_READ_UNITS || 5,
    AWS_WRITE_UNITS: process.env.AWS_WRITE_UNITS || 5,
    S3_BUCKET: process.env.S3_BUCKET_TEST || 'tc-testing-submissions' // S3 Bucket to which submissions need to be uploaded
  },
  BUSAPI_EVENTS_URL: 'https://api.topcoder-dev.com/v5/bus/events',
  CHALLENGEAPI_URL: 'https://api.topcoder-dev.com/v4/challenges',
  esConfig: {
    ES_INDEX: process.env.ES_INDEX_TEST || 'submission-test',
    ES_TYPE: process.env.ES_TYPE_TEST || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  },
  AUTH0_URL: process.env.AUTH0_URL, // Auth0 credentials for Submission Service
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  USER_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlNoYXJhdGhrdW1hcjkyIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0OTMwNTAiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiU2hhcmF0aGt1bWFyOTJAdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.2gtNJwhcv7MYc-muX3Nv-B0RdWbhMRl7-xrwFUsLazM',
  COPILOT_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJDb3BpbG90Il0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6ImNhbGxtZWthdG9vdGllIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0OTMwMTIiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiY2FsbG1la2F0b290aWVAdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.AR1-A7zm8Rur-P36De4GUsSO1FsSb2CWby8KUZ66Dm0',
  ADMIN_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJBZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlRvbnlKIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0MzMyODgiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiYWRtaW5AdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.pIHUtMwIV07ZgfaUk9916X49rgjKclM9kzQP419LBo0'
}
