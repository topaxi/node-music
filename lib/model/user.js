var mongoose = require('mongoose')
  , Schema   = require('../schema')

var User = module.exports = mongoose.model('User', Schema.User)
