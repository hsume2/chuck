module.exports = (function() {

  var Chuck = (function() {

    function Chuck(level, options) {
      this.level = level;
      this.timeout = 5000;
      if(typeof window !== 'undefined') {
        this.adapter = new Chuck.Adapter.Browser(options);
      } else {
        this.adapter = new Chuck.Adapter.Node();
      }
    }

    Chuck.prototype.log = function(scope, properties) {
      this.enqueue(scope, properties);
      this.trigger();
    };

    Chuck.prototype.enqueue = function(scope, properties) {
      this.queue().push({
        scope: scope,
        properties: properties
      });
    };

    Chuck.prototype.queue = function() {
      if(!this._queue) {
        this._queue = [];
      }
      return this._queue;
    };

    Chuck.prototype.clearQueue = function() {
      if(this._queue) {
        this._queue = [];
      }
    };

    Chuck.prototype.flush = function() {
      var self = this;
      setTimeout(function() {
        var q = self.queue();
        if(q.length > 0) {
          self.send(q);
          self.clearQueue();
        }
        self.flush();
      }, this.timeout);
    };

    Chuck.prototype.trigger = function() {
      if(this.isRunning) { return; }

      this.flush();

      this.isRunning = true;
    };

    Chuck.prototype.send = function(event) {
      if(this.adapter) {
        this.adapter.send(event);
      }
    };

    return Chuck;

  }());

  Chuck.Adapter = {};

  Chuck.Adapter.Node = (function() {

    function Node(options) {
    }

    Node.prototype.send = function(event) {
    };

    return Node;

  }());

  Chuck.Adapter.Browser = (function() {

    function Browser(options) {
      options = options || {};
      this.jQuery = options.jQuery || window.jQuery;
    }

    Browser.prototype.send = function(event) {
      this.jQuery.ajax({
        url: '/chuck',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ payload: event }),
        dataType: 'json'
      });
    };

    return Browser;

  }());

  return function(level, options) {
    return new Chuck(level, options);
  };

}());
