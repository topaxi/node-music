;(function(window) { 'use strict'

require.config({
  paths: { 'crypto-md5': '/javascripts/2.5.3-crypto-md5'
         }
})

var document   = window.document
  , superagent = window.superagent
  , noop       = function noop() { }

define('superagent', function() { return superagent })

// Prevent browsers from dieing if there is no console and some calls
// slipped into live code
if (!window.console) window.console = { log: noop }

require(['utils', 'player'], function(utils) {
  require.config({ 'baseUrl': '/theme/'+ nm.theme +'/js' })

  require(['/theme/'+ nm.theme +'/main.js'], function() {
    utils.login.whoami()
  })
})

/*!
* EventEmitter
* Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>
* MIT Licensed
*/

/**
 * Initialize a new `Emitter`.
 * 
 * @api public
 */

function Emitter() {
  this.callbacks = {};
};

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = function(event, fn){
  var callbacks = this.callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this.callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn);
  callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter} 
 */

Emitter.prototype.emit = function(event){
  var args = [].slice.call(arguments, 1)
    , callbacks = this.callbacks[event];

  if (callbacks) {
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args)
    }
  }

  return this;
};

define('eventemitter', function() {
  return nm.EventEmitter = Emitter
})

})(this)
