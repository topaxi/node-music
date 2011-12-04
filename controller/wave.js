var fs         = require('fs')
  , path       = require('path')
  , Track      = require('../lib/model/Track')
  , getWavInfo = require('../lib/convert').getWavInfo
  , config     = require('../config.json')

module.exports = function(http) {
  http.get('/wave/:trackId.png', function(req, res) {
    var pngPath = path.normalize(__dirname +'/../public/wave/'+ req.params.trackId +'.png')

    fileExists(pngPath, function(err, exists) {
      if (err) throw err

      if (exists) {
        res.sendfile(pngPath)
      }
      else {
        Track.findById(req.params.trackId, function(err, track) {
          if (err) throw err

          getWavInfo(__dirname +'/../public'+ track.path, function(err, wave) {
            if (err) throw err

            track.drawWaveform(wave, config.waveform, function(err, waveform) {
              if (err) throw err

              res.sendfile(waveform)
            })
          })
        })
      }
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
