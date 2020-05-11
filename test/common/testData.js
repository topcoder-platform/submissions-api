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

const testSubmissionUrl = 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123456'

const testSubmission = {
  Item: {
    challengeId: 30055732,
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    type: 'ContestSubmission',
    url: 'https://s3.amazonaws.com/test-submission/123456',
    memberId: 40493050,
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
    challengeId: 30054692,
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
    type: 'ContestSubmission',
    url: 'https://s3.amazonaws.com/test-submission/123456',
    memberId: 40493050,
    legacySubmissionId: 301232,
    legacyUploadId: 483342,
    submissionPhaseId: 12876,
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionWReview = {
  Item: {
    challengeId: 30055733,
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
    type: 'ContestSubmission',
    url: 'https://s3.amazonaws.com/test-submission/123456',
    memberId: 40493050,
    legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    submissionPhaseId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
    review: [
      {
        id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
        score: 95.5,
        legacyReviewId: 1234567891,
        typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0503',
        reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
        scoreCardId: 123456789,
        submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
        metadata: {
          public: 'public data',
          private: 'private data'
        },
        created: '2018-05-20T07:00:30.123Z',
        updated: '2018-06-01T07:36:28.178Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      }
    ],
    reviewSummation: [
      {
        id: 'e45e4180-65aa-42ec-a945-5fd21dec1504',
        submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0503',
        aggregateScore: 99.0,
        scoreCardId: 123456789,
        isPassing: true,
        created: '2018-05-20T07:00:30.123Z',
        pdated: '2018-06-01T07:36:28.178Z',
        createdBy: 'copilot',
        updatedBy: 'copilot'
      }
    ],
    created: '2018-05-20T07:00:30.123Z',
    createdBy: 'topcoder user',
    updated: '2018-06-01T07:36:28.178Z',
    updatedBy: 'topcoder user'
  }
}

const testSubmissionPatch = {
  Item: {
    challengeId: 30055732,
    id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    type: 'TestChange',
    url: 'https://s3.amazonaws.com/test-submission/123456',
    memberId: 40493050,
    legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0502',
    submissionPhaseId: 'b24d4180-65aa-42ec-a945-5fd21dec0502',
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
         challengeId: 30055732,
         id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
         type: 'ContestSubmission',
         url: 'https://s3.amazonaws.com/test-submission/123456',
         memberId: 40493050,
         legacySubmissionId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
         submissionPhaseId: 'b24d4180-65aa-42ec-a945-5fd21dec0501',
         created: '2018-05-20T07:00:30.123Z',
         createdBy: 'topcoder user',
         updated: '2018-06-01T07:36:28.178Z',
         updatedBy: 'topcoder user'
       }
     }]
   }
}

const testSubmissionWoLegacyES = {
  hits:
   {
     total: 1,
     max_score: 0,
     hits: [{
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source: {
         challengeId: 30054692,
         id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
         type: 'ContestSubmission',
         url: 'https://s3.amazonaws.com/test-submission/123456',
         memberId: 40493050,
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
       url: 'https://s3.amazonaws.com/test-submission/123456',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         legacyReviewId: 1234567891,
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
       challengeId: '30054692',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://s3.amazonaws.com/test-submission/123456',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         legacyReviewId: 1234567891,
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
       memberId: 40493050
     }
     },
     {
       _index: 'submission',
       _type: '_doc',
       _id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       _score: 0,
       _source:
     {
       challengeId: '30054692',
       updatedBy: 'topcoder user',
       createdBy: 'topcoder user',
       created: '2018-05-20T07:00:30.123Z',
       id: 'a12a4180-65aa-42ec-a945-5fd21dec0502',
       type: 'ContestSubmission',
       updated: '2018-06-01T07:36:28.178Z',
       url: 'https://s3.amazonaws.com/test-submission/123457',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         legacyReviewId: 1234567891,
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
       url: 'https://s3.amazonaws.com/test-submission/123460',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         legacyReviewId: 1234567891,
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
       url: 'https://s3.amazonaws.com/test-submission/123459',
       review: [{
         id: 'd24d4180-65aa-42ec-a945-5fd21dec0502',
         score: 92,
         legacyReviewId: 1234567891,
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
    legacyReviewId: 1234567892,
    reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 123456789,
    status: 'completed',
    typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
    metadata: {
      public: 'public data',
      private: 'private data'
    },
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
    legacyReviewId: 1234567891,
    reviewerId: 'c23a4180-65aa-42ec-a945-5fd21dec0503',
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 123456789,
    status: 'queued',
    typeId: 'c56a4180-65aa-42ec-a945-5fd21dec0501',
    metadata: {
      public: 'public data',
      private: 'private data'
    },
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
         legacyReviewId: 1234567893,
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
       legacyReviewId: 1234567891,
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
       legacyReviewId: 1234567892,
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
       legacyReviewId: 1234567893,
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
       legacyReviewId: 1234567894,
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
    isFinal: true,
    submissionId: 'a12a4180-65aa-42ec-a945-5fd21dec0501',
    scoreCardId: 123456789,
    metadata: {
      public: 'public data',
      private: 'private data'
    },
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
  id: '24a97f2f:1655fef5034:-7568',
  result: {
    success: true,
    status: 200,
    metadata: {
      fields: null,
      totalCount: 5
    },
    content: [
      {
        challengeId: 30049360,
        id: 733195,
        phaseType: 'Registration',
        phaseStatus: 'Open',
        scheduledStartTime: '1438002000000',
        scheduledEndTime: '2019-12-02T09:00:00Z',
        actualStartTime: '1438002000000',
        actualEndTime: null,
        fixedStartTime: '1438002000000',
        duration: 137293200000,
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      },
      {
        challengeId: 30049360,
        id: 733196,
        phaseType: 'Submission',
        phaseStatus: 'Open',
        scheduledStartTime: '1438002300000',
        scheduledEndTime: '2019-12-02T09:00:00Z',
        actualStartTime: null,
        actualEndTime: null,
        fixedStartTime: null,
        duration: 137292900000,
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      },
      {
        challengeId: 30049360,
        id: 733197,
        phaseType: 'Review',
        phaseStatus: 'Scheduled',
        scheduledStartTime: '1575295200000',
        scheduledEndTime: '2019-12-04T09:00:00Z',
        actualStartTime: null,
        actualEndTime: null,
        fixedStartTime: null,
        duration: 172800000,
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      },
      {
        challengeId: 30049360,
        id: 733198,
        phaseType: 'Appeals',
        phaseStatus: 'Scheduled',
        scheduledStartTime: '1575468000000',
        scheduledEndTime: '2019-12-05T09:00:00Z',
        actualStartTime: null,
        actualEndTime: null,
        fixedStartTime: null,
        duration: 86400000,
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      },
      {
        challengeId: 30049360,
        id: 733199,
        phaseType: 'Appeals Response',
        phaseStatus: 'Scheduled',
        scheduledStartTime: '1575554400000',
        scheduledEndTime: '2019-12-05T09:00:00Z',
        actualStartTime: null,
        actualEndTime: null,
        fixedStartTime: null,
        duration: 43200000,
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      }
    ]
  },
  version: 'v4'
}

const testChallengeDetailResponse = {
  id: '3cf68cb8:16f21aba872:-62ff',
  result: {
    success: true,
    status: 200,
    metadata: {
      totalCount: 1,
      allChallengesCount: 1,
      myChallengesCount: 0,
      openChallengesCount: 1,
      ongoingChallengesCount: 0
    },
    content: [
      {
        challengeId: 30049360,
        id: 733195,
        currentPhases: [
          {
            id: '786331a5-4852-4e05-97ee-9c3d96c307b0',
            phaseType: 'Appeals Response',
            phaseStatus: 'Closed',
            scheduledStartTime: '2019-10-01T00:19:57.311Z',
            scheduledEndTime: '2020-11-11T00:19:00.000Z',
            actualStartTime: '2019-10-01T00:19:57.311Z',
            duration: 35164800000
          }
        ],
        allPhases: [
          {
            id: 733196,
            phaseType: 'Appeals Response',
            phaseStatus: 'Closed',
            scheduledStartTime: '2019-10-01T00:19:57.311Z',
            scheduledEndTime: '2020-11-11T00:19:00.000Z',
            actualStartTime: '2019-10-01T00:19:57.311Z',
            duration: 35164800000
          }
        ],
        prizes: [ 200 ],
        isTask: false,
        isRegistered: false,
        submissionViewable: true,
        subTrack: 'DEVELOP_MARATHON_MATCH',
        registrationStartDate: '2019-03-19T19:45:55.563Z',
        registrationEndDate: '2020-03-30T19:45:00.000Z',
        submissionEndDate: '2020-04-01T21:39:00.000Z',
        totalPrize: 200,
        isPrivate: false,
        projectId: 9616,
        projectName: 'Tony App 4',
        forumId: 602597,
        numSubmissions: 1,
        numRegistrants: 13,
        numSubmitters: 1,
        reviewType: 'INTERNAL',
        name: 'test forum develop',
        track: 'DEVELOP',
        status: 'ACTIVE',
        updatedAt: '2018-07-30T08:38Z',
        createdAt: '2015-07-27T09:19Z',
        createdBy: '11823846',
        updatedBy: '8547899'
      }
    ]
  },
  version: 'v4'
}

module.exports = {
  nonExReviewTypeId,
  testSubmissionUrl,
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
  testChallengeDetailResponse,
  testSubmissionWoLegacyES,
  testSubmissionWReview
}
