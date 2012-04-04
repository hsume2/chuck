module.exports = (function() {

  var Chuck = (function() {

    function Chuck(level) {
      this.level = level;
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
      }, 500);
    };

    Chuck.prototype.trigger = function() {
      if(this.isRunning) { return; }

      this.flush();

      this.isRunning = true;
    };

    Chuck.prototype.send = function(event) {
      if(typeof window !== 'undefined') {
        $.ajax({
          type: 'POST',
          url: '/chuck',
          contentType: 'application/json',
          data: JSON.stringify(event)
        });
      }
    };

    return Chuck;

  }());

  return function(level) {
    return new Chuck(level);
  };

}());
