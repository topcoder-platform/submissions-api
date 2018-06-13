'use strict';

var utils = require('../utils/writer.js');
var ReviewTypes = require('../service/ReviewTypesService');

module.exports.createReviewType = function createReviewType (req, res, next) {
  var body = req.swagger.params['body'].value;
  ReviewTypes.createReviewType(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteReviewType = function deleteReviewType (req, res, next) {
  var reviewTypeId = req.swagger.params['reviewTypeId'].value;
  ReviewTypes.deleteReviewType(reviewTypeId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviewType = function getReviewType (req, res, next) {
  var reviewTypeId = req.swagger.params['reviewTypeId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewTypes.getReviewType(reviewTypeId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviewTypes = function getReviewTypes (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var name = req.swagger.params['name'].value;
  var isActive = req.swagger.params['isActive'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewTypes.getReviewTypes(page,perPage,name,isActive,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReviewType = function headReviewType (req, res, next) {
  var reviewTypeId = req.swagger.params['reviewTypeId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewTypes.headReviewType(reviewTypeId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReviewTypes = function headReviewTypes (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var name = req.swagger.params['name'].value;
  var isActive = req.swagger.params['isActive'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewTypes.headReviewTypes(page,perPage,name,isActive,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.partiallyUpdateReviewType = function partiallyUpdateReviewType (req, res, next) {
  var reviewTypeId = req.swagger.params['reviewTypeId'].value;
  var body = req.swagger.params['body'].value;
  ReviewTypes.partiallyUpdateReviewType(reviewTypeId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateReviewType = function updateReviewType (req, res, next) {
  var reviewTypeId = req.swagger.params['reviewTypeId'].value;
  var body = req.swagger.params['body'].value;
  ReviewTypes.updateReviewType(reviewTypeId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
