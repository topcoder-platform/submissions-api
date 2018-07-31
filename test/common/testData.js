/*
 * Test data for all resources
 */

const nonExReviewTypeId = 'b56a4180-65aa-42ec-a945-5fd21dec0501'

const testReviewType = {
  Item: {
    'id': 'a56a4180-65aa-42ec-a945-5fd21dec0501',
    'name': 'test',
    'isActive': true
  }
}

const testReviewTypePatch = {
  Item: {
    'id': 'a56a4180-65aa-42ec-a945-5fd21dec0501',
    'name': 'testPatching',
    'isActive': true
  }
}

const testReviewTypesES = {
  hits:
   { total: 5,
     max_score: 0,
     hits: [ { _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0505',
       _score: 0,
       _source:
     { name: 'Iterative Review',
       id: 'a56a4180-65aa-42ec-a945-5fd21dec0505',
       isActive: true } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
       { name: 'Appeals Response',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0504',
         isActive: true } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
       { name: 'Review',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0503',
         isActive: true } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
       { name: 'Screening',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
         isActive: true } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
       { name: 'Checkpoint Review',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0502',
         isActive: true } } ]
   }
}

const nonExSubmissionId = 'b3564180-65aa-42ec-a945-5fd21dec0502'

const testSubmission = {
  Item: {
    challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    type: 'ContestSubmission',
    url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
    memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    submissionPhaseId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionWoLegacy = {
  Item: {
    challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
    type: 'ContestSubmission',
    url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
    memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionPatch = {
  Item: {
    challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    type: 'TestChange',
    url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=654321',
    memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0502',
    submissionPhaseId: 'b24d4180-65aa-42ec-a945-5fd21dec0502',
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionsES = {
  hits:
   { total: 5,
     max_score: 0,
     hits: [ { _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
     { challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123458',
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0503' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
     { challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
     { challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123457',
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0502' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0505',
       _score: 0,
       _source:
     { challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0505',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123460',
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0505' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
     { challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123459',
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0504' } } ]

   }
}

const nonExReviewId = 'b24d4180-65aa-42ec-a945-5fd21dec0501'

const testReview = {
  Item: {
    id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
    score: 92,
    reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
    typeId: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  }
}

const testReviewPatch = {
  Item: {
    id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
    score: 90,
    reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
    typeId: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  }
}

const testReviewsES = {
  hits:
   { total: 4,
     max_score: 0,
     hits: [ { _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
     { score: 95.5,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0501',
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
     { score: 65,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0504',
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
     { score: 92,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
     { score: 80.83,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 'b25a4180-65aa-42ec-a945-5fd21dec0503',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0503',
       updated: '2018-06-01T07:36:28.178Z' } } ]
   }
}

const nonExReviewSummationId = 'b45e4180-65aa-42ec-a945-5fd21dec1504'

const testReviewSummation = {
  Item: {
    id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
    aggregateScore: 99,
    isPassing: true,
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'copilot',
    updatedBy: 'copilot'
  }
}

const testReviewSummationPatch = {
  Item: {
    id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
    aggregateScore: 78.5,
    isPassing: false,
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'copilot',
    updatedBy: 'copilot'
  }
}

const testReviewSummationsES = {
  hits:
   { total: 4,
     max_score: 0,
     hits: [ { _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1503',
       _score: 0,
       _source:
     { aggregateScore: 46.3,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1503',
       isPassing: false,
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1501',
       _score: 0,
       _source:
     { aggregateScore: 17.8,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1501',
       isPassing: false,
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1502',
       _score: 0,
       _source:
     { aggregateScore: 84.5,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1502',
       isPassing: true,
       updated: '2018-06-01T07:36:28.178Z' } },
     { _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
       _score: 0,
       _source:
     { aggregateScore: 99,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 'a12a4180-65aa-42ec-a945-5fd21dec0587',
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
       isPassing: true,
       updated: '2018-06-01T07:36:28.178Z' } } ]

   }
}

module.exports = {
  nonExReviewTypeId,
  testReviewType,
  testReviewTypePatch,
  testReviewTypesES,
  nonExSubmissionId,
  testSubmission,
  testSubmissionWoLegacy,
  testSubmissionPatch,
  testSubmissionsES,
  nonExReviewId,
  testReview,
  testReviewPatch,
  testReviewsES,
  nonExReviewSummationId,
  testReviewSummation,
  testReviewSummationPatch,
  testReviewSummationsES
}
