module.exports = (function() {

  var Chuck = (function() {

    function Chuck(level, options) {
      this.level = level;
      options = options || {};
      this.timeout = options.timeout || 5000;
      if(typeof window !== 'undefined') {
        this.adapter = new Chuck.Adapter.Browser(options);
      } else {
        this.adapter = new Chuck.Adapter.Node();
      }
    }

    Chuck.prototype.log = function(properties) {
      this.enqueue(properties);
      this.trigger();
    };

    Chuck.prototype.print = function() {
      if (typeof console === 'undefined') return;
      var args = Array.prototype.slice.call(arguments);
      if (console.error && console.error.apply && !chucker._stringify) {
        // console.error.apply is undefined in IE8 and IE9
        // and still useless for objects in IE9. But useful for non-IE browsers.
        return console.error.apply(console, args);
      }
      // for IE8/9: make console.error at least a bit less awful
      args.forEach(function(element, index) {
        if(typeof element === 'string') {
          args[index] = element;
        } else {
          args[index] = JSON.stringify(element);
        }
      });
      console.error && console.error(args.join(' '));
    };

    Chuck.prototype.enqueue = function(properties) {
      if(chucker.match(this.level)) {
        var fmt = '[' + new Date().toUTCString()
          + ' ' + this.level + ']';
        this.print(fmt, properties);
      }

      var message = {
        ts: (new Date()).valueOf(),
        log: properties
      };

      this.queue().push(message);
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
        self._internalFlush();
      }, this.timeout);
    };

    Chuck.prototype._internalFlush = function() {
      var q = this.queue();
      if(q.length > 0) {
        this.send(q);
      } else {
        this.flush();
      }
    };

    Chuck.prototype.trigger = function() {
      if(this.isRunning) { return; }

      this.flush();

      this.isRunning = true;
    };

    Chuck.prototype.send = function(events) {
      if(this.adapter) {
        this.adapter.send(this, events);
      }
    };

    return Chuck;

  }());

  Chuck.Adapter = {};

  Chuck.Adapter.Node = (function() {

    function Node(options) {
    }

    Node.prototype.send = function(chuck, events) {
    };

    return Node;

  }());

  Chuck.Adapter.Browser = (function() {

    function Browser(options) {
      options = options || {};
      this.jQuery = options.jQuery || window.jQuery;
    }

    Browser.prototype.send = function(chuck, events) {
      this.jQuery.ajax({
        url: '/chuck',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ payload: events, type: chuck.level }),
        dataType: 'json'
      }).done(function() {
        chuck.clearQueue();
      }).always(function() {
        chuck.flush();
      });
    };

    return Browser;

  }());

  var chucker = function(level, options) {
    return new Chuck(level, options);
  };

  chucker.debug = function(flag, options) {
    options = options || {};
    if(!flag) {
      this._debug = false;
      return;
    }
    var flags = [];
    flag.split(',').forEach(function(part) {
      flags.push(part.trim());
    });
    this._debug = new RegExp('^(' + flags.join('|') + ')$');
  };

  chucker.stringify = function(flag) {
    this._stringify = !!flag;
  };

  chucker.reset = function() {
    this.debug(false);
    this.stringify(false);
  };

  chucker.match = function(level) {
    return this._debug && this._debug.exec(level);
  };

  return chucker;

}());
