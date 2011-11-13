var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var Track = module.exports = new Schema()

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
