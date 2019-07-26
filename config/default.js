/**
 * Default configuration file
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING ? process.env.DISABLE_LOGGING === 'true' : false, // If true, logging will be disabled
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
    S3_BUCKET: process.env.S3_BUCKET || 'tc-testing-submissions', // S3 Bucket to which submissions need to be uploaded
    ARTIFACT_BUCKET: process.env.ARTIFACT_BUCKET || 'tc-testing-submissions' // S3 bucket to which artifacts need to be uploaded
  },
  BUSAPI_URL: process.env.BUSAPI_URL || 'https://api.topcoder-dev.com/v5',
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || 'error.notification',
  CHALLENGEAPI_URL: process.env.CHALLENGEAPI_URL || 'https://api.topcoder-dev.com/v4/challenges',
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
  MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE || 100,
  ES_BATCH_SIZE: process.env.ES_BATCH_SIZE || 250,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  tracing: {
    dataDogEnabled: process.env.DATADOG_ENABLED ? process.env.DATADOG_ENABLED === 'true' : true,
    lightStepEnabled: process.env.LIGHTSTEP_ENABLED ? process.env.LIGHTSTEP_ENABLED === 'true' : true,
    signalFXEnabled: process.env.SIGNALFX_ENABLED ? process.env.SIGNALFX_ENABLED === 'true' : false,

    dataDog: {
      service: process.env.DATADOG_SERVICE_NAME || 'tc-submissions-api',
      hostname: process.env.DD_TRACE_AGENT_HOSTNAME
    },

    lightStep: {
      access_token: process.env.LIGHTSTEP_ACCESS_TOKEN,
      component_name: process.env.LIGHTSTEP_COMPONENT_NAME || 'tc-submissions-api'
    },

    signalFX: {
      service: process.env.SIGNALFX_SERVICE_NAME || 'tc-submissions-api',
      accessToken: process.env.SIGNALFX_ACCESS_TOKEN,
      url: `http://${process.env.SIGNALFX_TRACE_AGENT_HOSTNAME}:9080/v1/trace`
    }
  }
}
