var mongoose = require('mongoose')
  , Schema   = require('../schema')

var Playlist = module.exports = mongoose.model('Playlist', Schema.Playlist)
