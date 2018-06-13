'use strict';


/**
 * Create a submission.
 * Create a new submission.  **Authorization:** Submission creation is accessible by roles `topcoder user`, `admin` and `copilot`. 
 *
 * body Submission 
 * returns Submission
 **/
exports.createSubmission = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Delete the submission.
 * Delete the submission.  **Authorization:** Submission deletion is accessible only by `admin` role. 
 *
 * submissionId String submission id
 * no response value expected for this operation
 **/
exports.deleteSubmission = function(submissionId) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get the submission.
 * Get the submission by id.  **Authorization:** Submission is accessible by roles `topcoder user`, `admin` and `copilot`. 
 *
 * submissionId String submission id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns Submission
 **/
exports.getSubmission = function(submissionId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Get all submissions.
 * Get all submissions. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Resulted collection of submissions can be filtered using filter parameters `type`, `url`, `memberId`, `challengeId` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Submission is accessible by roles `topcoder user`, `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * type String The type filter for submissions. (optional)
 * url String The url filter for submissions. (optional)
 * memberId String The member id filter for submissions. (optional)
 * challengeId String The challenge id filter for submissions. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns List
 **/
exports.getSubmissions = function(page,perPage,type,url,memberId,challengeId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "id" : "f11668564ca74c265de7009b",
  "type" : "ContestSubmission",
  "url" : "https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456",
  "memberId" : "d40796a325341bdb8c973656",
  "challengeId" : "8b1a70e7e492adc4551a0d68",
  "created" : "2018-05-20T07:00:30.123Z",
  "updated" : "2018-06-01T07:36:28.178Z",
  "createdBy" : "topcoder user",
  "updatedBy" : "topcoder user"
}, {
  "id" : "c160c47299589a2d90bd2247",
  "type" : "ContestSubmission",
  "url" : "https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123457",
  "memberId" : "d40796a325341bdb8c973656",
  "challengeId" : "8b1a70e7e492adc4551a0d68",
  "created" : "2018-05-20T08:00:30.000Z",
  "updated" : "2018-06-01T09:23:00.178Z",
  "createdBy" : "topcoder user",
  "updatedBy" : "topcoder user"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Get only response status and headers information but no response body for the endpoint. 
 * Get response status and headers information for the endpoint. It does not contain response body.  **Authorization:** Submission is accessible by roles `topcoder user`, `admin` and `copilot`. 
 *
 * submissionId String submission id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headSubmission = function(submissionId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get only response status and headers information but no response body for the endpoint. 
 * Get response status and headers information for the endpoint. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Requested submissions can be filtered using filter parameters `type`, `url`, `memberId`, `challengeId` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Submission is accessible by roles `topcoder user`, `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * type String The type filter for submissions. (optional)
 * url String The url filter for submissions. (optional)
 * memberId String The member id filter for submissions. (optional)
 * challengeId String The challenge id filter for submissions. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headSubmissions = function(page,perPage,type,url,memberId,challengeId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Partially update the submission.
 * Allows to partially modify the submission with the provided request body properties.  **Authorization:** Partially modify of submission is accessible only by `admin` role. 
 *
 * submissionId String submission id
 * body PartiallySubmission 
 * returns Submission
 **/
exports.partiallyUpdateSubmission = function(submissionId,body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Update the submission.
 * Update the submission by id.  **Authorization:** Submission update is accessible only by `admin` role. 
 *
 * submissionId String submission id
 * body UpdatableSubmission 
 * returns Submission
 **/
exports.updateSubmission = function(submissionId,body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

