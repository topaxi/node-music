var mongoose = require('mongoose')
  , Schema   = require('../schema')

var Album = module.exports = mongoose.model('Album', Schema.Album)
