define('utils', ['global', 'eventemitter', 'superagent'],
  function(window, EventEmitter, request) { 'use strict';

var document  = window.document
  , location  = window.location
  , navigator = window.navigator
  , utils     = {}
  , Query     = {}

utils.bind = function(el, events, fun) {
  if (!el) return

  events = events.split(' ')

  for (var i = 0, l = events.length; i < l; ++i) {
    el.addEventListener(events[i], fun, false)
  }

  return el
}

Query.get = function(n) {
  if (location.hash.length <= 1) return null

  return utils.fromQuery(location.hash.slice(1))[n]
}

Query.set = function(n, v) {
  var query = utils.fromQuery(location.hash.slice(1))

  if (v === null || v === undefined) {
    delete query[n]
  }
  else {
    query[n] = v
  }

  location.hash = utils.toQuery(query)

  return this
}

utils.Query = Query
utils.fromQuery = function fromQuery(q) {
  if (!(q = q.trim())) return {}

  return q.split('&').reduce(function(a, b) {
    var matches

    b = b.split('=')

    if (matches = /^(.+?)\[(.*?)]$/.exec(b[0])) {
      if (typeof a[matches[1]] == 'undefined') a[matches[1]] = {}

      a[matches[1]][matches[2]] = b.length == 2 ? b[1] : true
    }
    else {
      a[b[0]] = b.length == 2 ? b[1] : true
    }

    return a
  }, {})
}

// Using jQuery for now
utils.toQuery = function() { return jQuery.param.apply(jQuery, arguments) }

utils.pad = function pad(n, d) {
  for (n = ''+ (n >>> 0); n.length < d;) n = '0'+ n; return n
}

utils.formatTime = function formatTime(seconds) {
  var m = seconds < 0

  if (m) seconds = Math.abs(seconds)

  return (m ? '-' : '') + utils.pad(seconds / 60, 2) +':'+ utils.pad(seconds % 60, 2)
}

utils.throttle = function(fun, delay) {
  var timer

  return function(a) {
    var argv    = arguments
      , context = this

    if (!timer) timer = setTimeout(function() {
      var argc = argv.length

      // Function#apply is more expensive than Function#call.
      // Most of the time, throttle is called for events which
      // pass only one argument, use Function#call for those :)
      if (argc > 1)  fun.apply(context, argv)
      else if (argc) fun.call(context, a)
      else           fun.call(context)

      timer = 0
    }, delay)
  }
}

utils.gravatar = {}
utils.gravatar.getAvatar = function(email, size, fn) {
  email += ''

  require(['md5'], function(md5) {
    fn('http://www.gravatar.com/avatar/' +
      md5(email.trim().toLowerCase()) +
      "?s=" + (+size || 32)
    )
  })
}

var login = utils.login = new EventEmitter

login.show = function() {
  require(['https://browserid.org/include.js'], function() {
    navigator.id.getVerifiedEmail(function(assertion) {
      if (!assertion) {
        login.emit('loggedOut')

        return
      }

      request.post('/login')
             .send({ 'assertion': assertion })
             .end(function(res) {
               if (!res) return login.emit('loggedOut')

               login.loggedIn = true
               login.user     = res.body

               login.emit('loggedIn', res)
             })
    })
  })
}

login.whoami = function() {
  login.loggedIn = false

  request.post('/login/whoami', null, function(res) {
    if (res.error) return login.emit('error', res)
    if (!res.body) return login.emit('loggedOut')

    login.loggedIn = true
    login.user     = res.body
    login.emit('loggedIn', res, true)
  })
}

utils.bind(document, 'login', login.show)

utils.bind(document, 'logout', function(e) {
  request.post('/login/logout', function(res) {
    login.emit('loggedOut')
  })
})

utils.truncate = function truncate(str, limit, breakword, pad) {
  var breakpoint

  if (typeof str !== 'string' || str.length <= limit) return str

  breakword = breakword !== undefined ? breakword : ''
  pad       = pad       !== undefined ? pad       : '\u2026'

  if (~(breakpoint = str.indexOf(breakword, limit))) {
    if (breakpoint < str.length - 1) {
      return str.substr(0, breakpoint) + pad
    }
  }

  return str
}

return utils

})
