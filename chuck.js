(function(){var global = this;
/*!
 * debug
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  localStorage.debug = name;

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

// persist

if (window.localStorage) debug.enable(localStorage.debug);function require(p, parent){ var path = require.resolve(p) , mod = require.modules[path]; if (!mod) throw new Error('failed to require "' + p + '" from ' + parent); if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path), global); } return mod.exports;}require.modules = {};require.resolve = function(path){ var orig = path , reg = path + '.js' , index = path + '/index.js'; return require.modules[reg] && reg || require.modules[index] && index || orig;};require.register = function(path, fn){ require.modules[path] = fn;};require.relative = function(parent) { return function(p){ if ('debug' == p) return debug; if ('.' != p.charAt(0)) return require(p); var path = parent.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/'), parent); };};require.register("chuck.js", function(module, exports, require, global){
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

    Chuck.prototype.log = function(scope, properties) {
      this.enqueue(scope, properties);
      this.trigger();
    };

    Chuck.prototype.print = function() {
      if (typeof console === 'undefined') return;
      if (console.error && console.error.apply) {
        // console.error.apply is undefined in IE8 and IE9
        // and still useless for objects in IE9. But useful for non-IE browsers.
        return console.error.apply(console, arguments);
      }
      // for IE8/9: make console.error at least a bit less awful
      var args = Array.prototype.slice.call(arguments);
      args.forEach(function(element, index) {
        if(typeof element === 'string') {
          args[index] = element;
        } else {
          args[index] = JSON.stringify(element);
        }
      });
      console.error && console.error(args.join(' '));
    };

    Chuck.prototype.enqueue = function(scope, properties) {
      if(chucker.match(this.level)) {
        var fmt = '[' + new Date().toUTCString()
          + ' ' + this.level + '] (' + scope + ')';
        this.print(fmt, properties);
      }

      this.queue().push({
        scope: scope,
        properties: properties,
        ts: (new Date()).valueOf()
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

  var chucker = function(level, options) {
    return new Chuck(level, options);
  };

  chucker.debug = function(flag) {
    var flags = [];
    flag.split(',').forEach(function(part) {
      flags.push(part.trim());
    });
    this._debug = new RegExp('^(' + flags.join('|') + ')$');
  };

  chucker.match = function(scope) {
    return this._debug && this._debug.exec(scope);
  };

  return chucker;

}());

});chuck = require('chuck');
})();
