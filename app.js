#!/usr/bin/env node-streamline

/**
 * Module dependencies.
 */

var express = require('express')

var app = module.exports = express.createServer()

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.bodyParser())
  app.use(express.cookieParser())
  app.use(express.session({ 'secret': '$4$NITNkk8x$zAHV2426ynd3JgcNfduT5DtxFxY$' }))
  app.use(express.methodOverride())
  app.use(require('./lib/middleware/browser.js'))
  app.use(app.router)
  app.use(require('./lib/middleware/download.js'))
  app.use(require('./lib/middleware/duration.js'))
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
})

app.configure('production', function(){
  app.use(express.errorHandler()) 
})

controller('index')

app.listen(3000)
console.log("Express server listening on port %d in %s mode",
  app.address().port, app.settings.env)

function controller(c) {
  require('./controller/'+ c)(app)
}
