var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId

var Artist = module.exports = new Schema()

Artist.add({
    'name':     { type: String, trim: true, required: true, index: { unique: true } }
  , 'albums':   [{ type: ObjectId, ref: 'Album' }] // Should only list artists albums not compilations
  , 'tags':     [String]
  , 'imported': { type: Date, default: Date.now }
})
