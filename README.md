# Topcoder Submission API

## Pre-requisites

1. Active AWS Account
2. Node.js 8.11.x
3. Npm 5.6.x
4. Postman for Verification

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

6. From the root of the project, install NPM dependencies

```
npm i
```

7. Refer to config/default.js and Set up the environment variables as necessary

e.g.

```
export AWS_REGION="<AWS Region>"
export S3_BUCKET="<S3 Bucket Name>"
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

## General Notes

1. All JWT tokens provided in Postman environment file is created in JWT.IO with secret `mysecret`

2. There are 3 tokens provided in the environment collection representing each role - Topcoder User, Copilot, Administrator

3. DynamoDB performance seems to be slower in my testing