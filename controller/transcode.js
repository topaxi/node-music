var fs     = require('fs')
  , path   = require('path')
  , Track  = require('../lib/model/track')
  , config = require('../config.json').transcode

module.exports = function(http) {
  http.get('/transcodes/:trackId.:format', function(req, res, next) {
    var filePath = path.normalize(__dirname +'/../public/transcodes/'+ req.params.trackId +'.'+ req.params.format)
      , codec

    if (!config.codecs[req.params.format]) {
      return next('Unknown file format!')
    }

    fileExists(filePath, function(err, exists) {
      if (err || exists) return next(err)

      Track.findById(req.params.trackId, ['path'], function(err, track) {
        var ffmpeg = require('fluent-ffmpeg')

        var proc = new ffmpeg(path.normalize(__dirname +'/../public'+ track.path))
          .renice(config.nice)
          .withAudioCodec(config.codecs[req.params.format])
          .withAudioBitrate(config.bitrate)
          .toFormat(req.params.format)

        proc.saveToFile(filePath, function(retcode, err) {
          next()
        })
      })
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
