var mongoose = require('mongoose')
  , Schema   = require('../schema')

var Artist = module.exports = mongoose.model('Artist', Schema.Artist)
