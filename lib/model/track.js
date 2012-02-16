var mongoose = require('mongoose')
  , Schema   = require('../schema')

var Track = module.exports = mongoose.model('Track', Schema.Track)
