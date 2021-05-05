# Topcoder Submission API

Topcoder's API that deals with submissions, reviews, review summations and review types on the Topcoder platform

## Devlopment status

[![Total alerts](https://img.shields.io/lgtm/alerts/g/topcoder-platform/submissions-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/topcoder-platform/submissions-api/alerts/)[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/topcoder-platform/submissions-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/topcoder-platform/submissions-api/context:javascript)

### Deployment status

Dev: [![CircleCI](https://circleci.com/gh/topcoder-platform/submissions-api/tree/develop.svg?style=svg)](https://circleci.com/gh/topcoder-platform/submissions-api/tree/develop) Prod: [![CircleCI](https://circleci.com/gh/topcoder-platform/submissions-api/tree/master.svg?style=svg)](https://circleci.com/gh/topcoder-platform/submissions-api/tree/master)

## Swagger definition

- [Swagger](https://api.topcoder.com/v5/submissions/docs)

## Intended use

- Production API

## Related repos

- [ES Processor](https://github.com/topcoder-platform/submission-processor-es) - Updates data in ElasticSearch

## Pre-requisites

1. Active AWS Account
2. Node.js 8.11.x
3. Npm 5.6.x
4. Postman for Verification 
5. Docker and Docker-Compose (Optional for Local Deployment)

## Setup

1. Download your AWS Credentials from AWS Console. Refer [AWS Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)

2. Depending on your Operating System, create AWS credentials file in the path listed below

```
Linux, Unix, and macOS users: ~/.aws/credentials

Windows users: C:\Users\USER_NAME\.aws\credentials
```

3. credentials file should look like below

```
[default]
aws_access_key_id = SOME_ACCESS_KEY_ID
aws_secret_access_key = SOME_SECRET_ACCESS_KEY
```


4. Create a S3 bucket from AWS Console and note down the bucket name

5. Create AWS ES Domain from AWS Console and note down the end point details. **Note: This application supports ES from other providers also like Bonsai, etc...**

If you are creating ES Domain in AWS, It will take some time for ES Domain to get created and for End point details to pop up.

End point will look something like `https://search-submission-xxxxxx.us-east-1.es.amazonaws.com/`

6. From the root of the project, install NPM dependencies

```
npm i
```

7. Refer to config/default.js and Set up the environment variables as necessary

e.g.

```
export AWS_REGION="<AWS Region>"
export S3_BUCKET="<S3 Bucket Name>"
export ARTIFACT_BUCKET="<Artifact S3 Bucket Name>"
export ES_HOST="<ES Endpoint>"
export AUTH0_URL="<Auth0 URL>"
export AUTH0_CLIENT_ID="<Auth0 Client ID>"
export AUTH0_CLIENT_SECRET="<Auth0 Client Secret>"
```

**Note: Make sure to set Auth0, AWS and ES related environment variables**

8. Modify the other configuration variables if necessary in `config/default.js`

9. Create the tables in DynamoDB by runing the script

```
npm run create-tables
```

10. Import the review types in database by running the script

```
npm run init-db
```

11. Index can be created in ES by running the script

```
npm run create-index
```

12. Since Submission processor is still under development, To load dummy data in to ES, run the following script

```
npm run init-es
```

This script will load the data from `scripts/data` directory into ES

13. Run the application

```
npm run start
```

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

#### Running unit tests and coverage

To run unit tests alone

```
npm run test
```

To run unit tests with coverage report

```
npm run cov
```

#### Migrating data from DynamoDB to ES

To migrate the existing data from DynamoDB to ES, run the following script

```
npm run db-to-es
```

#### Store v5 challenge id for current records

Submission API started off using the legacy challenge ids. With the v5 upgrade to the challenge api, we now need to make use of the v5 challenge ids. We have thus created a script to update existing `challengeId` attribute on submissions to v5 and store the older challenge ids in the `legacyChallengeId` attribute.

To update the existing challengeId data on submissions in DynamoDB to v5 challengeId, set the following env variables:

```bash
SUBMISSION_TABLE_NAME // Table name of the submission records. Defaults to 'Submission'
UPDATE_V5_CHALLENGE_BATCH_SIZE // Number of records that are updated simultaneously. Defaults to 250
FETCH_CREATED_DATE_START // The start day of fetch latest challenges. Defaults to '2021-01-01'
FETCH_PAGE_SIZE // The page size of each api request. Defaults to 500
```


and then run the following script

```
npm run update-to-v5-challengeId
```

## Newman/Postman verification

1. Make sure your AWS access key credentials are configured properly.
2. Set following config/test environment variables
- AWS variables
```
AWS_REGION:
S3_BUCKET:
ARTIFACT_BUCKET:
```
- Variables to auto generate tokens on automated postman testing
```
AUTH_SECRET:
AUTH0_URL:
AUTH0_CLIENT_ID:
AUTH0_CLIENT_SECRET:
AUTH0_AUDIENCE:
AUTH_V2_URL:
AUTH_V2_CLIENT_ID:
AUTH_V3_URL:
```
- Following config/test environments are used to generate tokens. Some tests rely on user's memberId, do not change them.
```
ADMIN_CREDENTIALS_USERNAME:
ADMIN_CREDENTIALS_PASSWORD:
COPILOT_CREDENTIALS_USERNAME:
COPILOT_CREDENTIALS_PASSWORD:
USER_CREDENTIALS_USERNAME:
USER_CREDENTIALS_PASSWORD:
```
- Following config/test environments are endpoints of the mock api. No need to change them. Mock api mocks BUS API, CHALLENGE API and RESOURCE API
```
BUSAPI_EVENTS_URL:
BUSAPI_URL:
CHALLENGEAPI_V5_URL:
RESOURCEAPI_V5_BASE_URL:
```
3. run command `npm install`
4. run command `npm run lint`
5. run command `npm run services:up` This will start elastic search and mock api.
6. run command `npm run cleanup` This will recreate tables and ES indexes, and import demo data into ES. It can throw error when trying to delete non existing tables or indexes, don't worry it will continue to executing. Run this command before subsequent tests. Tests use different index `submission-test` which is not same as the usual index `submission`.
7. run command `NODE_ENV=test npm start`
8. run command `npm run test:newman`
9. To execute tests in Postman, import postman collection and environments under test/postman directory into Postman. Go to settings and set the working directory to the root folder of this api. On runner, use correspoinding iteration data.
10. Auto generated tokens have 10 mins expiration time. Tests take 3 mins to complete.

## General Notes

1. All JWT tokens provided in Postman environment file is created in JWT.IO with secret `mysecret`

2. There are 3 tokens provided in the environment collection representing each role - Topcoder User, Copilot, Administrator

3. DynamoDB performance seems to be slower in my testing
