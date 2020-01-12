/*
 * Review Type service test
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const _ = require('lodash')
const chai = require('chai')
const chaiHttp = require('chai-http')
const mocha = require('mocha')
const coMocha = require('co-mocha')
const should = chai.should() // eslint-disable-line
const app = require('../../app')
const {
  nonExReviewTypeId, testReviewType,
  testReviewTypePatch
} = require('../common/testData')
const { loadReviewTypes } = require('../../scripts/ESloadHelper')

coMocha(mocha)
chai.use(chaiHttp)

let reviewTypeId // Used to store reviewTypeId after creating review type

describe('ReviewType Service tests', () => {
  // Before hook to load ES
  before(function * () {
    this.timeout(25000)
    yield loadReviewTypes()
  })

  /*
   * Test the POST /reviewTypes route
   */
  describe('POST /reviewTypes', () => {
    it('Creating review type without body should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"name" is required')
          done()
        })
    })

    it('Creating review type without all fields should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewType.Item, ['name']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"isActive" is required')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Creating review type without token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewTypes`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Creating review type with user token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Creating review type with Admin token should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewType.Item))
          res.body.id.should.not.be.eql(null)
          reviewTypeId = res.body.id // To be used in future requests
          res.body.name.should.be.eql(testReviewType.Item.name)
          res.body.isActive.should.be.eql(testReviewType.Item.isActive)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /reviewTypes/:reviewTypeId route
   */
  describe('GET /reviewTypes/:reviewTypeId', () => {
    it('Getting invalid review type should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewTypeId" must be a valid GUID')
          done()
        })
    })

    it('Getting non-existing review type should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${nonExReviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} is not found`)
          done()
        })
    }).timeout(20000)

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting existing review type without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting existing review type with user token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${testReviewType.Item.id}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewType.Item))
          res.body.id.should.be.eql(testReviewType.Item.id)
          res.body.name.should.be.eql(testReviewType.Item.name)
          res.body.isActive.should.be.eql(testReviewType.Item.isActive)
          done()
        })
    }).timeout(20000)

    it('Getting existing review type with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${testReviewType.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewType.Item))
          res.body.id.should.be.eql(testReviewType.Item.id)
          res.body.name.should.be.eql(testReviewType.Item.name)
          res.body.isActive.should.be.eql(testReviewType.Item.isActive)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PUT /reviewTypes/:reviewTypeId route
   */
  describe('PUT /reviewTypes/:reviewTypeId', () => {
    it('Updating review type without body should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"name" is required')
          done()
        })
    })

    it('Updating review type without all fields should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewType.Item, ['name']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"isActive" is required')
          done()
        })
    })

    it('Updating invalid review type should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewTypeId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Updating review type without token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Updating review type with user token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Updating non-existent review type should throw 404', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${nonExReviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Updating review type with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewType.Item))
          res.body.id.should.not.be.eql(null)
          res.body.name.should.be.eql(testReviewType.Item.name)
          res.body.isActive.should.be.eql(testReviewType.Item.isActive)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PATCH /reviewTypes/:reviewTypeId route
   */
  describe('PATCH /reviewTypes/:reviewTypeId', () => {
    it('Patching invalid review type should throw 400', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewTypeId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Patching review type without token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Patching review type with user token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Patching non-existent review type should throw 404', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/${nonExReviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewType.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} is not found`)
          done()
        })
    }).timeout(20000)

    // Text field Patching
    it('Patching review type (Text field) with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewTypePatch.Item, ['name']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewTypePatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.name.should.be.eql(testReviewTypePatch.Item.name)
          res.body.isActive.should.be.eql(testReviewTypePatch.Item.isActive)
          done()
        })
    }).timeout(20000)
    // Boolean field Patching
    it('Patching review type (Boolean field) with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({ isActive: false })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewTypePatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.isActive.should.be.eql(false)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the DELETE /reviewTypes/:reviewTypeId route
   */
  describe('DELETE /reviewTypes/:reviewTypeId', () => {
    it('Deleting invalid review type should throw 400', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewTypes/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewTypeId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Deleting review type without token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting review type with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Deleting non-existent review type should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewTypes/${nonExReviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Deleting review type with Admin token should get succeeded', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewTypes/${reviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /reviewTypes route
   */
  describe('GET /reviewTypes', () => {
    it('Getting review types with invalid filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?test=abc`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"test" is not allowed')
          done()
        })
    })

    it('Getting review types with orderBy without sortBy filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?orderBy=asc`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"orderBy" missing required peer "sortBy"')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting review types without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting review types with user token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(6)
          done()
        })
    }).timeout(20000)

    it('Getting review types with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(6)
          done()
        })
    }).timeout(20000)

    it('Getting review types with filters and pagination parameters using Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?name=Review&page=2&perPage=1`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(1)
          done()
        })
    }).timeout(20000)
  })
})
