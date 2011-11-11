;(function() {

function noop() { }

var window   = this
  , document = window.document
  , nm       = window.nm

nm.noop = function () { }

// Prevent browsers from dieing if there is no console and some calls
// slipped into live code
if (!window.console) window.console = { log: noop }

nm.el = function(name, className) {
  var el = document.createElement(name)

  if (className) el.className = className

  return el
}

require(['http://code.jquery.com/jquery-1.7.min.js', 'utils', 'player'], function() {
  require.config({ 'baseUrl': '/theme/'+ nm.theme +'/js' })

  require(['/theme/'+ nm.theme +'/main.js'])
})

}())
