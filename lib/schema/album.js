var mongoose = require('mongoose')
  , Schema   = mongoose.Schema

var Album = module.exports = new Schema()

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
