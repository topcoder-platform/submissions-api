# Topcoder Submission API

## Pre-requisites

1. Active AWS Account
2. Node.js 8.11.x
3. Npm 5.6.x
4. Postman for Verification
5. Docker and Docker-Compose (Optional for Local Deployment)
6. DataDog
7. LightStep
8. SignalFX

## Open Tracing Configuration Setup

Refer `config/default.js`, tracing object will contain all configuration relate to integrate open tracing.

1. dataDogEnabled, whether data dog tracing is enabled
2. lightStepEnabled, whether light step tracing is enabled
3. signalFXEnabled, whether singal fx tracing is enabled
4. dataDog, all related configuration to initialize data dog tracer, refer https://datadog.github.io/dd-trace-js/ for more information
5. lightStep, all related configuration to initialize light step tracer, refer https://github.com/lightstep/lightstep-tracer-javascript for more information
6. signalFX, all related configuration to initialize signal fx tracer, refer https://github.com/signalfx/signalfx-nodejs-tracing/blob/master/docs/API.md#advanced-configuration for more information

## Setup

1. go to https://www.datadoghq.com/, register a free trial account. refer https://app.datadoghq.com/account/settings#agent to install and start Datadog agent. refer https://docs.datadoghq.com/agent/apm/?tab=agent630 to ensure APM is enabled in your Datadog agent. refer https://app.datadoghq.com/logs/onboarding/server to ensure log is enabled in your Datadog agent.

2. go to https://go.lightstep.com/tracing.html, register a free trial account, then you will got an API token which is used as configuration value.

3. go to https://www.signalfx.com/, register a free trial account, login the web app and click integrations menu, follow info in `SignalFx SmartAgent` to install and start agent. On top right user avatar, choose `Organization Settings` and `Access Tokens` to get the API token.

4. Download your AWS Credentials from AWS Console. Refer [AWS Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)

5. Depending on your Operating System, create AWS credentials file in the path listed below

```
Linux, Unix, and macOS users: ~/.aws/credentials

Windows users: C:\Users\USER_NAME\.aws\credentials
```

6. credentials file should look like below

```
[default]
aws_access_key_id = SOME_ACCESS_KEY_ID
aws_secret_access_key = SOME_SECRET_ACCESS_KEY
```

7. Create a S3 bucket from AWS Console and note down the bucket name

8. Create AWS ES Domain from AWS Console and note down the end point details. **Note: This application supports ES from other providers also like Bonsai, etc...**

If you are creating ES Domain in AWS, It will take some time for ES Domain to get created and for End point details to pop up.

End point will look something like `https://search-submission-xxxxxx.us-east-1.es.amazonaws.com/`

9. From the root of the project, install NPM dependencies

```
npm i
```

10. Refer to config/default.js and Set up the environment variables as necessary

e.g.

```
export AWS_REGION="<AWS Region>"
export S3_BUCKET="<S3 Bucket Name>"
export ARTIFACT_BUCKET="<Artifact S3 Bucket Name>"
export ES_HOST="<ES Endpoint>"
export AUTH0_URL="<Auth0 URL>"
export AUTH0_CLIENT_ID="<Auth0 Client ID>"
export AUTH0_CLIENT_SECRET="<Auth0 Client Secret>"
export LIGHTSTEP_ACCESS_TOKEN=<Lightstep Access Token>
export SIGNALFX_ACCESS_TOKEN=<SignalFx Access Token>
export SIGNALFX_TRACE_AGENT_HOSTNAME=<SignalFx Trace Agent Hostname>
export DD_TRACE_AGENT_HOSTNAME=<DataDog Trace Agent Hostname>
```

**Note: Make sure to set Auth0, AWS, ES and Tracing related environment variables**

11. Modify the other configuration variables if necessary in `config/default.js`

12. Create the tables in DynamoDB by runing the script

```
npm run create-tables
```

13. Import the review types in database by running the script

```
npm run init-db
```

14. Index can be created in ES by running the script

```
npm run create-index
```

15. Since Submission processor is still under development, To load dummy data in to ES, run the following script

```
npm run init-es
```

This script will load the data from `scripts/data` directory into ES

16. Run the application

```
npm run start
```

#### Duplicating the ES Index

To duplicate the existing ES Index (from the `ES_INDEX` to `ES_INDEX_NEW` based on the configs in `config/default.js`) run `npm run create-new-index`

#### Linting JS files

```
npm run lint or npm run lint:fix -- To fix lint errors which could be fixed
```

#### Running the application in Development mode

```
npm run dev
```


## Local Deployment with Docker

To run the Submissions API using docker, follow the below steps

1. Navigate to the directory `docker`

2. Rename the file `sample.api.env` to `api.env`

3. Set the required AWS and Auth0 credentials in the file `api.env`

4. Once that is done, run the following command

```
docker-compose up
```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Unit tests and Integration tests

Integration tests use different index `submission-test` which is not same as the usual index `submission`.

Please ensure to create the index `submission-test` or the index specified in the environment variable `ES_INDEX_TEST` before running the Integration tests. You could re-use the existing scripts to create index but you would need to set the below environment variable

```
export ES_INDEX=submission-test
```


#### Running unit tests and coverage

Refer to config/test.js and Set up the environment variables as necessary

e.g.

```
export S3_BUCKET_TEST=
export AUTH0_URL=
export AUTH0_AUDIENCE=
export AUTH0_CLIENT_ID=
export AUTH0_CLIENT_SECRET=
export ES_HOST=
export ARTIFACT_BUCKET=
export ES_INDEX_TEST= !IMPORTANT! Remember to set this different from what is used in development / production. E2E tests will erase data
```

To run unit tests alone

```
npm run test
```

To run unit tests with coverage report

```
npm run cov
```

#### Running integration tests and coverage

Refer to config/test.js and Set up the environment variables as necessary

e.g.

```
export S3_BUCKET_TEST=
export AUTH0_URL=
export AUTH0_AUDIENCE=
export AUTH0_CLIENT_ID=
export AUTH0_CLIENT_SECRET=
export ES_HOST=
export ARTIFACT_BUCKET=
export ES_INDEX_TEST= !IMPORTANT! Remember to set this different from what is used in development / production. E2E tests will erase data
```

To run integration tests alone

```
npm run e2e
```

To run integration tests with coverage report

```
npm run cov-e2e
```

#### Migrating data from DynamoDB to ES

To migrate the existing data from DynamoDB to ES, run the following script

```
npm run db-to-es
```

#### Swagger UI

Swagger UI will be served at `http://localhost:3000/docs`

## Postman verification

1. Open Postman

2. Import Postman environment and Collection from `docs` directory

3. Postman API requests are categorized into four parts
   - Review Type
   - Submission
   - Review
   - Review Summation

4. Postman collection contains both positive and few negative test cases

5. After creating a submission, submissionId will be automatically set in Postman environment to serve future requests

6. Please ensure to create a submission using Postman before testing Review and ReviewSummation end points, since the body of few Review and ReviewSummation requests references `submissionId` from Environment which is set by triggering POST /submissions request in Postman.

7. Before you verify positive GET/LIST/HEAD endpoint, make sure to sync ES using command `npm run db-to-es`, because GET/LIST/HEAD endpoint will search document in ElasticeSearch instead of using DynamoDB.

8. Go to https://lauscher.topcoder-dev.com/, login with credential tonyj/appiro123, choose topic `submission.notification.create`, `submission.notification.update` or `submission.notification.delete` to verify the scan result message has successfully post by BUS API.

9. Go to https://app.lightstep.com/<Your_Project>/explorer and https://app.datadoghq.com/apm/traces to verify trace data in Lightstep and Datadog respectively. Currently, SignalFX is disabled so you don't need to verify it.

## General Notes

1. All JWT tokens provided in Postman environment file is created in JWT.IO with secret `mysecret`

2. There are 5 tokens provided in the environment collection representing each role - Topcoder User, Copilot, Administrator, non-role User, `empty` scope User

3. DynamoDB performance seems to be slower in my testing
