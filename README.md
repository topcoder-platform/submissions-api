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

5. From the root of the project, install NPM dependencies

```
npm i
```

6. Refer to config/default.js and Set up the environment variables as necessary

```
export AWS_REGION="<AWS Region>"
export S3_BUCKET="<S3 Bucket Name>"
```

7. Modify the other configuration variables if necessary in `config/default.js`

8. Create the tables in DynamoDB by runing the script

```
npm run create-tables
```

9. Import the review types in database by running the script

```
npm run init-db
```

10. Run the application

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

3. Postman API requests are categorized into two parts 
   - ReviewType
   - Submission

4. Postman collection contains both positive and few negative test cases

5. After creating a submission, submissionId will be automatically set in Postman environment to serve future requests

## General Notes

1. All JWT tokens provided in Postman environment file is created in JWT.IO with secret `mysecret`

2. There are 3 tokens provided in the environment collection representing each role - Topcoder User, Copilot, Administrator

3. DynamoDB performance seems to be slower in my testing