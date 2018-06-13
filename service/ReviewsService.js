'use strict';


/**
 * Create a review.
 * Create a new review.  **Authorization:** Review creation is accessible by roles `admin` and `copilot`. 
 *
 * body Review 
 * returns Review
 **/
exports.createReview = function(body) {
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
 * Delete the review.
 * Delete the review.  **Authorization:** Review deletion is accessible only by `admin` role. 
 *
 * reviewId String review id
 * no response value expected for this operation
 **/
exports.deleteReview = function(reviewId) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get the review.
 * Get the review by id.  **Authorization:** Review is accessible by roles `admin` and `copilot`. 
 *
 * reviewId String review id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns Review
 **/
exports.getReview = function(reviewId,ifNoneMatch,ifModifiedSince) {
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
 * Get all reviews.
 * Get all reviews. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Resulted collection of reviews can be filtered using filter parameters `score`, `typeId`, `reviewerId`, `scoreCardId` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * score Double The score filter for reviews. (optional)
 * typeId String The type id filter for reviews. (optional)
 * reviewerId String The reviewer id filter for reviews. (optional)
 * scoreCardId String The score card id filter for reviews. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns List
 **/
exports.getReviews = function(page,perPage,score,typeId,reviewerId,scoreCardId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "id" : "a75529df08beff833f4c6282",
  "score" : 95.5,
  "typeId" : "b0b2a8220fcd169f684093fb",
  "reviewerId" : "fcadaf16dae64f5fb43bc7ee",
  "scoreCardId" : "0bf26a9e69e564a6c2988d12",
  "submissionId" : "255456",
  "created" : "2018-05-20T07:00:30.123Z",
  "updated" : "2018-06-01T07:36:28.178Z",
  "createdBy" : "admin",
  "updatedBy" : "admin"
}, {
  "id" : "e84031c74a9566fe5ab848eb",
  "score" : 77.8,
  "typeId" : "8bc66db12b81f038a19ecd00",
  "reviewerId" : "973fd66d229a7cfdbe9d9981",
  "scoreCardId" : "ffd96446bda80799bb2d34ed",
  "submissionId" : "255457",
  "created" : "2018-05-20T07:00:30.123Z",
  "updated" : "2018-06-01T07:36:28.178Z",
  "createdBy" : "admin",
  "updatedBy" : "admin"
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
 * Get response status and headers information for the endpoint. It does not contain response body.  **Authorization:** Review is accessible by roles `admin` and `copilot`. 
 *
 * reviewId String review id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReview = function(reviewId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get only response status and headers information but no response body for the endpoint. 
 * Get response status and headers information for the endpoint. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Requested reviews can be filtered using filter parameters `score`, `typeId`, `reviewerId`, `scoreCardId` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * score Double The score filter for reviews. (optional)
 * typeId String The type id filter for reviews. (optional)
 * reviewerId String The reviewer id filter for reviews. (optional)
 * scoreCardId String The score card id filter for reviews. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReviews = function(page,perPage,score,typeId,reviewerId,scoreCardId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Partially update the review.
 * Allows to partially modify the review with the provided request body properties.  **Authorization:** Partially modify of review is accessible only by `admin` role. 
 *
 * reviewId String review id
 * body PartiallyReview 
 * returns Review
 **/
exports.partiallyUpdateReview = function(reviewId,body) {
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
 * Update the review.
 * Update the review by id.  **Authorization:** Review update is accessible only by `admin` role. 
 *
 * reviewId String review id
 * body UpdatableReview 
 * returns Review
 **/
exports.updateReview = function(reviewId,body) {
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

