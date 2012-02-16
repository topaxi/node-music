var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , Playlist = require('./playlist')

var User = module.exports = new Schema()

User.add({
    // If we're logging in through browserid.org, our name will be empty
    'name':      { type: String, trim: true, index: { unique: true } }
  , 'email':     { type: String, required: true, trim: true, index: { unique: true } }
  , 'password':  String
  , 'salt':      String
  , 'active':    Boolean
  , 'admin':     Boolean
  , 'joined':    Date
  , 'playlists': [Playlist]
})
