/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/electron-squirrel-startup/index.js"
/*!*********************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/index.js ***!
  \*********************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

var path = __webpack_require__(/*! path */ "path");
var spawn = (__webpack_require__(/*! child_process */ "child_process").spawn);
var debug = __webpack_require__(/*! debug */ "./node_modules/electron-squirrel-startup/node_modules/debug/src/index.js")('electron-squirrel-startup');
var app = (__webpack_require__(/*! electron */ "electron").app);

var run = function(args, done) {
  var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  debug('Spawning `%s` with args `%s`', updateExe, args);
  spawn(updateExe, args, {
    detached: true
  }).on('close', done);
};

var check = function() {
  if (process.platform === 'win32') {
    var cmd = process.argv[1];
    debug('processing squirrel command `%s`', cmd);
    var target = path.basename(process.execPath);

    if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
      run(['--createShortcut=' + target + ''], app.quit);
      return true;
    }
    if (cmd === '--squirrel-uninstall') {
      run(['--removeShortcut=' + target + ''], app.quit);
      return true;
    }
    if (cmd === '--squirrel-obsolete') {
      app.quit();
      return true;
    }
  }
  return false;
};

module.exports = check();


/***/ },

/***/ "./node_modules/electron-squirrel-startup/node_modules/debug/src/browser.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/node_modules/debug/src/browser.js ***!
  \**********************************************************************************/
(module, exports, __webpack_require__) {

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(/*! ./debug */ "./node_modules/electron-squirrel-startup/node_modules/debug/src/debug.js");
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}


/***/ },

/***/ "./node_modules/electron-squirrel-startup/node_modules/debug/src/debug.js"
/*!********************************************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/node_modules/debug/src/debug.js ***!
  \********************************************************************************/
(module, exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = __webpack_require__(/*! ms */ "./node_modules/electron-squirrel-startup/node_modules/ms/index.js");

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}


/***/ },

/***/ "./node_modules/electron-squirrel-startup/node_modules/debug/src/index.js"
/*!********************************************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/node_modules/debug/src/index.js ***!
  \********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Detect Electron renderer process, which is node, but we should
 * treat as a browser.
 */

if (typeof process !== 'undefined' && process.type === 'renderer') {
  module.exports = __webpack_require__(/*! ./browser.js */ "./node_modules/electron-squirrel-startup/node_modules/debug/src/browser.js");
} else {
  module.exports = __webpack_require__(/*! ./node.js */ "./node_modules/electron-squirrel-startup/node_modules/debug/src/node.js");
}


/***/ },

/***/ "./node_modules/electron-squirrel-startup/node_modules/debug/src/node.js"
/*!*******************************************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/node_modules/debug/src/node.js ***!
  \*******************************************************************************/
(module, exports, __webpack_require__) {

/**
 * Module dependencies.
 */

var tty = __webpack_require__(/*! tty */ "tty");
var util = __webpack_require__(/*! util */ "util");

/**
 * This is the Node.js implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(/*! ./debug */ "./node_modules/electron-squirrel-startup/node_modules/debug/src/debug.js");
exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(function (key) {
  return /^debug_/i.test(key);
}).reduce(function (obj, key) {
  // camel-case
  var prop = key
    .substring(6)
    .toLowerCase()
    .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

  // coerce string value into JS value
  var val = process.env[key];
  if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
  else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
  else if (val === 'null') val = null;
  else val = Number(val);

  obj[prop] = val;
  return obj;
}, {});

/**
 * The file descriptor to write the `debug()` calls to.
 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
 *
 *   $ DEBUG_FD=3 node script.js 3>debug.log
 */

var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

if (1 !== fd && 2 !== fd) {
  util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')()
}

var stream = 1 === fd ? process.stdout :
             2 === fd ? process.stderr :
             createWritableStdioStream(fd);

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
  return 'colors' in exports.inspectOpts
    ? Boolean(exports.inspectOpts.colors)
    : tty.isatty(fd);
}

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

exports.formatters.o = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts)
    .split('\n').map(function(str) {
      return str.trim()
    }).join(' ');
};

/**
 * Map %o to `util.inspect()`, allowing multiple lines if needed.
 */

exports.formatters.O = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts);
};

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var name = this.namespace;
  var useColors = this.useColors;

  if (useColors) {
    var c = this.color;
    var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
    args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
  } else {
    args[0] = new Date().toUTCString()
      + ' ' + name + ' ' + args[0];
  }
}

/**
 * Invokes `util.format()` with the specified arguments and writes to `stream`.
 */

function log() {
  return stream.write(util.format.apply(util, arguments) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  if (null == namespaces) {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete process.env.DEBUG;
  } else {
    process.env.DEBUG = namespaces;
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  return process.env.DEBUG;
}

/**
 * Copied from `node/src/node.js`.
 *
 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
 */

function createWritableStdioStream (fd) {
  var stream;
  var tty_wrap = process.binding('tty_wrap');

  // Note stream._type is used for test-module-load-list.js

  switch (tty_wrap.guessHandleType(fd)) {
    case 'TTY':
      stream = new tty.WriteStream(fd);
      stream._type = 'tty';

      // Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    case 'FILE':
      var fs = __webpack_require__(/*! fs */ "fs");
      stream = new fs.SyncWriteStream(fd, { autoClose: false });
      stream._type = 'fs';
      break;

    case 'PIPE':
    case 'TCP':
      var net = __webpack_require__(/*! net */ "net");
      stream = new net.Socket({
        fd: fd,
        readable: false,
        writable: true
      });

      // FIXME Should probably have an option in net.Socket to create a
      // stream from an existing fd which is writable only. But for now
      // we'll just add this hack and set the `readable` member to false.
      // Test: ./node test/fixtures/echo.js < /etc/passwd
      stream.readable = false;
      stream.read = null;
      stream._type = 'pipe';

      // FIXME Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    default:
      // Probably an error on in uv_guess_handle()
      throw new Error('Implement me. Unknown stream file type!');
  }

  // For supporting legacy API we put the FD here.
  stream.fd = fd;

  stream._isStdio = true;

  return stream;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init (debug) {
  debug.inspectOpts = {};

  var keys = Object.keys(exports.inspectOpts);
  for (var i = 0; i < keys.length; i++) {
    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
  }
}

/**
 * Enable namespaces listed in `process.env.DEBUG` initially.
 */

exports.enable(load());


/***/ },

/***/ "./node_modules/electron-squirrel-startup/node_modules/ms/index.js"
/*!*************************************************************************!*\
  !*** ./node_modules/electron-squirrel-startup/node_modules/ms/index.js ***!
  \*************************************************************************/
(module) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}


/***/ },

/***/ "./node_modules/node-pty/lib/eventEmitter2.js"
/*!****************************************************!*\
  !*** ./node_modules/node-pty/lib/eventEmitter2.js ***!
  \****************************************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * Copyright (c) 2019, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventEmitter2 = void 0;
var EventEmitter2 = /** @class */ (function () {
    function EventEmitter2() {
        this._listeners = [];
    }
    Object.defineProperty(EventEmitter2.prototype, "event", {
        get: function () {
            var _this = this;
            if (!this._event) {
                this._event = function (listener) {
                    _this._listeners.push(listener);
                    var disposable = {
                        dispose: function () {
                            for (var i = 0; i < _this._listeners.length; i++) {
                                if (_this._listeners[i] === listener) {
                                    _this._listeners.splice(i, 1);
                                    return;
                                }
                            }
                        }
                    };
                    return disposable;
                };
            }
            return this._event;
        },
        enumerable: false,
        configurable: true
    });
    EventEmitter2.prototype.fire = function (data) {
        var queue = [];
        for (var i = 0; i < this._listeners.length; i++) {
            queue.push(this._listeners[i]);
        }
        for (var i = 0; i < queue.length; i++) {
            queue[i].call(undefined, data);
        }
    };
    return EventEmitter2;
}());
exports.EventEmitter2 = EventEmitter2;
//# sourceMappingURL=eventEmitter2.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/index.js"
/*!********************************************!*\
  !*** ./node_modules/node-pty/lib/index.js ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
 * Copyright (c) 2016, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.native = exports.open = exports.createTerminal = exports.fork = exports.spawn = void 0;
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/node-pty/lib/utils.js");
var terminalCtor;
if (process.platform === 'win32') {
    terminalCtor = (__webpack_require__(/*! ./windowsTerminal */ "./node_modules/node-pty/lib/windowsTerminal.js").WindowsTerminal);
}
else {
    terminalCtor = (__webpack_require__(/*! ./unixTerminal */ "./node_modules/node-pty/lib/unixTerminal.js").UnixTerminal);
}
/**
 * Forks a process as a pseudoterminal.
 * @param file The file to launch.
 * @param args The file's arguments as argv (string[]) or in a pre-escaped
 * CommandLine format (string). Note that the CommandLine option is only
 * available on Windows and is expected to be escaped properly.
 * @param options The options of the terminal.
 * @throws When the file passed to spawn with does not exists.
 * @see CommandLineToArgvW https://msdn.microsoft.com/en-us/library/windows/desktop/bb776391(v=vs.85).aspx
 * @see Parsing C++ Comamnd-Line Arguments https://msdn.microsoft.com/en-us/library/17w5ykft.aspx
 * @see GetCommandLine https://msdn.microsoft.com/en-us/library/windows/desktop/ms683156.aspx
 */
function spawn(file, args, opt) {
    return new terminalCtor(file, args, opt);
}
exports.spawn = spawn;
/** @deprecated */
function fork(file, args, opt) {
    return new terminalCtor(file, args, opt);
}
exports.fork = fork;
/** @deprecated */
function createTerminal(file, args, opt) {
    return new terminalCtor(file, args, opt);
}
exports.createTerminal = createTerminal;
function open(options) {
    return terminalCtor.open(options);
}
exports.open = open;
/**
 * Expose the native API when not Windows, note that this is not public API and
 * could be removed at any time.
 */
exports.native = (process.platform !== 'win32' ? utils_1.loadNativeModule('pty').module : null);
//# sourceMappingURL=index.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/shared/conout.js"
/*!****************************************************!*\
  !*** ./node_modules/node-pty/lib/shared/conout.js ***!
  \****************************************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * Copyright (c) 2020, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getWorkerPipeName = void 0;
function getWorkerPipeName(conoutPipeName) {
    return conoutPipeName + "-worker";
}
exports.getWorkerPipeName = getWorkerPipeName;
//# sourceMappingURL=conout.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/terminal.js"
/*!***********************************************!*\
  !*** ./node_modules/node-pty/lib/terminal.js ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) 2012-2015, Christopher Jeffrey (MIT License)
 * Copyright (c) 2016, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Terminal = exports.DEFAULT_ROWS = exports.DEFAULT_COLS = void 0;
var events_1 = __webpack_require__(/*! events */ "events");
var eventEmitter2_1 = __webpack_require__(/*! ./eventEmitter2 */ "./node_modules/node-pty/lib/eventEmitter2.js");
exports.DEFAULT_COLS = 80;
exports.DEFAULT_ROWS = 24;
/**
 * Default messages to indicate PAUSE/RESUME for automatic flow control.
 * To avoid conflicts with rebound XON/XOFF control codes (such as on-my-zsh),
 * the sequences can be customized in `IPtyForkOptions`.
 */
var FLOW_CONTROL_PAUSE = '\x13'; // defaults to XOFF
var FLOW_CONTROL_RESUME = '\x11'; // defaults to XON
var Terminal = /** @class */ (function () {
    function Terminal(opt) {
        this._pid = 0;
        this._fd = 0;
        this._cols = 0;
        this._rows = 0;
        this._readable = false;
        this._writable = false;
        this._onData = new eventEmitter2_1.EventEmitter2();
        this._onExit = new eventEmitter2_1.EventEmitter2();
        // for 'close'
        this._internalee = new events_1.EventEmitter();
        // setup flow control handling
        this.handleFlowControl = !!(opt === null || opt === void 0 ? void 0 : opt.handleFlowControl);
        this._flowControlPause = (opt === null || opt === void 0 ? void 0 : opt.flowControlPause) || FLOW_CONTROL_PAUSE;
        this._flowControlResume = (opt === null || opt === void 0 ? void 0 : opt.flowControlResume) || FLOW_CONTROL_RESUME;
        if (!opt) {
            return;
        }
        // Do basic type checks here in case node-pty is being used within JavaScript. If the wrong
        // types go through to the C++ side it can lead to hard to diagnose exceptions.
        this._checkType('name', opt.name ? opt.name : undefined, 'string');
        this._checkType('cols', opt.cols ? opt.cols : undefined, 'number');
        this._checkType('rows', opt.rows ? opt.rows : undefined, 'number');
        this._checkType('cwd', opt.cwd ? opt.cwd : undefined, 'string');
        this._checkType('env', opt.env ? opt.env : undefined, 'object');
        this._checkType('uid', opt.uid ? opt.uid : undefined, 'number');
        this._checkType('gid', opt.gid ? opt.gid : undefined, 'number');
        this._checkType('encoding', opt.encoding ? opt.encoding : undefined, 'string');
    }
    Object.defineProperty(Terminal.prototype, "onData", {
        get: function () { return this._onData.event; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "onExit", {
        get: function () { return this._onExit.event; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "pid", {
        get: function () { return this._pid; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "cols", {
        get: function () { return this._cols; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "rows", {
        get: function () { return this._rows; },
        enumerable: false,
        configurable: true
    });
    Terminal.prototype.write = function (data) {
        if (this.handleFlowControl) {
            // PAUSE/RESUME messages are not forwarded to the pty
            if (data === this._flowControlPause) {
                this.pause();
                return;
            }
            if (data === this._flowControlResume) {
                this.resume();
                return;
            }
        }
        // everything else goes to the real pty
        this._write(data);
    };
    Terminal.prototype._forwardEvents = function () {
        var _this = this;
        this.on('data', function (e) { return _this._onData.fire(e); });
        this.on('exit', function (exitCode, signal) { return _this._onExit.fire({ exitCode: exitCode, signal: signal }); });
    };
    Terminal.prototype._checkType = function (name, value, type, allowArray) {
        if (allowArray === void 0) { allowArray = false; }
        if (value === undefined) {
            return;
        }
        if (allowArray) {
            if (Array.isArray(value)) {
                value.forEach(function (v, i) {
                    if (typeof v !== type) {
                        throw new Error(name + "[" + i + "] must be a " + type + " (not a " + typeof v[i] + ")");
                    }
                });
                return;
            }
        }
        if (typeof value !== type) {
            throw new Error(name + " must be a " + type + " (not a " + typeof value + ")");
        }
    };
    /** See net.Socket.end */
    Terminal.prototype.end = function (data) {
        this._socket.end(data);
    };
    /** See stream.Readable.pipe */
    Terminal.prototype.pipe = function (dest, options) {
        return this._socket.pipe(dest, options);
    };
    /** See net.Socket.pause */
    Terminal.prototype.pause = function () {
        return this._socket.pause();
    };
    /** See net.Socket.resume */
    Terminal.prototype.resume = function () {
        return this._socket.resume();
    };
    /** See net.Socket.setEncoding */
    Terminal.prototype.setEncoding = function (encoding) {
        if (this._socket._decoder) {
            delete this._socket._decoder;
        }
        if (encoding) {
            this._socket.setEncoding(encoding);
        }
    };
    Terminal.prototype.addListener = function (eventName, listener) { this.on(eventName, listener); };
    Terminal.prototype.on = function (eventName, listener) {
        if (eventName === 'close') {
            this._internalee.on('close', listener);
            return;
        }
        this._socket.on(eventName, listener);
    };
    Terminal.prototype.emit = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (eventName === 'close') {
            return this._internalee.emit.apply(this._internalee, arguments);
        }
        return this._socket.emit.apply(this._socket, arguments);
    };
    Terminal.prototype.listeners = function (eventName) {
        return this._socket.listeners(eventName);
    };
    Terminal.prototype.removeListener = function (eventName, listener) {
        this._socket.removeListener(eventName, listener);
    };
    Terminal.prototype.removeAllListeners = function (eventName) {
        this._socket.removeAllListeners(eventName);
    };
    Terminal.prototype.once = function (eventName, listener) {
        this._socket.once(eventName, listener);
    };
    Terminal.prototype._close = function () {
        this._socket.readable = false;
        this.write = function () { };
        this.end = function () { };
        this._writable = false;
        this._readable = false;
    };
    Terminal.prototype._parseEnv = function (env) {
        var keys = Object.keys(env || {});
        var pairs = [];
        for (var i = 0; i < keys.length; i++) {
            if (keys[i] === undefined) {
                continue;
            }
            pairs.push(keys[i] + '=' + env[keys[i]]);
        }
        return pairs;
    };
    return Terminal;
}());
exports.Terminal = Terminal;
//# sourceMappingURL=terminal.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/unixTerminal.js"
/*!***************************************************!*\
  !*** ./node_modules/node-pty/lib/unixTerminal.js ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnixTerminal = void 0;
/**
 * Copyright (c) 2012-2015, Christopher Jeffrey (MIT License)
 * Copyright (c) 2016, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
var fs = __webpack_require__(/*! fs */ "fs");
var path = __webpack_require__(/*! path */ "path");
var tty = __webpack_require__(/*! tty */ "tty");
var terminal_1 = __webpack_require__(/*! ./terminal */ "./node_modules/node-pty/lib/terminal.js");
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/node-pty/lib/utils.js");
var native = utils_1.loadNativeModule('pty');
var pty = native.module;
var helperPath = native.dir + '/spawn-helper';
helperPath = path.resolve(__dirname, helperPath);
helperPath = helperPath.replace('app.asar', 'app.asar.unpacked');
helperPath = helperPath.replace('node_modules.asar', 'node_modules.asar.unpacked');
var DEFAULT_FILE = 'sh';
var DEFAULT_NAME = 'xterm';
var DESTROY_SOCKET_TIMEOUT_MS = 200;
var UnixTerminal = /** @class */ (function (_super) {
    __extends(UnixTerminal, _super);
    function UnixTerminal(file, args, opt) {
        var _a, _b;
        var _this = _super.call(this, opt) || this;
        _this._boundClose = false;
        _this._emittedClose = false;
        if (typeof args === 'string') {
            throw new Error('args as a string is not supported on unix.');
        }
        // Initialize arguments
        args = args || [];
        file = file || DEFAULT_FILE;
        opt = opt || {};
        opt.env = opt.env || process.env;
        _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
        _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var uid = (_a = opt.uid) !== null && _a !== void 0 ? _a : -1;
        var gid = (_b = opt.gid) !== null && _b !== void 0 ? _b : -1;
        var env = utils_1.assign({}, opt.env);
        if (opt.env === process.env) {
            _this._sanitizeEnv(env);
        }
        var cwd = opt.cwd || process.cwd();
        env.PWD = cwd;
        var name = opt.name || env.TERM || DEFAULT_NAME;
        env.TERM = name;
        var parsedEnv = _this._parseEnv(env);
        var encoding = (opt.encoding === undefined ? 'utf8' : opt.encoding);
        var onexit = function (code, signal) {
            // XXX Sometimes a data event is emitted after exit. Wait til socket is
            // destroyed.
            if (!_this._emittedClose) {
                if (_this._boundClose) {
                    return;
                }
                _this._boundClose = true;
                // From macOS High Sierra 10.13.2 sometimes the socket never gets
                // closed. A timeout is applied here to avoid the terminal never being
                // destroyed when this occurs.
                var timeout_1 = setTimeout(function () {
                    timeout_1 = null;
                    // Destroying the socket now will cause the close event to fire
                    _this._socket.destroy();
                }, DESTROY_SOCKET_TIMEOUT_MS);
                _this.once('close', function () {
                    if (timeout_1 !== null) {
                        clearTimeout(timeout_1);
                    }
                    _this.emit('exit', code, signal);
                });
                return;
            }
            _this.emit('exit', code, signal);
        };
        // fork
        var term = pty.fork(file, args, parsedEnv, cwd, _this._cols, _this._rows, uid, gid, (encoding === 'utf8'), helperPath, onexit);
        _this._socket = new tty.ReadStream(term.fd);
        if (encoding !== null) {
            _this._socket.setEncoding(encoding);
        }
        _this._writeStream = new CustomWriteStream(term.fd, (encoding || undefined));
        // setup
        _this._socket.on('error', function (err) {
            // NOTE: fs.ReadStream gets EAGAIN twice at first:
            if (err.code) {
                if (~err.code.indexOf('EAGAIN')) {
                    return;
                }
            }
            // close
            _this._close();
            // EIO on exit from fs.ReadStream:
            if (!_this._emittedClose) {
                _this._emittedClose = true;
                _this.emit('close');
            }
            // EIO, happens when someone closes our child process: the only process in
            // the terminal.
            // node < 0.6.14: errno 5
            // node >= 0.6.14: read EIO
            if (err.code) {
                if (~err.code.indexOf('errno 5') || ~err.code.indexOf('EIO')) {
                    return;
                }
            }
            // throw anything else
            if (_this.listeners('error').length < 2) {
                throw err;
            }
        });
        _this._pid = term.pid;
        _this._fd = term.fd;
        _this._pty = term.pty;
        _this._file = file;
        _this._name = name;
        _this._readable = true;
        _this._writable = true;
        _this._socket.on('close', function () {
            if (_this._emittedClose) {
                return;
            }
            _this._emittedClose = true;
            _this._close();
            _this.emit('close');
        });
        _this._forwardEvents();
        return _this;
    }
    Object.defineProperty(UnixTerminal.prototype, "master", {
        get: function () { return this._master; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnixTerminal.prototype, "slave", {
        get: function () { return this._slave; },
        enumerable: false,
        configurable: true
    });
    UnixTerminal.prototype._write = function (data) {
        this._writeStream.write(data);
    };
    Object.defineProperty(UnixTerminal.prototype, "fd", {
        /* Accessors */
        get: function () { return this._fd; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnixTerminal.prototype, "ptsName", {
        get: function () { return this._pty; },
        enumerable: false,
        configurable: true
    });
    /**
     * openpty
     */
    UnixTerminal.open = function (opt) {
        var self = Object.create(UnixTerminal.prototype);
        opt = opt || {};
        if (arguments.length > 1) {
            opt = {
                cols: arguments[1],
                rows: arguments[2]
            };
        }
        var cols = opt.cols || terminal_1.DEFAULT_COLS;
        var rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var encoding = (opt.encoding === undefined ? 'utf8' : opt.encoding);
        // open
        var term = pty.open(cols, rows);
        self._master = new tty.ReadStream(term.master);
        if (encoding !== null) {
            self._master.setEncoding(encoding);
        }
        self._master.resume();
        self._slave = new tty.ReadStream(term.slave);
        if (encoding !== null) {
            self._slave.setEncoding(encoding);
        }
        self._slave.resume();
        self._socket = self._master;
        self._pid = -1;
        self._fd = term.master;
        self._pty = term.pty;
        self._file = process.argv[0] || 'node';
        self._name = process.env.TERM || '';
        self._readable = true;
        self._writable = true;
        self._socket.on('error', function (err) {
            self._close();
            if (self.listeners('error').length < 2) {
                throw err;
            }
        });
        self._socket.on('close', function () {
            self._close();
        });
        return self;
    };
    UnixTerminal.prototype.destroy = function () {
        var _this = this;
        this._close();
        // Need to close the read stream so node stops reading a dead file
        // descriptor. Then we can safely SIGHUP the shell.
        this._socket.once('close', function () {
            _this.kill('SIGHUP');
        });
        this._socket.destroy();
        this._writeStream.dispose();
    };
    UnixTerminal.prototype.kill = function (signal) {
        try {
            process.kill(this.pid, signal || 'SIGHUP');
        }
        catch (e) { /* swallow */ }
    };
    Object.defineProperty(UnixTerminal.prototype, "process", {
        /**
         * Gets the name of the process.
         */
        get: function () {
            if (process.platform === 'darwin') {
                var title = pty.process(this._fd);
                return (title !== 'kernel_task') ? title : this._file;
            }
            return pty.process(this._fd, this._pty) || this._file;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * TTY
     */
    UnixTerminal.prototype.resize = function (cols, rows) {
        if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) {
            throw new Error('resizing must be done using positive cols and rows');
        }
        pty.resize(this._fd, cols, rows);
        this._cols = cols;
        this._rows = rows;
    };
    UnixTerminal.prototype.clear = function () {
    };
    UnixTerminal.prototype._sanitizeEnv = function (env) {
        // Make sure we didn't start our server from inside tmux.
        delete env['TMUX'];
        delete env['TMUX_PANE'];
        // Make sure we didn't start our server from inside screen.
        // http://web.mit.edu/gnu/doc/html/screen_20.html
        delete env['STY'];
        delete env['WINDOW'];
        // Delete some variables that might confuse our terminal.
        delete env['WINDOWID'];
        delete env['TERMCAP'];
        delete env['COLUMNS'];
        delete env['LINES'];
    };
    return UnixTerminal;
}(terminal_1.Terminal));
exports.UnixTerminal = UnixTerminal;
/**
 * A custom write stream that writes directly to a file descriptor with proper
 * handling of backpressure and errors. This avoids some event loop exhaustion
 * issues that can occur when using the standard APIs in Node.
 */
var CustomWriteStream = /** @class */ (function () {
    function CustomWriteStream(_fd, _encoding) {
        this._fd = _fd;
        this._encoding = _encoding;
        this._writeQueue = [];
    }
    CustomWriteStream.prototype.dispose = function () {
        clearImmediate(this._writeImmediate);
        this._writeImmediate = undefined;
    };
    CustomWriteStream.prototype.write = function (data) {
        // Writes are put in a queue and processed asynchronously in order to handle
        // backpressure from the kernel buffer.
        var buffer = typeof data === 'string'
            ? Buffer.from(data, this._encoding)
            : Buffer.from(data);
        if (buffer.byteLength !== 0) {
            this._writeQueue.push({ buffer: buffer, offset: 0 });
            if (this._writeQueue.length === 1) {
                this._processWriteQueue();
            }
        }
    };
    CustomWriteStream.prototype._processWriteQueue = function () {
        var _this = this;
        this._writeImmediate = undefined;
        if (this._writeQueue.length === 0) {
            return;
        }
        var task = this._writeQueue[0];
        // Write to the underlying file descriptor and handle it directly, rather
        // than using the `net.Socket`/`tty.WriteStream` wrappers which swallow and
        // mask errors like EAGAIN and can cause the thread to block indefinitely.
        fs.write(this._fd, task.buffer, task.offset, function (err, written) {
            if (err) {
                if ('code' in err && err.code === 'EAGAIN') {
                    // `setImmediate` is used to yield to the event loop and re-attempt
                    // the write later.
                    _this._writeImmediate = setImmediate(function () { return _this._processWriteQueue(); });
                }
                else {
                    // Stop processing immediately on unexpected error and log
                    _this._writeQueue.length = 0;
                    console.error('Unhandled pty write error', err);
                }
                return;
            }
            task.offset += written;
            if (task.offset >= task.buffer.byteLength) {
                _this._writeQueue.shift();
            }
            // Since there is more room in the kernel buffer, we can continue to write
            // until we hit EAGAIN or exhaust the queue.
            //
            // Note that old versions of bash, like v3.2 which ships in macOS, appears
            // to have a bug in its readline implementation that causes data
            // corruption when writes to the pty happens too quickly. Instead of
            // trying to workaround that we just accept it so that large pastes are as
            // fast as possible.
            // Context: https://github.com/microsoft/node-pty/issues/833
            _this._processWriteQueue();
        });
    };
    return CustomWriteStream;
}());
//# sourceMappingURL=unixTerminal.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/utils.js"
/*!********************************************!*\
  !*** ./node_modules/node-pty/lib/utils.js ***!
  \********************************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * Copyright (c) 2017, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadNativeModule = exports.assign = void 0;
function assign(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    sources.forEach(function (source) { return Object.keys(source).forEach(function (key) { return target[key] = source[key]; }); });
    return target;
}
exports.assign = assign;
function loadNativeModule(name) {
    // Check build, debug, and then prebuilds.
    var dirs = ['build/Release', 'build/Debug', "prebuilds/" + process.platform + "-" + process.arch];
    // Check relative to the parent dir for unbundled and then the current dir for bundled
    var relative = ['..', '.'];
    var lastError;
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var d = dirs_1[_i];
        for (var _a = 0, relative_1 = relative; _a < relative_1.length; _a++) {
            var r = relative_1[_a];
            var dir = r + "/" + d + "/";
            try {
                return { dir: dir, module: require(dir + "/" + name + ".node") };
            }
            catch (e) {
                lastError = e;
            }
        }
    }
    throw new Error("Failed to load native module: " + name + ".node, checked: " + dirs.join(', ') + ": " + lastError);
}
exports.loadNativeModule = loadNativeModule;
//# sourceMappingURL=utils.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/windowsConoutConnection.js"
/*!**************************************************************!*\
  !*** ./node_modules/node-pty/lib/windowsConoutConnection.js ***!
  \**************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) 2020, Microsoft Corporation (MIT License).
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConoutConnection = void 0;
var worker_threads_1 = __webpack_require__(/*! worker_threads */ "worker_threads");
var conout_1 = __webpack_require__(/*! ./shared/conout */ "./node_modules/node-pty/lib/shared/conout.js");
var path_1 = __webpack_require__(/*! path */ "path");
var eventEmitter2_1 = __webpack_require__(/*! ./eventEmitter2 */ "./node_modules/node-pty/lib/eventEmitter2.js");
/**
 * The amount of time to wait for additional data after the conpty shell process has exited before
 * shutting down the worker and sockets. The timer will be reset if a new data event comes in after
 * the timer has started.
 */
var FLUSH_DATA_INTERVAL = 1000;
/**
 * Connects to and manages the lifecycle of the conout socket. This socket must be drained on
 * another thread in order to avoid deadlocks where Conpty waits for the out socket to drain
 * when `ClosePseudoConsole` is called. This happens when data is being written to the terminal when
 * the pty is closed.
 *
 * See also:
 * - https://github.com/microsoft/node-pty/issues/375
 * - https://github.com/microsoft/vscode/issues/76548
 * - https://github.com/microsoft/terminal/issues/1810
 * - https://docs.microsoft.com/en-us/windows/console/closepseudoconsole
 */
var ConoutConnection = /** @class */ (function () {
    function ConoutConnection(_conoutPipeName, _useConptyDll) {
        var _this = this;
        this._conoutPipeName = _conoutPipeName;
        this._useConptyDll = _useConptyDll;
        this._isDisposed = false;
        this._onReady = new eventEmitter2_1.EventEmitter2();
        var workerData = {
            conoutPipeName: _conoutPipeName
        };
        var scriptPath = __dirname.replace('node_modules.asar', 'node_modules.asar.unpacked');
        this._worker = new worker_threads_1.Worker(path_1.join(scriptPath, 'worker/conoutSocketWorker.js'), { workerData: workerData });
        this._worker.on('message', function (message) {
            switch (message) {
                case 1 /* READY */:
                    _this._onReady.fire();
                    return;
                default:
                    console.warn('Unexpected ConoutWorkerMessage', message);
            }
        });
    }
    Object.defineProperty(ConoutConnection.prototype, "onReady", {
        get: function () { return this._onReady.event; },
        enumerable: false,
        configurable: true
    });
    ConoutConnection.prototype.dispose = function () {
        if (!this._useConptyDll && this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        // Drain all data from the socket before closing
        this._drainDataAndClose();
    };
    ConoutConnection.prototype.connectSocket = function (socket) {
        socket.connect(conout_1.getWorkerPipeName(this._conoutPipeName));
    };
    ConoutConnection.prototype._drainDataAndClose = function () {
        var _this = this;
        if (this._drainTimeout) {
            clearTimeout(this._drainTimeout);
        }
        this._drainTimeout = setTimeout(function () { return _this._destroySocket(); }, FLUSH_DATA_INTERVAL);
    };
    ConoutConnection.prototype._destroySocket = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._worker.terminate()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ConoutConnection;
}());
exports.ConoutConnection = ConoutConnection;
//# sourceMappingURL=windowsConoutConnection.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/windowsPtyAgent.js"
/*!******************************************************!*\
  !*** ./node_modules/node-pty/lib/windowsPtyAgent.js ***!
  \******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
 * Copyright (c) 2016, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.argsToCommandLine = exports.WindowsPtyAgent = void 0;
var fs = __webpack_require__(/*! fs */ "fs");
var os = __webpack_require__(/*! os */ "os");
var path = __webpack_require__(/*! path */ "path");
var child_process_1 = __webpack_require__(/*! child_process */ "child_process");
var net_1 = __webpack_require__(/*! net */ "net");
var windowsConoutConnection_1 = __webpack_require__(/*! ./windowsConoutConnection */ "./node_modules/node-pty/lib/windowsConoutConnection.js");
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/node-pty/lib/utils.js");
var conptyNative;
var winptyNative;
/**
 * The amount of time to wait for additional data after the conpty shell process has exited before
 * shutting down the socket. The timer will be reset if a new data event comes in after the timer
 * has started.
 */
var FLUSH_DATA_INTERVAL = 1000;
/**
 * This agent sits between the WindowsTerminal class and provides a common interface for both conpty
 * and winpty.
 */
var WindowsPtyAgent = /** @class */ (function () {
    function WindowsPtyAgent(file, args, env, cwd, cols, rows, debug, _useConpty, _useConptyDll, conptyInheritCursor) {
        var _this = this;
        if (_useConptyDll === void 0) { _useConptyDll = false; }
        if (conptyInheritCursor === void 0) { conptyInheritCursor = false; }
        this._useConpty = _useConpty;
        this._useConptyDll = _useConptyDll;
        this._pid = 0;
        this._innerPid = 0;
        if (this._useConpty === undefined || this._useConpty === true) {
            this._useConpty = this._getWindowsBuildNumber() >= 18309;
        }
        if (this._useConpty) {
            if (!conptyNative) {
                conptyNative = utils_1.loadNativeModule('conpty').module;
            }
        }
        else {
            if (!winptyNative) {
                winptyNative = utils_1.loadNativeModule('pty').module;
            }
        }
        this._ptyNative = this._useConpty ? conptyNative : winptyNative;
        // Sanitize input variable.
        cwd = path.resolve(cwd);
        // Compose command line
        var commandLine = argsToCommandLine(file, args);
        // Open pty session.
        var term;
        if (this._useConpty) {
            term = this._ptyNative.startProcess(file, cols, rows, debug, this._generatePipeName(), conptyInheritCursor, this._useConptyDll);
        }
        else {
            term = this._ptyNative.startProcess(file, commandLine, env, cwd, cols, rows, debug);
            this._pid = term.pid;
            this._innerPid = term.innerPid;
        }
        // Not available on windows.
        this._fd = term.fd;
        // Generated incremental number that has no real purpose besides  using it
        // as a terminal id.
        this._pty = term.pty;
        // Create terminal pipe IPC channel and forward to a local unix socket.
        this._outSocket = new net_1.Socket();
        this._outSocket.setEncoding('utf8');
        // The conout socket must be ready out on another thread to avoid deadlocks
        this._conoutSocketWorker = new windowsConoutConnection_1.ConoutConnection(term.conout, this._useConptyDll);
        this._conoutSocketWorker.onReady(function () {
            _this._conoutSocketWorker.connectSocket(_this._outSocket);
        });
        this._outSocket.on('connect', function () {
            _this._outSocket.emit('ready_datapipe');
        });
        var inSocketFD = fs.openSync(term.conin, 'w');
        this._inSocket = new net_1.Socket({
            fd: inSocketFD,
            readable: false,
            writable: true
        });
        this._inSocket.setEncoding('utf8');
        if (this._useConpty) {
            var connect = this._ptyNative.connect(this._pty, commandLine, cwd, env, this._useConptyDll, function (c) { return _this._$onProcessExit(c); });
            this._innerPid = connect.pid;
        }
    }
    Object.defineProperty(WindowsPtyAgent.prototype, "inSocket", {
        get: function () { return this._inSocket; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsPtyAgent.prototype, "outSocket", {
        get: function () { return this._outSocket; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsPtyAgent.prototype, "fd", {
        get: function () { return this._fd; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsPtyAgent.prototype, "innerPid", {
        get: function () { return this._innerPid; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsPtyAgent.prototype, "pty", {
        get: function () { return this._pty; },
        enumerable: false,
        configurable: true
    });
    WindowsPtyAgent.prototype.resize = function (cols, rows) {
        if (this._useConpty) {
            if (this._exitCode !== undefined) {
                throw new Error('Cannot resize a pty that has already exited');
            }
            this._ptyNative.resize(this._pty, cols, rows, this._useConptyDll);
            return;
        }
        this._ptyNative.resize(this._pid, cols, rows);
    };
    WindowsPtyAgent.prototype.clear = function () {
        if (this._useConpty) {
            this._ptyNative.clear(this._pty, this._useConptyDll);
        }
    };
    WindowsPtyAgent.prototype.kill = function () {
        var _this = this;
        // Tell the agent to kill the pty, this releases handles to the process
        if (this._useConpty) {
            if (!this._useConptyDll) {
                this._inSocket.readable = false;
                this._outSocket.readable = false;
                this._getConsoleProcessList().then(function (consoleProcessList) {
                    consoleProcessList.forEach(function (pid) {
                        try {
                            process.kill(pid);
                        }
                        catch (e) {
                            // Ignore if process cannot be found (kill ESRCH error)
                        }
                    });
                });
                this._ptyNative.kill(this._pty, this._useConptyDll);
                this._conoutSocketWorker.dispose();
            }
            else {
                // Close the input write handle to signal the end of session.
                this._inSocket.destroy();
                this._ptyNative.kill(this._pty, this._useConptyDll);
                this._outSocket.on('data', function () {
                    _this._conoutSocketWorker.dispose();
                });
            }
        }
        else {
            // Because pty.kill closes the handle, it will kill most processes by itself.
            // Process IDs can be reused as soon as all handles to them are
            // dropped, so we want to immediately kill the entire console process list.
            // If we do not force kill all processes here, node servers in particular
            // seem to become detached and remain running (see
            // Microsoft/vscode#26807).
            var processList = this._ptyNative.getProcessList(this._pid);
            this._ptyNative.kill(this._pid, this._innerPid);
            processList.forEach(function (pid) {
                try {
                    process.kill(pid);
                }
                catch (e) {
                    // Ignore if process cannot be found (kill ESRCH error)
                }
            });
        }
    };
    WindowsPtyAgent.prototype._getConsoleProcessList = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var agent = child_process_1.fork(path.join(__dirname, 'conpty_console_list_agent'), [_this._innerPid.toString()]);
            agent.on('message', function (message) {
                clearTimeout(timeout);
                resolve(message.consoleProcessList);
            });
            var timeout = setTimeout(function () {
                // Something went wrong, just send back the shell PID
                agent.kill();
                resolve([_this._innerPid]);
            }, 5000);
        });
    };
    Object.defineProperty(WindowsPtyAgent.prototype, "exitCode", {
        get: function () {
            if (this._useConpty) {
                return this._exitCode;
            }
            var winptyExitCode = this._ptyNative.getExitCode(this._innerPid);
            return winptyExitCode === -1 ? undefined : winptyExitCode;
        },
        enumerable: false,
        configurable: true
    });
    WindowsPtyAgent.prototype._getWindowsBuildNumber = function () {
        var osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        var buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
    };
    WindowsPtyAgent.prototype._generatePipeName = function () {
        return "conpty-" + Math.random() * 10000000;
    };
    /**
     * Triggered from the native side when a contpy process exits.
     */
    WindowsPtyAgent.prototype._$onProcessExit = function (exitCode) {
        var _this = this;
        this._exitCode = exitCode;
        if (!this._useConptyDll) {
            this._flushDataAndCleanUp();
            this._outSocket.on('data', function () { return _this._flushDataAndCleanUp(); });
        }
    };
    WindowsPtyAgent.prototype._flushDataAndCleanUp = function () {
        var _this = this;
        if (this._useConptyDll) {
            return;
        }
        if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
        }
        this._closeTimeout = setTimeout(function () { return _this._cleanUpProcess(); }, FLUSH_DATA_INTERVAL);
    };
    WindowsPtyAgent.prototype._cleanUpProcess = function () {
        if (this._useConptyDll) {
            return;
        }
        this._inSocket.readable = false;
        this._outSocket.readable = false;
        this._outSocket.destroy();
    };
    return WindowsPtyAgent;
}());
exports.WindowsPtyAgent = WindowsPtyAgent;
// Convert argc/argv into a Win32 command-line following the escaping convention
// documented on MSDN (e.g. see CommandLineToArgvW documentation). Copied from
// winpty project.
function argsToCommandLine(file, args) {
    if (isCommandLine(args)) {
        if (args.length === 0) {
            return file;
        }
        return argsToCommandLine(file, []) + " " + args;
    }
    var argv = [file];
    Array.prototype.push.apply(argv, args);
    var result = '';
    for (var argIndex = 0; argIndex < argv.length; argIndex++) {
        if (argIndex > 0) {
            result += ' ';
        }
        var arg = argv[argIndex];
        // if it is empty or it contains whitespace and is not already quoted
        var hasLopsidedEnclosingQuote = xOr((arg[0] !== '"'), (arg[arg.length - 1] !== '"'));
        var hasNoEnclosingQuotes = ((arg[0] !== '"') && (arg[arg.length - 1] !== '"'));
        var quote = arg === '' ||
            (arg.indexOf(' ') !== -1 ||
                arg.indexOf('\t') !== -1) &&
                ((arg.length > 1) &&
                    (hasLopsidedEnclosingQuote || hasNoEnclosingQuotes));
        if (quote) {
            result += '\"';
        }
        var bsCount = 0;
        for (var i = 0; i < arg.length; i++) {
            var p = arg[i];
            if (p === '\\') {
                bsCount++;
            }
            else if (p === '"') {
                result += repeatText('\\', bsCount * 2 + 1);
                result += '"';
                bsCount = 0;
            }
            else {
                result += repeatText('\\', bsCount);
                bsCount = 0;
                result += p;
            }
        }
        if (quote) {
            result += repeatText('\\', bsCount * 2);
            result += '\"';
        }
        else {
            result += repeatText('\\', bsCount);
        }
    }
    return result;
}
exports.argsToCommandLine = argsToCommandLine;
function isCommandLine(args) {
    return typeof args === 'string';
}
function repeatText(text, count) {
    var result = '';
    for (var i = 0; i < count; i++) {
        result += text;
    }
    return result;
}
function xOr(arg1, arg2) {
    return ((arg1 && !arg2) || (!arg1 && arg2));
}
//# sourceMappingURL=windowsPtyAgent.js.map

/***/ },

/***/ "./node_modules/node-pty/lib/windowsTerminal.js"
/*!******************************************************!*\
  !*** ./node_modules/node-pty/lib/windowsTerminal.js ***!
  \******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) 2012-2015, Christopher Jeffrey, Peter Sunde (MIT License)
 * Copyright (c) 2016, Daniel Imms (MIT License).
 * Copyright (c) 2018, Microsoft Corporation (MIT License).
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WindowsTerminal = void 0;
var terminal_1 = __webpack_require__(/*! ./terminal */ "./node_modules/node-pty/lib/terminal.js");
var windowsPtyAgent_1 = __webpack_require__(/*! ./windowsPtyAgent */ "./node_modules/node-pty/lib/windowsPtyAgent.js");
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/node-pty/lib/utils.js");
var DEFAULT_FILE = 'cmd.exe';
var DEFAULT_NAME = 'Windows Shell';
var WindowsTerminal = /** @class */ (function (_super) {
    __extends(WindowsTerminal, _super);
    function WindowsTerminal(file, args, opt) {
        var _this = _super.call(this, opt) || this;
        _this._checkType('args', args, 'string', true);
        // Initialize arguments
        args = args || [];
        file = file || DEFAULT_FILE;
        opt = opt || {};
        opt.env = opt.env || process.env;
        if (opt.encoding) {
            console.warn('Setting encoding on Windows is not supported');
        }
        var env = utils_1.assign({}, opt.env);
        _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
        _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
        var cwd = opt.cwd || process.cwd();
        var name = opt.name || env.TERM || DEFAULT_NAME;
        var parsedEnv = _this._parseEnv(env);
        // If the terminal is ready
        _this._isReady = false;
        // Functions that need to run after `ready` event is emitted.
        _this._deferreds = [];
        // Create new termal.
        _this._agent = new windowsPtyAgent_1.WindowsPtyAgent(file, args, parsedEnv, cwd, _this._cols, _this._rows, false, opt.useConpty, opt.useConptyDll, opt.conptyInheritCursor);
        _this._socket = _this._agent.outSocket;
        // Not available until `ready` event emitted.
        _this._pid = _this._agent.innerPid;
        _this._fd = _this._agent.fd;
        _this._pty = _this._agent.pty;
        // The forked windows terminal is not available until `ready` event is
        // emitted.
        _this._socket.on('ready_datapipe', function () {
            // Run deferreds and set ready state once the first data event is received.
            _this._socket.once('data', function () {
                // Wait until the first data event is fired then we can run deferreds.
                if (!_this._isReady) {
                    // Terminal is now ready and we can avoid having to defer method
                    // calls.
                    _this._isReady = true;
                    // Execute all deferred methods
                    _this._deferreds.forEach(function (fn) {
                        // NB! In order to ensure that `this` has all its references
                        // updated any variable that need to be available in `this` before
                        // the deferred is run has to be declared above this forEach
                        // statement.
                        fn.run();
                    });
                    // Reset
                    _this._deferreds = [];
                }
            });
            // Shutdown if `error` event is emitted.
            _this._socket.on('error', function (err) {
                // Close terminal session.
                _this._close();
                // EIO, happens when someone closes our child process: the only process
                // in the terminal.
                // node < 0.6.14: errno 5
                // node >= 0.6.14: read EIO
                if (err.code) {
                    if (~err.code.indexOf('errno 5') || ~err.code.indexOf('EIO'))
                        return;
                }
                // Throw anything else.
                if (_this.listeners('error').length < 2) {
                    throw err;
                }
            });
            // Cleanup after the socket is closed.
            _this._socket.on('close', function () {
                _this.emit('exit', _this._agent.exitCode);
                _this._close();
            });
        });
        _this._file = file;
        _this._name = name;
        _this._readable = true;
        _this._writable = true;
        _this._forwardEvents();
        return _this;
    }
    WindowsTerminal.prototype._write = function (data) {
        this._defer(this._doWrite, data);
    };
    WindowsTerminal.prototype._doWrite = function (data) {
        this._agent.inSocket.write(data);
    };
    /**
     * openpty
     */
    WindowsTerminal.open = function (options) {
        throw new Error('open() not supported on windows, use Fork() instead.');
    };
    /**
     * TTY
     */
    WindowsTerminal.prototype.resize = function (cols, rows) {
        var _this = this;
        if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) {
            throw new Error('resizing must be done using positive cols and rows');
        }
        this._deferNoArgs(function () {
            _this._agent.resize(cols, rows);
            _this._cols = cols;
            _this._rows = rows;
        });
    };
    WindowsTerminal.prototype.clear = function () {
        var _this = this;
        this._deferNoArgs(function () {
            _this._agent.clear();
        });
    };
    WindowsTerminal.prototype.destroy = function () {
        var _this = this;
        this._deferNoArgs(function () {
            _this.kill();
        });
    };
    WindowsTerminal.prototype.kill = function (signal) {
        var _this = this;
        this._deferNoArgs(function () {
            if (signal) {
                throw new Error('Signals not supported on windows.');
            }
            _this._close();
            _this._agent.kill();
        });
    };
    WindowsTerminal.prototype._deferNoArgs = function (deferredFn) {
        var _this = this;
        // If the terminal is ready, execute.
        if (this._isReady) {
            deferredFn.call(this);
            return;
        }
        // Queue until terminal is ready.
        this._deferreds.push({
            run: function () { return deferredFn.call(_this); }
        });
    };
    WindowsTerminal.prototype._defer = function (deferredFn, arg) {
        var _this = this;
        // If the terminal is ready, execute.
        if (this._isReady) {
            deferredFn.call(this, arg);
            return;
        }
        // Queue until terminal is ready.
        this._deferreds.push({
            run: function () { return deferredFn.call(_this, arg); }
        });
    };
    Object.defineProperty(WindowsTerminal.prototype, "process", {
        get: function () { return this._name; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsTerminal.prototype, "master", {
        get: function () { throw new Error('master is not supported on Windows'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WindowsTerminal.prototype, "slave", {
        get: function () { throw new Error('slave is not supported on Windows'); },
        enumerable: false,
        configurable: true
    });
    return WindowsTerminal;
}(terminal_1.Terminal));
exports.WindowsTerminal = WindowsTerminal;
//# sourceMappingURL=windowsTerminal.js.map

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

"use strict";
module.exports = require("child_process");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

"use strict";
module.exports = require("electron");

/***/ },

/***/ "events"
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
(module) {

"use strict";
module.exports = require("events");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("fs");

/***/ },

/***/ "net"
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
(module) {

"use strict";
module.exports = require("net");

/***/ },

/***/ "node:fs"
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
(module) {

"use strict";
module.exports = require("node:fs");

/***/ },

/***/ "node:https"
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
(module) {

"use strict";
module.exports = require("node:https");

/***/ },

/***/ "node:os"
/*!**************************!*\
  !*** external "node:os" ***!
  \**************************/
(module) {

"use strict";
module.exports = require("node:os");

/***/ },

/***/ "node:path"
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
(module) {

"use strict";
module.exports = require("node:path");

/***/ },

/***/ "os"
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("os");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("path");

/***/ },

/***/ "tty"
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
(module) {

"use strict";
module.exports = require("tty");

/***/ },

/***/ "util"
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("util");

/***/ },

/***/ "vm"
/*!*********************!*\
  !*** external "vm" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("vm");

/***/ },

/***/ "worker_threads"
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
(module) {

"use strict";
module.exports = require("worker_threads");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __webpack_require__ !== 'undefined') __webpack_require__.ab = __dirname + "/native_modules/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
const { app, BrowserWindow, ipcMain, dialog } = __webpack_require__(/*! electron */ "electron");
const path = __webpack_require__(/*! node:path */ "node:path");
const fs = __webpack_require__(/*! node:fs */ "node:fs");
const https = __webpack_require__(/*! node:https */ "node:https");
const os = __webpack_require__(/*! node:os */ "node:os");
const { spawn } = __webpack_require__(/*! child_process */ "child_process");
const vm = __webpack_require__(/*! vm */ "vm");
const nodePty = __webpack_require__(/*! node-pty */ "./node_modules/node-pty/lib/index.js");
const { Client } = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module 'ssh2'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

if (__webpack_require__(/*! electron-squirrel-startup */ "./node_modules/electron-squirrel-startup/index.js")) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: '/home/yuni/.openclaw/workspace/maxi-desktop/.webpack/renderer/main_window/preload.js',
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL('http://localhost:3000/main_window/index.html');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const MAXI_TOKENS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'tokens');
const MAXI_SKILLS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'skills');
const MAXI_SSH_CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'ssh-config.json');
const MAXI_CHAT_HISTORY_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'chat-history');
const MAXI_AUTO_SAVE_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'autosave.json');

let sshClient = null;
let currentSshConnection = null;
let sshShell = null;

function loadDirectoryContents(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const contents = {};
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(dirPath, file.name);
        contents[file.name] = fs.readFileSync(filePath, 'utf-8');
      } else if (file.isDirectory()) {
        const subDirPath = path.join(dirPath, file.name);
        contents[file.name] = loadDirectoryContents(subDirPath);
      }
    }
    return contents;
  } catch (error) {
    console.error(`Error loading ${dirPath}:`, error);
    return [];
  }
}

ipcMain.handle('load-tokens', () => {
  return loadDirectoryContents(MAXI_TOKENS_PATH);
});

ipcMain.handle('load-skills', () => {
  return loadDirectoryContents(MAXI_SKILLS_PATH);
});

function loadSshConfig() {
  try {
    if (!fs.existsSync(MAXI_SSH_CONFIG_PATH)) {
      return [];
    }
    const data = fs.readFileSync(MAXI_SSH_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading SSH config:', error);
    return [];
  }
}

function saveSshConfig(config) {
  try {
    const dir = path.dirname(MAXI_SSH_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MAXI_SSH_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving SSH config:', error);
    return false;
  }
}

ipcMain.handle('ssh-load-connections', () => {
  return loadSshConfig();
});

ipcMain.handle('ssh-save-connection', (event, connection) => {
  const config = loadSshConfig();
  const existingIndex = config.findIndex(c => c.id === connection.id);
  if (existingIndex >= 0) {
    config[existingIndex] = connection;
  } else {
    connection.id = Date.now().toString();
    config.push(connection);
  }
  return saveSshConfig(config);
});

ipcMain.handle('ssh-delete-connection', (event, connectionId) => {
  const config = loadSshConfig();
  const filtered = config.filter(c => c.id !== connectionId);
  return saveSshConfig(filtered);
});

ipcMain.handle('ssh-connect', async (event, connection) => {
  return new Promise((resolve, reject) => {
    if (sshClient) {
      sshClient.end();
      sshClient = null;
    }

    sshClient = new Client();

    const connectionConfig = {
      host: connection.host,
      port: connection.port || 22,
      username: connection.username,
      readyTimeout: 30000,
    };

    if (connection.authMethod === 'password') {
      connectionConfig.password = connection.password;
    } else {
      try {
        connectionConfig.privateKey = fs.readFileSync(connection.privateKey);
        if (connection.passphrase) {
          connectionConfig.passphrase = connection.passphrase;
        }
      } catch (err) {
        reject(new Error('Failed to read private key: ' + err.message));
        return;
      }
    }

    sshClient.on('ready', () => {
      currentSshConnection = connection;
      sshClient.shell((err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        sshShell = stream;
        stream.on('data', (data) => {
          mainWindow.webContents.send('ssh-data', data.toString('utf-8'));
        });
        stream.on('close', () => {
          mainWindow.webContents.send('ssh-close');
          sshShell = null;
          if (sshClient) {
            sshClient.end();
            sshClient = null;
          }
          currentSshConnection = null;
        });
        resolve({ success: true });
      });
    });

    sshClient.on('error', (err) => {
      console.error('SSH connection error:', err);
      mainWindow.webContents.send('ssh-error', err.message);
      reject(err);
    });

    sshClient.on('close', () => {
      mainWindow.webContents.send('ssh-close');
      sshShell = null;
      currentSshConnection = null;
    });

    sshClient.connect(connectionConfig);
  });
});

ipcMain.handle('ssh-write', (event, data) => {
  if (sshShell) {
    sshShell.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('ssh-disconnect', () => {
  if (sshClient) {
    sshClient.end();
    sshClient = null;
    sshShell = null;
    currentSshConnection = null;
    return true;
  }
  return false;
});

ipcMain.handle('ssh-select-key', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Select Private Key',
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('get-home-path', () => {
  return os.homedir();
});

ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Workspace Folder'
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

function buildFileTree(dirPath, relativePath = '') {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const tree = [];
    
    const sortedItems = items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const item of sortedItems) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
      
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        let icon = 'file';
        
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          icon = 'javascript';
        } else if (['.json'].includes(ext)) {
          icon = 'json';
        } else if (['.html', '.htm'].includes(ext)) {
          icon = 'html';
        } else if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
          icon = 'css';
        } else if (['.md', '.markdown'].includes(ext)) {
          icon = 'markdown';
        } else if (['.py'].includes(ext)) {
          icon = 'python';
        } else if (['.java'].includes(ext)) {
          icon = 'java';
        } else if (['.cpp', '.c', '.h', '.hpp'].includes(ext)) {
          icon = 'cpp';
        } else if (['.go'].includes(ext)) {
          icon = 'go';
        } else if (['.rs'].includes(ext)) {
          icon = 'rust';
        } else if (['.sql'].includes(ext)) {
          icon = 'database';
        } else if (['.sh', '.bash'].includes(ext)) {
          icon = 'terminal';
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
          icon = 'image';
        } else if (['.pdf'].includes(ext)) {
          icon = 'pdf';
        } else if (['.zip', '.tar', '.gz', '.rar'].includes(ext)) {
          icon = 'archive';
        } else if (['.env', '.gitignore', '.npmrc'].includes(item.name)) {
          icon = 'config';
        }
        
        tree.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'file',
          icon
        });
      } else if (item.isDirectory()) {
        const children = buildFileTree(itemPath, itemRelativePath);
        tree.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'directory',
          icon: 'folder',
          children
        });
      }
    }
    
    return tree;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

ipcMain.handle('read-directory', (event, dirPath) => {
  return buildFileTree(dirPath);
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) {
      return { error: 'File too large', size: stats.size };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, size: stats.size };
  } catch (error) {
    return { error: error.message };
  }
});

let totalTokens = 0;

ipcMain.handle('stream-chat', async (event, { messages, apiKey, model }) => {
  const targetModel = model || 'MiniMax-M2.7';
  const postData = JSON.stringify({
    model: targetModel,
    messages,
    stream: true
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.minimax.io',
      path: '/anthropic/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let buffer = '';
      let chunkOffset = 0;
      let inputTokens = 0;
      let outputTokens = 0;

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              mainWindow.webContents.send('chat-complete');
              totalTokens += outputTokens;
              mainWindow.webContents.send('token-usage', { 
                input: inputTokens, 
                output: outputTokens,
                total: totalTokens 
              });
              resolve({ done: true, inputTokens, outputTokens });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                if (parsed.delta.type === 'text_delta') {
                  mainWindow.webContents.send('chat-stream', parsed.delta.text);
                  chunkOffset += parsed.delta.text.length;
                  if (parsed.usage) {
                    inputTokens = parsed.usage.input_tokens || 0;
                    outputTokens = parsed.usage.output_tokens || 0;
                  }
                } else if (parsed.delta.type === 'thinking_delta') {
                  mainWindow.webContents.send('chat-thinking', parsed.delta.text);
                }
              } else if (parsed.type === 'message_delta') {
                if (parsed.usage) {
                  inputTokens = parsed.usage.input_tokens || 0;
                  outputTokens = parsed.usage.output_tokens || 0;
                }
                mainWindow.webContents.send('chat-complete');
                totalTokens += outputTokens;
                mainWindow.webContents.send('token-usage', { 
                  input: inputTokens, 
                  output: outputTokens,
                  total: totalTokens 
                });
                resolve({ done: true, inputTokens, outputTokens });
              } else if (parsed.type === 'message_start') {
                if (parsed.message?.usage) {
                  inputTokens = parsed.message.usage.input_tokens || 0;
                }
              }
            } catch (e) {
            }
          }
        }
      });

      res.on('end', () => {
        mainWindow.webContents.send('chat-complete');
        resolve({ done: true });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
});

const runningProcesses = new Map();
let terminalPty = null;

const EXECUTION_TIMEOUT = 30000;

ipcMain.handle('execute-code', async (event, { language, code, executionId }) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let processRef = null;

    const cleanup = () => {
      if (processRef) {
        try {
          processRef.kill('SIGTERM');
        } catch (e) {}
        processRef = null;
      }
      runningProcesses.delete(executionId);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        stdout,
        stderr: stderr + '\n[TIMEOUT: Execution exceeded 30 seconds]',
        exitCode: -1,
        duration: Date.now() - startTime
      });
    }, EXECUTION_TIMEOUT);

    runningProcesses.set(executionId, { kill: cleanup });

    try {
      if (language === 'javascript' || language === 'js') {
        const log = { stdout: [], stderr: [] };
        const sandbox = {
          console: {
            log: (...args) => log.stdout.push(args.map(String).join(' ')),
            error: (...args) => log.stderr.push(args.map(String).join(' ')),
            warn: (...args) => log.stdout.push('[WARN] ' + args.map(String).join(' ')),
            info: (...args) => log.stdout.push('[INFO] ' + args.map(String).join(' ')),
          },
          setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5000)),
          setInterval: (fn, ms) => setInterval(fn, Math.min(ms, 5000)),
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          RegExp,
          Error,
          Map,
          Set,
          Promise
        };

        try {
          const script = new vm.Script(code);
          const context = vm.createContext(sandbox);
          script.runInContext(context, { timeout: 10000 });
          
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: log.stderr.length === 0,
            stdout: log.stdout.join('\n'),
            stderr: log.stderr.join('\n'),
            exitCode: 0,
            duration: Date.now() - startTime
          });
        } catch (err) {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout: log.stdout.join('\n'),
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        }

      } else if (language === 'python' || language === 'py') {
        processRef = spawn('python3', ['-c', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else if (language === 'node' || language === 'nodejs') {
        processRef = spawn('node', ['-e', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else if (language === 'bash' || language === 'shell' || language === 'sh') {
        processRef = spawn('/bin/sh', ['-c', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else {
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          success: false,
          stdout: '',
          stderr: `Unsupported language: ${language}`,
          exitCode: 1,
          duration: Date.now() - startTime
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      cleanup();
      resolve({
        success: false,
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        duration: Date.now() - startTime
      });
    }
  });
});

ipcMain.handle('stop-execution', (event, executionId) => {
  const proc = runningProcesses.get(executionId);
  if (proc) {
    proc.kill();
    runningProcesses.delete(executionId);
    return true;
  }
  return false;
});

ipcMain.handle('create-terminal', (event, { cols, rows }) => {
  if (terminalPty) {
    try {
      terminalPty.kill();
    } catch (e) {}
  }
  
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const shellArgs = process.platform === 'win32' ? [] : ['--login'];
  
  terminalPty = nodePty.spawn(shell, shellArgs, {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: os.homedir(),
    env: process.env
  });
  
  terminalPty.onData((data) => {
    mainWindow.webContents.send('terminal-data', data);
  });
  
  terminalPty.onExit(({ exitCode }) => {
    mainWindow.webContents.send('terminal-exit', exitCode);
    terminalPty = null;
  });
  
  return { success: true };
});

ipcMain.handle('write-terminal', (event, data) => {
  if (terminalPty) {
    terminalPty.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('resize-terminal', (event, { cols, rows }) => {
  if (terminalPty) {
    try {
      terminalPty.resize(cols, rows);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
});

ipcMain.handle('kill-terminal', () => {
  if (terminalPty) {
    try {
      terminalPty.kill();
      terminalPty = null;
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
});

function ensureChatHistoryDir() {
  if (!fs.existsSync(MAXI_CHAT_HISTORY_PATH)) {
    fs.mkdirSync(MAXI_CHAT_HISTORY_PATH, { recursive: true });
  }
}

function generateChatId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

ipcMain.handle('save-chat', async (event, chatData) => {
  try {
    ensureChatHistoryDir();
    const id = chatData.id || generateChatId();
    const now = new Date().toISOString();
    const title = chatData.title || (chatData.messages?.[0]?.content?.substring(0, 50) || 'Untitled') + '...';
    
    const chat = {
      id,
      title,
      created: chatData.created || now,
      updated: now,
      messages: chatData.messages || []
    };
    
    const filename = `${id}.json`;
    const filepath = path.join(MAXI_CHAT_HISTORY_PATH, filename);
    fs.writeFileSync(filepath, JSON.stringify(chat, null, 2));
    
    return { success: true, id, filepath };
  } catch (error) {
    console.error('Error saving chat:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-chat-history', async () => {
  try {
    ensureChatHistoryDir();
    const files = fs.readdirSync(MAXI_CHAT_HISTORY_PATH);
    const chats = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(MAXI_CHAT_HISTORY_PATH, file);
          const content = fs.readFileSync(filepath, 'utf-8');
          const chat = JSON.parse(content);
          chats.push({
            id: chat.id,
            title: chat.title,
            created: chat.created,
            updated: chat.updated,
            messageCount: chat.messages?.length || 0
          });
        } catch (e) {
          console.error('Error reading chat file:', file, e);
        }
      }
    }
    
    chats.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    return chats;
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
});

ipcMain.handle('load-chat', async (event, chatId) => {
  try {
    const filepath = path.join(MAXI_CHAT_HISTORY_PATH, `${chatId}.json`);
    if (!fs.existsSync(filepath)) {
      return { success: false, error: 'Chat not found' };
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    const chat = JSON.parse(content);
    return { success: true, chat };
  } catch (error) {
    console.error('Error loading chat:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-chat', async (event, chatId) => {
  try {
    const filepath = path.join(MAXI_CHAT_HISTORY_PATH, `${chatId}.json`);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-chat', async (event, { chatId, newTitle }) => {
  try {
    const filepath = path.join(MAXI_CHAT_HISTORY_PATH, `${chatId}.json`);
    if (!fs.existsSync(filepath)) {
      return { success: false, error: 'Chat not found' };
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    const chat = JSON.parse(content);
    chat.title = newTitle;
    chat.updated = new Date().toISOString();
    fs.writeFileSync(filepath, JSON.stringify(chat, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error renaming chat:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-autosave', async (event, chatData) => {
  try {
    const now = new Date().toISOString();
    const autosave = {
      id: chatData.id || generateChatId(),
      title: chatData.title || (chatData.messages?.[0]?.content?.substring(0, 50) || 'Untitled') + '...',
      updated: now,
      messages: chatData.messages || []
    };
    fs.writeFileSync(MAXI_AUTO_SAVE_PATH, JSON.stringify(autosave, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving autosave:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-autosave', async () => {
  try {
    if (!fs.existsSync(MAXI_AUTO_SAVE_PATH)) {
      return null;
    }
    const content = fs.readFileSync(MAXI_AUTO_SAVE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading autosave:', error);
    return null;
  }
});

ipcMain.handle('clear-autosave', async () => {
  try {
    if (fs.existsSync(MAXI_AUTO_SAVE_PATH)) {
      fs.unlinkSync(MAXI_AUTO_SAVE_PATH);
    }
    return { success: true };
  } catch (error) {
    console.error('Error clearing autosave:', error);
    return { success: false, error: error.message };
  }
});
})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map