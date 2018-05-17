var async = require('async')
var inspect = require('eyespect').inspector()
var should = require('should')
var assert = require('assert')
var bCrypt = require("../bCrypt")

var compares = 0;
var salts = [];
var hashes = [];

describe('Test Async', function () {
  this.timeout('16s')
  this.slow('8s')
  var bacon = 'bacon'
  var veggies = 'veggies'
  var soyBaconHash = 'some invalid hash that does not equal sixty bytes in length'

  var salt1, salt2, baconHash1, baconHash2, veggiesHash1, veggiesHash2
  before(function (done) {
    async.parallel([
      function genSalt1(cb) {
        bCrypt.genSalt(8, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          salt1 = reply
          cb()
        })
      },
      function genSalt2(cb) {
        bCrypt.genSalt(10, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          salt2 = reply
          cb()
        })
      },

      function hashBacon1(cb) {
        bCrypt.hash(bacon, salt1, null, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          baconHash1 = reply
          cb()
        })
      },
      function hashBacon2(cb) {
        bCrypt.hash(bacon, salt2, null, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          baconHash2 = reply
          cb()
        })
      },

      function hashVeggies1(cb) {
        bCrypt.hash(veggies, salt1, null, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          veggiesHash1 = reply
          cb()
        })
      },


      function hashVeggies2(cb) {
        bCrypt.hash(veggies, salt2, null, function (err, reply) {
          if (err) { return cb(err) }
          should.exist(reply)
          veggiesHash2 = reply
          cb()
        })
      }
    ], function (errs) {
      should.not.exist(errs, 'no errors should occur when generating salts')
      should.exist(salt1, 'salt1 not set')
      should.exist(salt2, 'salt2 not set')
      done()
    })
  })

  it('baconHash1 valid compare should match', function (done) {
    bCrypt.compare(bacon, baconHash1, function (err, matches) {
      should.not.exist(err)
      assert.ok(matches, 'compare should return true')
      done()
    })
  })

  it('baconHash2 valid compare should match', function (done) {
    bCrypt.compare(bacon, baconHash2, function (err, matches) {
      should.not.exist(err)
      assert.ok(matches, 'compare should return true')
      done()
    })
  })

  it('veggiesHash1 valid compare should match', function (done) {
    bCrypt.compare(veggies, veggiesHash1, function (err, matches) {
      should.not.exist(err)
      assert.ok(matches, 'compare should return true')
      done()
    })
  })

  it('veggiesHash2 valid compare should match', function (done) {
    bCrypt.compare(veggies, veggiesHash2, function (err, matches) {
      should.not.exist(err)
      assert.ok(matches, 'compare should return true')
      done()
    })
  })


  it('bacon should not match veggiesHash1', function (done) {
    bCrypt.compare(bacon, veggiesHash1, function (err, matches) {
      should.not.exist(err)
      assert.ok(!matches, 'compare should return false')
      done()
    })
  })
  it('bacon should not match veggiesHash2', function (done) {
    bCrypt.compare(bacon, veggiesHash2, function (err, matches) {
      should.not.exist(err)
      assert.ok(!matches, 'compare should return false')
      done()
    })
  })



  it('veggies should not match baconHash1', function (done) {
    bCrypt.compare(veggies, baconHash1, function (err, matches) {
      should.not.exist(err)
      assert.ok(!matches, 'compare should return false')
      done()
    })
  })
  it('veggies should not match baconHash2', function (done) {
    bCrypt.compare(veggies, baconHash2, function (err, matches) {
      should.not.exist(err)
      assert.ok(!matches, 'compare should return false')
      done()
    })
  })
  it('soyBaconHash is just wrong and should return false and not throw', function(done) {
    bCrypt.compare(veggies, soyBaconHash, function (err, matches) {
      should.not.exist(err)
      assert.ok(!matches, 'compare should return false')
      done()
    })
  })

})
