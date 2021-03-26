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

## Unit tests and Integration tests

Integration tests use different index `submission-test` which is not same as the usual index `submission`.

Please ensure to create the index `submission-test` or the index specified in the environment variable `ES_INDEX_TEST` before running the Integration tests. You could re-use the existing scripts to create index but you would need to set the below environment variable

```
export ES_INDEX=submission-test
```

#### Running unit tests and coverage

To run unit tests alone

```
npm run test
```

To run unit tests with coverage report

```
npm run cov
```

#### Running integration tests and coverage

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

## General Notes

1. All JWT tokens provided in Postman environment file is created in JWT.IO with secret `mysecret`

2. There are 3 tokens provided in the environment collection representing each role - Topcoder User, Copilot, Administrator

3. DynamoDB performance seems to be slower in my testing
