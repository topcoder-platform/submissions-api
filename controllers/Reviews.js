'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');

module.exports.createReview = function createReview (req, res, next) {
  var body = req.swagger.params['body'].value;
  Reviews.createReview(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteReview = function deleteReview (req, res, next) {
  var reviewId = req.swagger.params['reviewId'].value;
  Reviews.deleteReview(reviewId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReview = function getReview (req, res, next) {
  var reviewId = req.swagger.params['reviewId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Reviews.getReview(reviewId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviews = function getReviews (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var score = req.swagger.params['score'].value;
  var typeId = req.swagger.params['typeId'].value;
  var reviewerId = req.swagger.params['reviewerId'].value;
  var scoreCardId = req.swagger.params['scoreCardId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Reviews.getReviews(page,perPage,score,typeId,reviewerId,scoreCardId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReview = function headReview (req, res, next) {
  var reviewId = req.swagger.params['reviewId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Reviews.headReview(reviewId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReviews = function headReviews (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var score = req.swagger.params['score'].value;
  var typeId = req.swagger.params['typeId'].value;
  var reviewerId = req.swagger.params['reviewerId'].value;
  var scoreCardId = req.swagger.params['scoreCardId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Reviews.headReviews(page,perPage,score,typeId,reviewerId,scoreCardId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.partiallyUpdateReview = function partiallyUpdateReview (req, res, next) {
  var reviewId = req.swagger.params['reviewId'].value;
  var body = req.swagger.params['body'].value;
  Reviews.partiallyUpdateReview(reviewId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateReview = function updateReview (req, res, next) {
  var reviewId = req.swagger.params['reviewId'].value;
  var body = req.swagger.params['body'].value;
  Reviews.updateReview(reviewId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
