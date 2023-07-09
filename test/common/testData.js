/*
 * Test data for all resources
 */

const nonExReviewTypeId = 'b56a4180-65aa-42ec-a945-5fd21dec0501'

const testReviewType = {
  Item: {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
    name: 'Screening',
    isActive: true
  }
}

const testReviewTypePatch = {
  Item: {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
    name: 'testPatching',
    isActive: true
  }
}

const testReviewTypeES = {
  hits:
   {
     total: 1,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source: {
         id: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         name: 'Screening',
         isActive: true
       }
     }]
   }
}

const testReviewTypesES = {
  hits:
   {
     total: 5,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0505',
       _score: 0,
       _source:
     {
       name: 'Iterative Review',
       id: 'a56a4180-65aa-42ec-a945-5fd21dec0505',
       isActive: true
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
       {
         name: 'Appeals Response',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0504',
         isActive: true
       }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
       {
         name: 'Review',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0503',
         isActive: true
       }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
       {
         name: 'Screening',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0501',
         isActive: true
       }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a56a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
       {
         name: 'Checkpoint Review',
         id: 'a56a4180-65aa-42ec-a945-5fd21dec0502',
         isActive: true
       }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'f28b2725-ef90-4495-af59-ceb2bd98fc10',
       _score: 0,
       _source:
       {
         name: 'AV Scan',
         id: 'f28b2725-ef90-4495-af59-ceb2bd98fc10',
         isActive: true
       }
     }]
   }
}

const nonExSubmissionId = 'b3564180-65aa-42ec-a945-5fd21dec0502'

const testChallengeResources = [
  {
    id: '9a06daeb-1b8e-4d91-9bd4-c5fda7c93db2',
    challengeId: '9131c5da-6ed9-4186-9a1b-4de31df5ba17',
    memberId: '88774396',
    memberHandle: 'Sharathkumar92',
    roleId: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd',
    created: '2021-02-02T22:51:59.000Z',
    createdBy: 'jmgasper'
  },
  {
    id: '9a06daeb-1b8e-4d91-9bd4-c5fda7c93db2',
    challengeId: '9131c5da-6ed9-4186-9a1b-4de31df5ba17',
    memberId: '88774396',
    memberHandle: 'Sharathkumar92',
    roleId: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bb',
    created: '2021-02-02T22:51:59.000Z',
    createdBy: 'jmgasper'
  }
]

const testResourceRoles = [
  {
    id: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd',
    name: 'Copilot',
    legacyId: 14,
    fullReadAccess: true,
    fullWriteAccess: true,
    isActive: true,
    selfObtainable: false
  },
  {
    id: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bb',
    name: 'Submitter',
    legacyId: 14,
    fullReadAccess: true,
    fullWriteAccess: true,
    isActive: true,
    selfObtainable: false
  }
]

const testSubmission = {
  Item: {
    challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    type: 'ContestSubmission',
    url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
    memberId: 40493050,
    legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    submissionPhaseId: 764567,
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user',
    review: [],
    reviewSummation: []
  }
}

const testSubmissionWoLegacy = {
  Item: {
    challengeId: 30049360,
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
    type: 'ContestSubmission',
    url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123457',
    memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0502',
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
    submissionPhaseId: 764567,
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionES = {
  hits:
   {
     total: 1,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source: {
         challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
         id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         type: 'ContestSubmission',
         url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
         memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
         legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
         submissionPhaseId: 764567,
         created: '2018-05-20T07:00:30.123Z',
         createdBy: 'topcoder user',
         updated: '2018-06-01T07:36:28.178Z',
         updatedBy: 'topcoder user'
       }
     }]
   }
}

const testSubmissionsES = {
  hits:
   {
     total: 5,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
     {
       challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123458',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         metadata: {
           public: 'public data',
           private: 'private data'
         },
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }],
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0503'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
     {
       challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         metadata: {
           public: 'public data',
           private: 'private data'
         },
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }],
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0501'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
     {
       challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123457',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         metadata: {
           public: 'public data',
           private: 'private data'
         },
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }],
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0502'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0505',
       _score: 0,
       _source:
     {
       challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0505',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123460',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         metadata: {
           public: 'public data',
           private: 'private data'
         },
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }],
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0505'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
     {
       challengeId: 'c3564180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123459',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         metadata: {
           public: 'public data',
           private: 'private data'
         },
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }],
       memberId: 'b24d4180-65aa-42ec-a945-5fd21dec0504'
     }
     }]

   }
}

const nonExReviewId = 'b24d4180-65aa-42ec-a945-5fd21dec0501'

const testReview = {
  Item: {
    id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
    score: 92,
    reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
    reviewedDate: '2021-02-02T11:39:38.685Z',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 123456789,
    status: 'queued',
    typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
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
    reviewedDate: '2021-02-02T11:39:38.685Z',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 123456789,
    status: 'queued',
    typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'admin',
    updatedBy: 'admin'
  }
}

const testReviewES = {
  hits:
   {
     total: 1,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source: {
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         status: 'queued',
         typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'admin',
         updatedBy: 'admin'
       }
     }]
   }
}

const testReviewsES = {
  hits:
   {
     total: 4,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0501',
       _score: 0,
       _source:
     {
       score: 95.5,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       status: 'queued',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 123456789,
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0501',
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0504',
       _score: 0,
       _source:
     {
       score: 65,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 123456789,
       status: 'queued',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0504',
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
     {
       score: 92,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 123456789,
       status: 'queued',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'd24d4180-65aa-42ec-a945-5fd21dec0503',
       _score: 0,
       _source:
     {
       score: 80.83,
       reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'admin',
       createdBy: 'admin',
       scoreCardId: 123456789,
       status: 'queued',
       created: '2018-05-20T07:00:30.123Z',
       typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
       id: 'd24d4180-65aa-42ec-a945-5fd21dec0503',
       updated: '2018-06-01T07:36:28.178Z'
     }
     }]
   }
}

const nonExReviewSummationId = 'b45e4180-65aa-42ec-a945-5fd21dec1504'

const testReviewSummation = {
  Item: {
    id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
    aggregateScore: 99,
    isPassing: true,
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    reviewedDate: '2021-02-02T11:39:38.685Z',
    scoreCardId: 123456789,
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
    reviewedDate: '2021-02-02T11:39:38.685Z',
    scoreCardId: 123456789,
    created: '2018-05-20T07:00:30.123Z',
    updated: '2018-06-01T07:36:28.178Z',
    createdBy: 'copilot',
    updatedBy: 'copilot'
  }
}

const testReviewSummationES = {
  hits:
   {
     total: 1,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
       _score: 0,
       _source: {
         id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
         aggregateScore: 99,
         isPassing: true,
         submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         scoreCardId: 123456789,
         created: '2018-05-20T07:00:30.123Z',
         updated: '2018-06-01T07:36:28.178Z',
         createdBy: 'copilot',
         updatedBy: 'copilot'
       }
     }]
   }
}

const testReviewSummationsES = {
  hits:
   {
     total: 4,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1503',
       _score: 0,
       _source:
     {
       aggregateScore: 46.3,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 123456789,
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1503',
       isPassing: false,
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1501',
       _score: 0,
       _source:
     {
       aggregateScore: 17.8,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 123456789,
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1501',
       isPassing: false,
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1502',
       _score: 0,
       _source:
     {
       aggregateScore: 84.5,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 123456789,
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1502',
       isPassing: true,
       updated: '2018-06-01T07:36:28.178Z'
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
       _score: 0,
       _source:
     {
       aggregateScore: 99,
       submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0504',
       updatedBy: 'copilot',
       createdBy: 'copilot',
       scoreCardId: 123456789,
       created: '2018-05-20T07:00:30.123Z',
       id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
       isPassing: true,
       updated: '2018-06-01T07:36:28.178Z'
     }
     }]

   }
}

const testChallengeAPIResponse = {
  id: '77eb9522-ea41-4334-974d-7604097d23e7',
  created: '2020-11-02T21:34:19Z',
  createdBy: 'tcwebservice',
  updated: '2020-12-28T06:44:27Z',
  updatedBy: 'AutoPilot',
  status: 'Active',
  projectId: 16661,
  name: 'TCO Leaderboard Test 3',
  typeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
  trackId: '9b6fc876-f4d9-4ccb-9dfd-419247628825',
  startDate: '2020-12-21T18:24:09Z',
  legacy: {
    reviewType: 'COMMUNITY',
    isTask: false,
    subTrack: 'CODE',
    directProjectId: 23741,
    track: 'DEVELOP',
    reviewScorecardId: 30001610,
    forumId: 0
  },
  descriptionFormat: 'HTML',
  timelineTemplateId: '7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c',
  terms: [
    {
      roleId: '732339e7-8e30-49d7-9198-cccf9451e221',
      id: 'b11da5cd-713f-478d-90f4-f679ef53ee95'
    },
    {
      roleId: '3eedd4a4-3c68-4f68-8de4-a1ca5c2055e5',
      id: '82a35602-57c2-4b48-a9b9-b4e133b22035'
    },
    {
      roleId: '318b9c07-079a-42d9-a81f-b96be1dc1099',
      id: '82a35602-57c2-4b48-a9b9-b4e133b22035'
    },
    {
      roleId: 'ff556573-5da6-4392-b38c-08c1d7599c4a',
      id: '82a35602-57c2-4b48-a9b9-b4e133b22035'
    },
    {
      roleId: 'e0544b94-6420-4afc-8f63-238eddc751b9',
      id: '82a35602-57c2-4b48-a9b9-b4e133b22035'
    },
    {
      roleId: '0e9c6879-39e4-4eb6-b8df-92407890faf1',
      id: '75d2f6bb-aadc-475e-9728-32c1dbd13655'
    },
    {
      roleId: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd',
      id: 'e0993b1a-abf7-45e6-8ed9-8cd0546be90b'
    },
    {
      roleId: 'd663fc84-5c37-43d1-a537-793feffb7667',
      id: '82a35602-57c2-4b48-a9b9-b4e133b22035'
    }
  ],
  phases: [
    {
      duration: 561600,
      scheduledEndDate: '2020-12-28T06:44:27Z',
      actualEndDate: '2020-12-28T06:44:27Z',
      isOpen: false,
      name: 'Registration',
      phaseId: 'a93544bc-c165-4af4-b55e-18f3593b457a',
      actualStartDate: '2020-12-21T18:24:09Z',
      id: 'f6166029-cdef-4b72-b7a4-f2d3074bafac',
      scheduledStartDate: '2020-12-21T18:24:09Z'
    },
    {
      duration: 561300,
      scheduledEndDate: '2020-12-28T06:44:28Z',
      actualEndDate: '2020-12-28T06:44:28Z',
      isOpen: true,
      name: 'Submission',
      phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
      actualStartDate: '2020-12-21T18:44:58Z',
      id: '90ddb27a-cc49-454c-8367-354011eeba73',
      scheduledStartDate: '2020-12-21T18:44:58Z'
    },
    {
      duration: 172800,
      scheduledEndDate: '2020-12-30T06:44:00Z',
      actualEndDate: '2020-12-28T06:51:27Z',
      isOpen: false,
      name: 'Review',
      phaseId: 'aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b',
      actualStartDate: '2020-12-28T06:51:27Z',
      id: '35a75a3f-c9ba-46ad-8003-f605c9bb4791',
      scheduledStartDate: '2020-12-28T06:44:28Z'
    },
    {
      duration: 86400,
      scheduledEndDate: '2020-12-31T06:44:00Z',
      actualEndDate: '2020-12-28T06:51:27Z',
      isOpen: false,
      name: 'Appeals',
      phaseId: '1c24cfb3-5b0a-4dbd-b6bd-4b0dff5349c6',
      actualStartDate: '2020-12-28T06:51:27Z',
      id: '3d16078a-2362-41fe-af82-01112b8f27c8',
      scheduledStartDate: '2020-12-30T06:44:00Z'
    },
    {
      duration: 43200,
      scheduledEndDate: '2020-12-31T18:44:00Z',
      actualEndDate: '2020-12-28T06:51:27Z',
      isOpen: false,
      name: 'Appeals Response',
      phaseId: '797a6af7-cd3f-4436-9fca-9679f773bee9',
      actualStartDate: '2020-12-28T06:51:27Z',
      id: '2359d4fd-aa1a-4403-98c5-a1f841b8062e',
      scheduledStartDate: '2020-12-31T06:44:00Z'
    },
    {
      duration: 86400,
      scheduledEndDate: '2020-12-29T06:48:00Z',
      actualEndDate: '2020-12-28T06:51:27Z',
      isOpen: true,
      name: 'Post-Mortem',
      phaseId: 'f308bdb4-d3da-43d8-942b-134dfbaf5c45',
      actualStartDate: '2020-12-28T06:48:44Z',
      id: '3a579100-e334-4b8f-ac89-7c8c696d42f0',
      scheduledStartDate: '2020-12-28T06:48:44Z'
    }
  ],
  discussions: [
    {
      provider: 'vanilla',
      name: 'TCO Leaderboard Test 3 Discussion',
      id: 'cfbb21e8-a67a-4a23-997c-04022894d958',
      type: 'challenge',
      url: 'https://vanilla.topcoder-dev.com/categories/77eb9522-ea41-4334-974d-7604097d23e7'
    }
  ],
  description: 'test',
  groups: [],
  endDate: '2020-12-29T06:48:00Z',
  numOfSubmissions: 0,
  numOfRegistrants: 0,
  currentPhaseNames: [
    'Post-Mortem'
  ],
  registrationStartDate: '2020-12-21T18:24:09Z',
  registrationEndDate: '2020-12-28T06:44:27Z',
  submissionStartDate: '2020-12-21T18:44:58Z',
  submissionEndDate: '2020-12-28T06:44:28Z',
  track: 'Development',
  type: 'Challenge',
  attachments: [],
  prizeSets: [
    {
      prizes: [
        {
          type: 'USD',
          value: 1
        }
      ],
      description: 'Challenge Prizes',
      type: 'placement'
    }
  ],
  tags: [
    'Automated Testing'
  ],
  legacyId: 30057477,
  metadata: [],
  events: [],
  task: {
    isAssigned: false,
    isTask: false,
    memberId: null
  },
  overview: {
    totalPrizes: 1
  }
}

module.exports = {
  nonExReviewTypeId,
  testReviewType,
  testReviewTypePatch,
  testReviewTypeES,
  testReviewTypesES,
  nonExSubmissionId,
  testSubmission,
  testSubmissionWoLegacy,
  testSubmissionPatch,
  testSubmissionES,
  testSubmissionsES,
  nonExReviewId,
  testReview,
  testReviewPatch,
  testReviewES,
  testReviewsES,
  nonExReviewSummationId,
  testReviewSummation,
  testReviewSummationPatch,
  testReviewSummationES,
  testReviewSummationsES,
  testChallengeAPIResponse,
  testResourceRoles,
  testChallengeResources
}
