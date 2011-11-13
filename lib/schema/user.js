var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , Playlist = require('./playlist')

var User = module.exports = new Schema()

User.add({
    'name':      { type: String, required: true, trim: true, index: { unique: true } }
  , 'email':     { type: String, required: true, trim: true, index: { unique: true } }
  , 'password':  String
  , 'salt':      String
  , 'active':    Boolean
  , 'joined':    Date
  , 'playlists': [Playlist]
})
