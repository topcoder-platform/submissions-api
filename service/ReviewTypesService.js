'use strict';


/**
 * Create a review type.
 * Create a new review type.  **Authorization:** Review type creation is accessible by roles `admin` and `copilot`. 
 *
 * body ReviewType 
 * returns ReviewType
 **/
exports.createReviewType = function(body) {
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
 * Delete the review type.
 * Delete the review type.  **Authorization:** Review type deletion is accessible only by `admin` role. 
 *
 * reviewTypeId String review type id
 * no response value expected for this operation
 **/
exports.deleteReviewType = function(reviewTypeId) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get the review type.
 * Get the review type by id.  **Authorization:** Review type is accessible by roles `admin` and `copilot`. 
 *
 * reviewTypeId String review type id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns ReviewType
 **/
exports.getReviewType = function(reviewTypeId,ifNoneMatch,ifModifiedSince) {
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
 * Get all review types.
 * Get all review types. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Resulted collection of review types can be filtered using filter parameters `name`, `isActive` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review types is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * name String The name filter for review types. (optional)
 * isActive Boolean The active boolean flag filter for review types. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * returns List
 **/
exports.getReviewTypes = function(page,perPage,name,isActive,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "id" : "928a2ec51c69ef84f5dccc4f",
  "name" : "Iterative Review",
  "isActive" : true
}, {
  "id" : "c36f666674ed76b0071ee322",
  "name" : "Spec Review",
  "isActive" : true
}, {
  "id" : "583581ae0c02bad6f274939b",
  "name" : "Screening",
  "isActive" : true
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
 * Get response status and headers information for the endpoint. It does not contain response body.  **Authorization:** Review type is accessible by roles `admin` and `copilot`. 
 *
 * reviewTypeId String review type id
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReviewType = function(reviewTypeId,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get only response status and headers information but no response body for the endpoint. 
 * Get response status and headers information for the endpoint. Link headers are sent back and they have rel set to prev, next, first, last and contain the relevant URL.  Requested review types can be filtered using filter parameters `name`, `isActive` (all filter parameters are optional and combined by the logical operation `AND`).  **Authorization:** Review types is accessible by roles `admin` and `copilot`. 
 *
 * page Integer The page number. (optional)
 * perPage Integer The number of items to list per page. (optional)
 * name String The name filter for review types. (optional)
 * isActive Boolean The active boolean flag filter for review types. (optional)
 * ifNoneMatch String Optional. If used in the request, the If-None-Match request header should utilize the ETag as previously supplied in the response.  (optional)
 * ifModifiedSince String Optional. In the subsequent request, the If-Modified-Since request header can be populated with the previously retrieved `Last-Modified`.  (optional)
 * no response value expected for this operation
 **/
exports.headReviewTypes = function(page,perPage,name,isActive,ifNoneMatch,ifModifiedSince) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Partially update the review type.
 * Allows to partially modify the review type with the provided request body properties.  **Authorization:** Partially modify of review type is accessible only by `admin` role. 
 *
 * reviewTypeId String review type id
 * body PartiallyReviewType 
 * returns ReviewType
 **/
exports.partiallyUpdateReviewType = function(reviewTypeId,body) {
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
 * Update the review type.
 * Update the review type by id.  **Authorization:** Review type update is accessible only by `admin` role. 
 *
 * reviewTypeId String review type id
 * body UpdatableReviewType 
 * returns ReviewType
 **/
exports.updateReviewType = function(reviewTypeId,body) {
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

