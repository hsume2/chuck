(function(){var global = this;function debug(){return debug};function require(p, parent){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '" from ' + parent); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path), global); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('debug' == p) return debug; if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/'), parent); };};require.register("chuck.js", function(module, exports, require, global){
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
        this.adapter.send(this.level, event);
      }
    };

    return Chuck;

  }());

  Chuck.Adapter = {};

  Chuck.Adapter.Node = (function() {

    function Node(options) {
    }

    Node.prototype.send = function(level, event) {
    };

    return Node;

  }());

  Chuck.Adapter.Browser = (function() {

    function Browser(options) {
      options = options || {};
      this.jQuery = options.jQuery || window.jQuery;
    }

    Browser.prototype.send = function(level, event) {
      this.jQuery.ajax({
        url: '/chuck/' + level,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ payload: event }),
        dataType: 'json'
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

});chuck = require('chuck');
})();
