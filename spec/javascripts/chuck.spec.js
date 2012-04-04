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

  describe('#timeout', function(){

    it('should have timeout', function() {
      var sut = chuck('testing');
      assert.equal(sut.timeout, 5000);
    });

    it('should have custom timeout', function() {
      var sut = chuck('testing', { timeout: 2400 });
      assert.equal(sut.timeout, 2400);
    });

  });

  describe('#log()', function(){

    it('should log event', function() {
      var sut = chuck('testing');
      sut.log('voice', { event: 'something' });
    });

  });

  describe('.debug()', function(){

    beforeEach(function() {
      sinon.spy(console, 'error');
    });

    afterEach(function() {
      console.error.restore();
    });

    it('should print with console.error.apply', function() {
      var sut = chuck('testing');
      chuck.debug('testing');
      sut.log('voice', { event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print with console.error', function() {
      console.error.apply = null;
      var sut = chuck('testing');
      chuck.debug('testing');
      sut.log('voice', { event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print loggers matching: a', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('a');

      sut1.log('voice', { event: 'something' });
      sut2.log('voice', { event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print loggers matching: ^too$', function() {
      var sut1 = chuck('too');
      var sut2 = chuck('tooo');
      chuck.debug('tooo');

      sut1.log('voice', { event: 'something' });
      sut2.log('voice', { event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print loggers matching: a|b', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('a,b');

      sut1.log('voice', { event: 'something' });
      sut2.log('voice', { event: 'something' });

      sinon.assert.calledTwice(console.error);
    });

    it('should print loggers matching: c', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('c');

      sut1.log('voice', { event: 'something' });
      sut2.log('voice', { event: 'something' });

      sinon.assert.notCalled(console.error);
    });

  });

  describe('#flush()', function(){

    it('should flush logs after timeout', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');

      sinon.assert.notCalled(spy);

      sut.log('voice', { event: 'something' });

      sinon.assert.notCalled(spy);
      this.clock.tick(sut.timeout / 2);
      sinon.assert.notCalled(spy);

      this.clock.tick(sut.timeout / 2);

      sinon.assert.calledWith(spy, [{
        scope: 'voice',
        properties: {
          event: 'something'
        },
        ts: 0
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
        this.clock.tick(sut.timeout);
        sinon.assert.calledOnce(spy);
      };

      sinon.assert.calledWith(spy, [{
        scope: 'voice',
        properties: {
          event: 'something'
        },
        ts: 0
      }]);
    });

    it('should flush logs once per interval', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');
      var times = Math.round(Math.random(7) * 10) + 3;
      var timestamps = [];

      sinon.assert.notCalled(spy);

      for(var i = 1; i <= times; i++) {
        sut.log('voice', { event: 'something' });
        sut.log('voice', { event: 'something' });
        timestamps.push((new Date()).valueOf());
        this.clock.tick(sut.timeout);
        sinon.assert.callCount(spy, i);
      };

      timestamps.forEach(function(ts) {
        sinon.assert.calledWith(spy, [
          {
            scope: 'voice',
            properties: {
              event: 'something'
            },
            ts: ts
          },
          {
            scope: 'voice',
            properties: {
              event: 'something'
            },
            ts: ts
          }
        ]);
      });
    });

  });

  if(typeof window === 'undefined') {

    describe('Node', function() {

      describe('#adapter', function(){

        it('should have adapter', function() {
          var sut = chuck('testing');
          assert.isObject(sut.adapter);
        });

      });

    });

  }

  describe('Browser', function() {

    describe('#adapter', function(){

      it('should create chuck with browser adapter', function() {
        if(typeof window === 'undefined') {
          window = sinon.stub();
          window.isStub = true;
        }

        var fakeQuery = sinon.stub();
        var sut = chuck('testing', { jQuery: fakeQuery });
        assert.equal(sut.adapter.jQuery, fakeQuery);

        if(typeof window !== 'undefined' && window.isStub) {
          delete window;
        }
      });

    });

    describe('#send()', function(){

      it('should POST to API end-point', function() {
        if(typeof window === 'undefined') {
          window = sinon.stub();
          window.isStub = true;
        }

        var fakeQuery = { ajax: function() {} };
        var expectation = sinon.mock(fakeQuery).expects('ajax').withArgs({
          contentType: "application/json",
          data: JSON.stringify({
            payload: [
            {
              scope: 'a',
              properties: {
                event: '1'
              },
              ts: 0
            },
            {
              scope: 'b',
              properties: {
                event: '2'
              },
              ts: 0
            }
            ]
          }),
          dataType: "json",
          type: "POST",
          url: "/chuck"
        }).once();
        var sut = chuck('testing', { jQuery: fakeQuery });

        sut.log('a', { event: '1' });
        sut.log('b', { event: '2' });

        this.clock.tick(sut.timeout);

        expectation.verify();

        if(typeof window !== 'undefined' && window.isStub) {
          delete window;
        }
      });

    });

  });

  if(typeof window !== 'undefined') {

    describe('Live Browser', function() {

      describe('#adapter', function(){

        it('should have adapter with window.jQuery', function() {
          var sut = chuck('testing');
          assert.isObject(sut.adapter);
          assert.equal(sut.adapter.jQuery, jQuery);
        });

      });

      describe('#send()', function(){

        it('should POST to API end-point', function() {
          var sut = chuck('testing');

          sut.log('a', { event: '1' });
          sut.log('b', { event: '2' });

          this.clock.tick(sut.timeout);

          assert.length(this.sandbox.server.requests, 1);

          var request = this.sandbox.server.requests[0];

          assert.equal(request.url, '/chuck');
          assert.equal(request.method, 'POST');
          assert.equal(request.async, true);

          assert.equal(request.requestHeaders['Content-Type'], 'application/json;charset=utf-8');
          assert.equal(request.requestHeaders['Accept'], 'application/json, text/javascript, */*; q=0.01');
          assert.equal(request.requestHeaders['X-Requested-With'], 'XMLHttpRequest');

          assert.equal(request.requestBody, JSON.stringify({
            payload: [
              {
                scope: 'a',
                properties: {
                  event: '1'
                },
                ts: 0
              },
              {
                scope: 'b',
                properties: {
                  event: '2'
                },
                ts: 0
              }
            ]
          }));
        });

      });

    });

  }

});
