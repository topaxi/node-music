var mongoose   = require('mongoose')
  , path       = require('path')
  , Schema     = mongoose.Schema
  , ObjectId   = Schema.ObjectId
  , getWavInfo = require('../convert').getWavInfo
  , waveform   = require('../waveform')

var Track = module.exports = new Schema()

Track.add({
    'title':    { type: String, required: true, trim: true }
  , 'path':     { type: String, required: true, index: { unique: true } }
  , 'artists':  [{ type: ObjectId, ref: 'Artist' }]
  , 'remixes':  [{ type: ObjectId, ref: 'Track'  }]
  , 'album':    { type: ObjectId, ref: 'Album' }
  , 'number':   Number
  , 'duration': Number
  , 'genres':   [String]
  , 'tags':     [String]
  , 'year':     String
  , 'imported': { type: Date, default: Date.now }
})

Track.methods.drawWaveform = function(wave, options, cb) {
  var track = this

  if (arguments.length == 3) {
    draw(wave)
  }
  else {
    options = wave
    cb      = options

    getWavInfo(track.path, function(err, wave) {
      if (err) return cb(err)

      draw(wave)
    })
  }

  return this

  function draw(wave) {
    var pngPath = path.normalize(__dirname +'/../../public/wave/'+ track._id +'.png')

    options.detail = options.detail ||    5
    options.width  = options.width  || 1024
    options.height = options.height ||  128
    options.color  = options.color  || [0, 0, 0]

    waveform.draw(wave, options)
            .savePng(pngPath, 9, function(err) {
              if (err) return cb(err)

              cb(null, pngPath)
            })
  }
}
