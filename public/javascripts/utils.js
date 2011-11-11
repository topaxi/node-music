;(function(undefined) {

var window         = this
  , document       = window.document
  , location       = window.location
  , XMLHttpRequest = window.XMLHttpRequest
  , JSON           = window.JSON
  , nm             = window.nm
  , Query          = {}

nm.bind = function(el, events, fun) {
  events = events.split(' ')

  for (var i = 0, l = events.length; i < l; ++i) {
    el.addEventListener(events[i], fun, false)
  }

  return el
}

nm.get = function(url, fun, type) {
  var req = new XMLHttpRequest

  req.open('GET', url, true)

  nm.bind(req, 'readystatechange', function () {
    if (req.readyState == 4) {
      if (req.status == 200) {
        fun(null, type == 'json' ? JSON.parse(req.responseText) : req.responseText)
      }
      else {
        fun(new Error(req.statusText))
      }
    }
  })

  req.send()

  return req
}

nm.getJSON = function(url, fun) { nm.get(url, fun, 'json') }

window.$$ = function $$(id) {
  return jQuery(document.getElementById(id))
}

nm.utils = {}

Query.get = function(n) {
  if (location.hash.length <= 1) return null

  return nm.utils.fromQuery(location.hash.slice(1))[n]
}

Query.set = function(n, v) {
  var query = nm.utils.fromQuery(location.hash.slice(1))

  if (v === null || v === undefined) {
    delete query[n]
  }
  else {
    query[n] = v
  }

  location.hash = nm.utils.toQuery(query)

  return this
}

nm.utils.Query = Query
nm.utils.fromQuery = function fromQuery(q) {
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
nm.utils.toQuery = function() { return jQuery.param.apply(jQuery, arguments) }

nm.utils.pad = function pad(n, d) {
  for (n = ''+ (n >>> 0); n.length < d;) n = '0'+ n; return n
}

nm.utils.formatTime = function formatTime(seconds) {
  var m = seconds < 0

  if (m) seconds = Math.abs(seconds)

  return (m ? '-' : '') + nm.utils.pad(seconds / 60, 2) +':'+ nm.utils.pad(seconds % 60, 2)
}

})()
