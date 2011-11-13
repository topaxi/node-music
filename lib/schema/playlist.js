var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var Playlist = module.exports = new Schema()

Playlist.add({
    'name':    { type: String, required: true, trim: true }
  , 'tracks':  [{ type: ObjectId, ref: 'Track' }]
  , 'filters': []
})
