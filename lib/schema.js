var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

mongoose.connect('mongodb://127.0.0.1/node-music', function(err) {
  if (err) throw err
})

var User = exports.User = new Schema()

User.add({
    'name':      { type: String, required: true, trim: true, index: { unique: true } }
  , 'email':     { type: String, required: true, trim: true, index: { unique: true } }
  , 'password':  String
  , 'salt':      String
  , 'active':    Boolean
  , 'joined':    Date
  , 'playlists': [Playlist]
})

var Album = exports.Album = new Schema()

Album.add({
    'title':   { type: String, trim: true, required: true }
  // Need an unique identifier for an album...
  , 'path':    { type: String, required: true }
  , 'release': Number
  // Tracks now got a reference to the album
  //, 'tracks':  [{ type: ObjectId, ref: 'Track' }]
  , 'tags':    [String]
  , 'cover':   String
})

// Unique key, works for unsorted albums too
Album.index({ 'title': 1, 'path': 1 }, { unique: true })

var Artist = exports.Artist = new Schema()

Artist.add({
    'name':   { type: String, trim: true, required: true, index: { unique: true } }
  , 'albums': [{ type: ObjectId, ref: 'Album' }] // Should only list artists albums not compilations
  , 'tags':   [String]
})

var Track = exports.Track = new Schema()

Track.add({
    'title':    { type: String, required: true, trim: true }
  , 'path':     { type: String, required: true, index: { unique: true } }
  , 'artists':  [{ type: ObjectId, ref: 'Artist' }]
  , 'remixes':  [{ type: ObjectId, ref: 'Track'  }]
  , 'album':    { type: ObjectId, ref: 'Album' }
  , 'duration': Number
  , 'genres':   [String]
  , 'tags':     [String]
  , 'year':     String
})

var Playlist = exports.Playlist = new Schema()

Playlist.add({
    'name':    { type: String, required: true, trim: true }
  , 'tracks':  [{ type: ObjectId, ref: 'Track' }]
  , 'filters': []
})
