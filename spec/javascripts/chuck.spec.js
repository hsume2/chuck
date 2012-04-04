if(!chuck) { var chuck = require('../../index'); };
if(!sinon) { var sinon = require('sinon'); };
if(!chai) { var chai = require('chai'); };

var assert = chai.assert;

describe('Chuck', function(){

  beforeEach(function(){
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeServer();
    this.sandbox.useFakeTimers();
    this.clock = this.sandbox.clock;
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#log()', function(){

    it('should log event', function() {
      var sut = chuck('testing');
      sut.log('voice', { event: 'something' });
    });

  });

  describe('#flush()', function(){

    it('should flush logs after timeout', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');

      sinon.assert.notCalled(spy);

      sut.log('voice', { event: 'something' });

      sinon.assert.notCalled(spy);

      this.clock.tick(510);

      sinon.assert.calledWith(spy, [{
        scope: 'voice',
        properties: {
          event: 'something'
        }
      }]);
    });

    it('should flush logs only if needed', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');
      var times = Math.round(Math.random(7) * 10) + 3;

      sinon.assert.notCalled(spy);

      sut.log('voice', { event: 'something' });

      sinon.assert.notCalled(spy);

      for(var i = 1; i <= times; i++) {
        this.clock.tick(501);
        sinon.assert.calledOnce(spy);
      };

      sinon.assert.calledWith(spy, [{
        scope: 'voice',
        properties: {
          event: 'something'
        }
      }]);
    });

    it('should flush logs once per interval', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');
      var times = Math.round(Math.random(7) * 10) + 3;

      sinon.assert.notCalled(spy);

      for(var i = 1; i <= times; i++) {
        sut.log('voice', { event: 'something' });
        this.clock.tick(501);
        sinon.assert.callCount(spy, i);
      };

      sinon.assert.calledWith(spy, [
        {
          scope: 'voice',
          properties: {
            event: 'something'
          }
        }
      ]);
    });

  });

  if(typeof window !== 'undefined') {

    describe('#send()', function(){

      it('should POST to API end-point', function() {
        var sut = chuck('testing');

        sut.log('a', { event: '1' });
        sut.log('b', { event: '2' });

        this.clock.tick(501);

        assert.length(this.sandbox.server.requests, 1);

        var request = this.sandbox.server.requests[0];

        assert.equal(request.url, '/chuck');
        assert.equal(request.method, 'POST');
        assert.equal(request.async, true);

        assert.equal(request.requestHeaders['Content-Type'], 'application/json;charset=utf-8');
        assert.equal(request.requestHeaders['Accept'], '*/*');
        assert.equal(request.requestHeaders['X-Requested-With'], 'XMLHttpRequest');

        assert.equal(request.requestBody, JSON.stringify([
          {
            scope: 'a',
            properties: {
              event: '1'
            }
          },
          {
            scope: 'b',
            properties: {
              event: '2'
            }
          }
        ]));
      });

    });

  }

});
