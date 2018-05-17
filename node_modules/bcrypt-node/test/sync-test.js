var inspect = require('eyespect').inspector()
var should = require('should')
var assert = require('assert')
var bCrypt = require("../bCrypt")
describe('Test Sync', function () {
  this.timeout('100s')
  this.slow('50s')

  var salt1, salt2
  var secret = "super secret"
  var hash1, hash2, hash3, hash4, hash5, hash6, hash7, hash8, hash9, hash0, invalidHash

  var pw1, pw2, pw3, pw4, hash_pw1, hash_pw2, hash_pw3, hash_pw4
  before(function () {
    inspect('generating hashes, this will take a while')
    salt1 = bCrypt.genSaltSync(8)
    should.exist(salt1, 'genSaltSync failed')
    salt2 = bCrypt.genSaltSync(10)
    should.exist(salt2, 'genSaltSync failed')

    hash1 = bCrypt.hashSync('super secret', salt1, null)
    hash2 = bCrypt.hashSync('super secret', salt1, null)
    hash3 = bCrypt.hashSync('supersecret', salt1, null)
    hash4 = bCrypt.hashSync('supersecret', salt1, null)
    hash5 = bCrypt.hashSync('super secret', salt2, null)
    hash6 = bCrypt.hashSync('super secret', salt2, null)
    hash7 = bCrypt.hashSync('supersecret', salt2, null)
    hash8 = bCrypt.hashSync('supersecret', salt2, null)
    hash9 = bCrypt.hashSync('super secret', null, null)
    hash0 = bCrypt.hashSync('super secret', null, null)

    invalidHash = 'some invalid hash that does not equal sixty bytes in length'

    pw1 = '\u6e2f'  // http://www.fileformat.info/info/unicode/char/6e2f/index.htm
    pw2 = '港' // Character 0x6e2f same as pw1.
    pw3 = '\u6f2f'  // http://www.fileformat.info/info/unicode/char/6f2f/index.htm
    pw4 = '漯' // Character 0x6f2f same as pw3.

    var salt = '$2a$05$0000000000000000000000'
    hash_pw1 = bCrypt.hashSync(pw1, salt, null)
    hash_pw2 = bCrypt.hashSync(pw2, salt, null)
    hash_pw3 = bCrypt.hashSync(pw3, salt, null)
    hash_pw4 = bCrypt.hashSync(pw4, salt, null)
  })

  it('should match first set of compares', function () {

    assert.ok(bCrypt.compareSync('super secret', hash1), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('super secret', hash2), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('super secret', hash3), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('super secret', hash4), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('super secret', hash5), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('super secret', hash6), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('super secret', hash7), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('super secret', hash8), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('super secret', hash9), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('super secret', hash0), 'compareSync should return true')
  })

  it('should match second set of compares', function () {
    assert.ok(!bCrypt.compareSync('supersecret', hash1), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('supersecret', hash2), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('supersecret', hash3), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('supersecret', hash4), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('supersecret', hash5), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('supersecret', hash6), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('supersecret', hash7), 'compareSync should return true')
    assert.ok(bCrypt.compareSync('supersecret', hash8), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('supersecret', hash9), 'compareSync should return true')
    assert.ok(!bCrypt.compareSync('supersecret', hash0), 'compareSync should return true')
  })

  it('hash_pw2 should compare correctly to pw1', function () {
    assert.ok(bCrypt.compareSync(pw1, hash_pw1), 'compareSync should return true')
  })
  it('hash_pw2 should compare correctly to pw2', function () {
    assert.ok(bCrypt.compareSync(pw2, hash_pw2), 'compareSync should return true')
  })
  it('hash_pw3 should compare correctly to pw3', function () {
    assert.ok(bCrypt.compareSync(pw3, hash_pw3), 'compareSync should return true')
  })
  it('hash_pw4 should compare correctly to pw4', function () {
    assert.ok(bCrypt.compareSync(pw4, hash_pw4), 'compareSync should return true')
  })


  it('hash_pw1 should be different than hash_pw3', function () {
    hash_pw1.should.not.eql(hash_pw3, 'hash_pw1 should be different from hash_pw3')
  })

  it('hash_pw2 should be different than hash_pw4', function () {
    hash_pw2.should.not.eql(hash_pw4, 'hash_pw2 should be different from hash_pw4')
  })
  it('hash_pw1 should be equal hash_pw2', function () {
    hash_pw1.should.eql(hash_pw2, 'hash_pw1 should equal hash_pw2')
  })
  it('hash_pw3 should be equal hash_pw4', function () {
    hash_pw3.should.eql(hash_pw3, 'hash_pw3 should equal hash_pw4')
  })
  it('invalid hash should return false and not throw', function() {
      bCrypt.compareSync('supersecret', invalidHash).should.be.false
  })
})
