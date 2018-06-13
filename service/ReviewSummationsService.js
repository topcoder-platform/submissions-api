'use strict';


/**
 * Create a review summation.
 * Create a new review summation.  **Authorization:** Review summation creation is accessible by roles `admin` and `copilot`. 
 *
 * body ReviewSummation 
 * returns ReviewSummation
 **/
exports.createReviewSummation = function(body) {
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
 * Delete the review summation.
 * Delete the review summation.  **Authorization:** Review summation deletion is accessible only by `admin` role. 
 *
 * reviewSummationId String review summation id
 * no response value expected for this operation
 **/
exports.deleteReviewSummation = function(reviewSummationId) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get the review summation.
 * Get the review summation by id.  **Authorization:** Review summation is accessible by roles `admin` and `copilot`. 
 *
 * reviewSummationId String review summation id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns ReviewSummation
 **/
exports.getReviewSummation = function(reviewSummationId,ifNoneMatch,ifModifiedSince) {
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
 * Get all review summations.
 * Get all review summations. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Resulted collection of review summations can be filtered using filter parameters `submissionId`, `aggregateScore`, `scoreCardId`, `isPassing` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review summation is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * submissionId String The submission id filter for review summations. (optional)
 * aggregateScore Double Theaggregate score filter for review summations. (optional)
 * scoreCardId String The score card id filter for review summations. (optional)
 * isPassing Boolean The passing boolean flag filter for review summations. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns List
 **/
exports.getReviewSummations = function(page,perPage,submissionId,aggregateScore,scoreCardId,isPassing,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "id" : "38c31a722f4be8d96c2bf02d",
  "submissionId" : "9ff95a9cb59a973c3fd68833",
  "aggregateScore" : 17.8,
  "scoreCardId" : "a6999566638fb16dbdf668fd",
  "isPassing" : false,
  "created" : "2018-05-20T07:00:30.123Z",
  "updated" : "2018-06-01T07:36:28.178Z",
  "createdBy" : "copilot",
  "updatedBy" : "copilot"
}, {
  "id" : "6c238bd70a8df6d57f8cbdb4",
  "submissionId" : "0e1c182598114350758eaca7",
  "aggregateScore" : 97.8,
  "scoreCardId" : "b3916bd336590c55577d3056",
  "isPassing" : true,
  "created" : "2018-05-20T07:00:30.123Z",
  "updated" : "2018-06-01T07:36:28.178Z",
  "createdBy" : "copilot",
  "updatedBy" : "copilot"
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
 * Get response status and headers information for the endpoint. It does not contain response body.  **Authorization:** Review summation is accessible by roles `admin` and `copilot`. 
 *
 * reviewSummationId String review summation id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReviewSummation = function(reviewSummationId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get only response status and headers information but no response body for the endpoint. 
 * Get response status and headers information for the endpoint. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Requested review summations can be filtered using filter parameters `submissionId`, `aggregateScore`, `scoreCardId`, `isPassing` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review summation is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * submissionId String The submission id filter for review summations. (optional)
 * aggregateScore Double Theaggregate score filter for review summations. (optional)
 * scoreCardId String The score card id filter for review summations. (optional)
 * isPassing Boolean The passing boolean flag filter for review summations. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReviewSummations = function(page,perPage,submissionId,aggregateScore,scoreCardId,isPassing,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Partially update the review summation.
 * Allows to partially modify the review summation with the provided request body properties.  **Authorization:** Partially modify of review summation is accessible only by `admin` role. 
 *
 * reviewSummationId String review summation id
 * body PartiallyReviewSummation 
 * returns ReviewSummation
 **/
exports.partiallyUpdateReviewSummation = function(reviewSummationId,body) {
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
 * Update the review summation.
 * Update the review summation by id.  **Authorization:** Review summation update is accessible only by `admin` role. 
 *
 * reviewSummationId String review summation id
 * body UpdatableReviewSummation 
 * returns ReviewSummation
 **/
exports.updateReviewSummation = function(reviewSummationId,body) {
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

