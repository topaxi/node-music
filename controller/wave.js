var fs         = require('fs')
  , path       = require('path')
  , Track      = require('../lib/model/track')
  , getWavInfo = require('../lib/convert').getWavInfo
  , config     = require('../config.json')

module.exports = function(http) {
  http.get('/wave/:trackId-:r-:g-:b.png', function(req, res, next) {
    var trackId = req.params.trackId

      , r = parseInt(req.params.r, 10)
      , g = parseInt(req.params.g, 10)
      , b = parseInt(req.params.b, 10)

    if (isNaN(r) || isNaN(b) || isNaN(g)) {
      return next(new Error('Invalid color code'))
    }

    var pngPath = path.normalize(__dirname +'/../public/wave/'+ trackId +'-'+ r +'-'+ b +'-'+ g +'.png')

    fileExists(pngPath, function(err, exists) {
      if (err) return next(err)

      if (exists) {
        res.sendfile(pngPath)
      }
      else {
        var c = {
            'detail': config.waveform.detail
          , 'width':  config.waveform.width
          , 'height': config.waveform.height
          , 'color':  [r, g, b]
        }

        draw(trackId, c, function(err, waveform) {
          if (err) return next(err)

          res.sendfile(waveform)
        })
      }
    })
  })

  http.get('/wave/:trackId.png', function(req, res, next) {
    var pngPath = path.normalize(__dirname +'/../public/wave/'+ req.params.trackId +'.png')

    fileExists(pngPath, function(err, exists) {
      if (err) return next(err)

      if (exists) {
        res.sendfile(pngPath)
      }
      else {
        draw(req.params.trackId, config.waveform, function(err, waveform) {
          if (err) return next(err)

          res.sendfile(waveform)
        })
      }
    })
  })
}

function draw(trackId, config, cb) {
  Track.findById(trackId, function(err, track) {
    if (err) return cb(err)

    getWavInfo(__dirname +'/../public'+ track.path, function(err, wave) {
      if (err) return cb(err)

      track.drawWaveform(wave, config, cb)
    })
  })
}

function fileExists(path, cb) {
  fs.stat(path, function(err) {
    if (!err) return cb(null, true)

    if (err.code == 'ENOENT') return cb(null, false)

    return cb(err, null)
  })
}
