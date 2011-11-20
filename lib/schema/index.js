var mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1/node-music', function(err) {
  if (err) throw err
})

exports.Track  = require('./track')
exports.Artist = require('./artist')
exports.Album  = require('./album')
exports.User   = require('./user')
