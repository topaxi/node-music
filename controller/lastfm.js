var lfm = require('../lib/lastfm')

lfm.setAPIKey('967ce1901a718b229e7795a485666a1e')

module.exports = function(http) {
  http.get('/lastfm/track/getInfo', function(req, res) {
    var query = { track: req.query.track, artist: req.query.artist }

    lfm.Track.getInfo(query, function(err, data) {
      res.send(err || data.track)
    })
  })
}
