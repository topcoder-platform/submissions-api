'use strict';

var utils = require('../utils/writer.js');
var Submissions = require('../service/SubmissionsService');

module.exports.createSubmission = function createSubmission (req, res, next) {
  Submissions.createSubmission(req.files, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      let payload;

      if (response && Number.isInteger(response)) {
        payload = utils.respondWithCode(response);
        utils.writeJson(res, payload);
      } else {
        payload = utils.respondWithCode(500); // server error
        utils.writeJson(res, payload);
      }
    });
};

module.exports.deleteSubmission = function deleteSubmission (req, res, next) {
  var submissionId = req.swagger.params['submissionId'].value;
  Submissions.deleteSubmission(submissionId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSubmission = function getSubmission (req, res, next) {
  var submissionId = req.swagger.params['submissionId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Submissions.getSubmission(submissionId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSubmissions = function getSubmissions (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var type = req.swagger.params['type'].value;
  var url = req.swagger.params['url'].value;
  var memberId = req.swagger.params['memberId'].value;
  var challengeId = req.swagger.params['challengeId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Submissions.getSubmissions(page,perPage,type,url,memberId,challengeId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headSubmission = function headSubmission (req, res, next) {
  var submissionId = req.swagger.params['submissionId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Submissions.headSubmission(submissionId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.headSubmissions = function headSubmissions (req, res, next) {
  var page = req.swagger.params['page'].value;
  var perPage = req.swagger.params['perPage'].value;
  var type = req.swagger.params['type'].value;
  var url = req.swagger.params['url'].value;
  var memberId = req.swagger.params['memberId'].value;
  var challengeId = req.swagger.params['challengeId'].value;
  var ifNoneMatch = req.swagger.params['If-None-Match'].value;
  var ifModifiedSince = req.swagger.params['If-Modified-Since'].value;
  Submissions.headSubmissions(page,perPage,type,url,memberId,challengeId,ifNoneMatch,ifModifiedSince)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.partiallyUpdateSubmission = function partiallyUpdateSubmission (req, res, next) {
  var submissionId = req.swagger.params['submissionId'].value;
  var body = req.swagger.params['body'].value;
  Submissions.partiallyUpdateSubmission(submissionId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateSubmission = function updateSubmission (req, res, next) {
  var submissionId = req.swagger.params['submissionId'].value;
  var body = req.swagger.params['body'].value;
  Submissions.updateSubmission(submissionId,body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
