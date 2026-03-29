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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map