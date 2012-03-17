;(function() {

var window   = this
  , document = window.document
  , nm       = window.nm

nm.noop = function noop() { }

// Prevent browsers from dieing if there is no console and some calls
// slipped into live code
if (!window.console) window.console = { log: nm.noop }

nm.el = function(name, className) {
  var el = document.createElement(name)

  if (className) el.className = className

  return el
}

var essentials = [ 'superagent.min'
                 , 'utils'
                 , 'player'
                 ]

require(essentials, function() {
  nm.request = window.superagent

  require.config({ 'baseUrl': '/theme/'+ nm.theme +'/js' })

  require(['/theme/'+ nm.theme +'/main.js'], function() {
    nm.utils.login.whoami()
  })
})

/*!
* EventEmitter
* Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>
* MIT Licensed
*/

// TODO: own library, since tons of my libs use this :D

/**
* Slice reference.
*/

var slice = [].slice

/**
* EventEmitter.
*/

function EventEmitter() {
  this.callbacks = {}
}

/**
* Listen on the given `event` with `fn`.
*
* @param {String} event
* @param {Function} fn
*/

EventEmitter.prototype.on = function(event, fn){
  (this.callbacks[event] = this.callbacks[event] || [])
    .push(fn)
  return this
}

/**
* Emit `event` with the given args.
*
* @param {String} event
* @param {Mixed} ...
*/

EventEmitter.prototype.emit = function(event){
  var args      = slice.call(arguments, 1)
    , callbacks = this.callbacks[event]

  if (callbacks) {
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      if (args.length) {
        callbacks[i].apply(this, args)
      }
      else {
        callbacks[i].call(this)
      }
    }
  }

  return this
}

nm.EventEmitter = EventEmitter

}())
