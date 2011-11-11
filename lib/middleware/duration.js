var Track = require('../model/Track')

module.exports = function(req, res, next) {
  if (!~req.originalUrl.indexOf('/music')) {
    return next()
  }

  Track.findOne({ 'path': req.originalUrl }, function(err, track) {
    if (err || !track) return next()

    if (typeof track.duration != 'undefined' && track.duration > 0) {
      res.setHeader('X-Content-Duration', track.duration)
    }

    next()
  })
}
