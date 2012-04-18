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
    chuck.reset();
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
      sut.log({ event: 'something' });
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
      sut.log({ event: 'something' });

      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, "[Thu, 01 Jan 1970 00:00:00 GMT testing]", { event: 'something' });
    });

    it('should print with console.error', function() {
      console.error.apply = null;
      var sut = chuck('testing');
      chuck.debug('testing');
      sut.log({ event: 'something' });

      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, "[Thu, 01 Jan 1970 00:00:00 GMT testing] {\"event\":\"something\"}");
    });

    it('should print stringified', function() {
      var sut = chuck('testing');
      chuck.debug('testing');
      chuck.stringify(true);
      sut.log({ event: 'something' });

      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, "[Thu, 01 Jan 1970 00:00:00 GMT testing] {\"event\":\"something\"}");
    });

    it('should print loggers matching: a', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('a');

      sut1.log({ event: 'something' });
      sut2.log({ event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print loggers matching: ^too$', function() {
      var sut1 = chuck('too');
      var sut2 = chuck('tooo');
      chuck.debug('tooo');

      sut1.log({ event: 'something' });
      sut2.log({ event: 'something' });

      sinon.assert.calledOnce(console.error);
    });

    it('should print loggers matching: a|b', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('a,b');

      sut1.log({ event: 'something' });
      sut2.log({ event: 'something' });

      sinon.assert.calledTwice(console.error);
    });

    it('should print loggers matching: c', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('c');

      sut1.log({ event: 'something' });
      sut2.log({ event: 'something' });

      sinon.assert.notCalled(console.error);
    });

    it('should turn off printing', function() {
      var sut1 = chuck('a');
      var sut2 = chuck('b');
      chuck.debug('a,b');
      chuck.debug(false);

      sut1.log({ event: 'something' });
      sut2.log({ event: 'something' });

      sinon.assert.notCalled(console.error);
    });

  });

  describe('#flush()', function(){

    it('should flush logs after timeout', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, '_internalFlush');

      sinon.assert.notCalled(spy);

      sut.log({ event: 'something' });

      sinon.assert.notCalled(spy);
      this.clock.tick(sut.timeout / 2);
      sinon.assert.notCalled(spy);

      this.clock.tick(sut.timeout / 2);

      sinon.assert.calledOnce(spy);
    });

    it('should continue flushing upon exception', function() {
      var sut = chuck('testing');
      var stub = sinon.stub(sut, '_internalFlush');
      stub.throws();
      var times = Math.round(Math.random(7) * 10) + 3;
      var timestamps = [];

      sinon.assert.notCalled(stub);

      for(var i = 1; i <= times; i++) {
        sut.log({ event: 'a' });
        sut.log({ event: 'b' });
        timestamps.push((new Date()).valueOf());
        this.clock.tick(sut.timeout);
        sinon.assert.callCount(stub, i);
      };

      assert.length(sut.queue(), times * 2);
    });

  });

  describe('#_internalFlush()', function(){

    it('should clear queue if flush succeeded', function() {
      var sut = chuck('testing');
      var stub = sinon.stub(sut, 'send');

      sinon.assert.notCalled(stub);

      sut.log({ event: 'something' });

      sinon.assert.notCalled(stub);

      sut._internalFlush();

      sinon.assert.calledWith(stub, [{
        log: { event: 'something' },
        ts: 0
      }]);

      assert.length(sut.queue(), 1);

      stub.callArg(1);

      assert.length(sut.queue(), 0);
    });

    it('should do nothing if queue is empty', function() {
      var sut = chuck('testing');
      var spy = sinon.spy(sut, 'send');

      sinon.assert.notCalled(spy);

      sut._internalFlush();

      sinon.assert.notCalled(spy);

      assert.length(sut.queue(), 0);
    });

    it('should not clear queue if flush failed', function() {
      var sut = chuck('testing');
      var stub = sinon.stub(sut, 'send');

      sinon.assert.notCalled(stub);

      sut.log({ event: 'something' });

      sinon.assert.notCalled(stub);

      sut._internalFlush();

      sinon.assert.calledWith(stub, [{
        log: { event: 'something' },
        ts: 0
      }]);

      assert.length(sut.queue(), 1);
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
                ts: 0,
                log: { event: '1' }
              },
              {
                ts: 0,
                log: { event: '2' }
              }
            ],
            type: 'testing'
          }),
          dataType: "json",
          type: "POST",
          url: "/chuck"
        }).once();
        var sut = chuck('testing', { jQuery: fakeQuery });

        sut.log({ event: '1' });
        sut.log({ event: '2' });

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

          sut.log({ event: '1' });
          sut.log({ event: '2' });

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
                ts: 0,
                log: { event: '1' }
              },
              {
                ts: 0,
                log: { event: '2' }
              }
            ],
            type: 'testing'
          }));

          this.sandbox.server.respondWith([200, {}, '']);
          this.sandbox.server.respond();

          assert.length(sut.queue(), 0, 'Should have 0 after server responds with 200');
        });

        it('should retain logs upon API failure', function() {
          var sut = chuck('testing');

          sut.log({ event: '1' });
          sut.log({ event: '2' });

          assert.length(sut.queue(), 2);

          this.clock.tick(sut.timeout);

          assert.length(sut.queue(), 2, 'Should have 2 while waiting for server to respond');

          this.sandbox.server.respondWith([500, {}, '']);
          this.sandbox.server.respond();

          assert.length(sut.queue(), 2, 'Should have 2 after server responds with 500');
        });

      });

    });

  }

});
