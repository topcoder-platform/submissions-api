'use strict';

var utils = require('../utils/writer.js');
var ReviewSummations = require('../service/ReviewSummationsService');

module.exports.createReviewSummation = function createReviewSummation (req, res, next) {
  var body = req.swagger.params['body'].value;
  ReviewSummations.createReviewSummation(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteReviewSummation = function deleteReviewSummation (req, res, next) {
  var reviewSummationId = req.swagger.params['reviewSummationId'].value;
  ReviewSummations.deleteReviewSummation(reviewSummationId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviewSummation = function getReviewSummation (req, res, next) {
  var reviewSummationId = req.swagger.params['reviewSummationId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewSummations.getReviewSummation(reviewSummationId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviewSummations = function getReviewSummations (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var submissionId = req.swagger.params['submissionId'].value;
  var aggregateScore = req.swagger.params['aggregateScore'].value;
  var scoreCardId = req.swagger.params['scoreCardId'].value;
  var isPassing = req.swagger.params['isPassing'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewSummations.getReviewSummations(page,perPage,submissionId,aggregateScore,scoreCardId,isPassing,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReviewSummation = function headReviewSummation (req, res, next) {
  var reviewSummationId = req.swagger.params['reviewSummationId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewSummations.headReviewSummation(reviewSummationId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headReviewSummations = function headReviewSummations (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var submissionId = req.swagger.params['submissionId'].value;
  var aggregateScore = req.swagger.params['aggregateScore'].value;
  var scoreCardId = req.swagger.params['scoreCardId'].value;
  var isPassing = req.swagger.params['isPassing'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  ReviewSummations.headReviewSummations(page,perPage,submissionId,aggregateScore,scoreCardId,isPassing,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.partiallyUpdateReviewSummation = function partiallyUpdateReviewSummation (req, res, next) {
  var reviewSummationId = req.swagger.params['reviewSummationId'].value;
  var body = req.swagger.params['body'].value;
  ReviewSummations.partiallyUpdateReviewSummation(reviewSummationId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateReviewSummation = function updateReviewSummation (req, res, next) {
  var reviewSummationId = req.swagger.params['reviewSummationId'].value;
  var body = req.swagger.params['body'].value;
  ReviewSummations.updateReviewSummation(reviewSummationId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
