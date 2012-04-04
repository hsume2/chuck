if (!chai) {
  var chai = require('chai');
}

var sinon = require("sinon");
var expect = chai.expect;

describe('Chuck', function(){
  var chuck = require('../../index');

  beforeEach(function(done){
    done();
  });

  describe('#log()', function(){
    it('should log event', function() {
      chuck.log('voice', { event: 'something' });
    });
  });

  describe('#flush()', function(){
    var mySpy = sinon.spy(chuck, 'send');

    it('should flush logs after timeout', function(done) {
      chuck.log('voice', { event: 'something' });

      sinon.assert.notCalled(mySpy);

      setTimeout(function() {
        sinon.assert.calledWith(mySpy, {
          scope: 'voice',
          properties: {
            event: 'something'
          }
        });
        done();
      }, 500);
    });

    it('should flush logs multiple times over timeout', function(done) {
      done();
    });
  });
});
