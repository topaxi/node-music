;(function(window) { 'use strict'

require.config({
    baseUrl: '/theme/'+ nm.theme +'/js'
  , paths: { 'utils':      '/js/utils'
           , 'player':     '/js/player'
           , 'md5':        '/js/lib/crypto-md5-3.1.2.min'
           , 'underscore': '/js/lib/lodash-1.0.0.min'
           , 'backbone':   '/js/lib/backbone-0.9.10.min'
           , 'superagent': '/js/lib/superagent.min'
           , 'jquery':     [ '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min'
                           , '/js/lib/jquery-1.9.1.min'
                           ]
           , 'theme':      '/theme/'+ nm.theme +'/main'
           }
  , shim: { 'superagent': { exports: 'superagent' }
          , 'backbone':   { exports: 'Backbone', deps: [ 'underscore', 'jquery' ] }
          , 'md5':        { exports: 'CryptoJS.MD5' }
          // using lodash, which is requirejs compatible
          //, 'underscore': { exports: '_' }
          }
})

// Prevent browsers from dieing if there is no console and some calls
// slipped into live code
if (!window.console) window.console = { log: function() { } }

require(['superagent', 'utils', 'player', 'theme'], function(utils) {
  utils.login.whoami()
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
