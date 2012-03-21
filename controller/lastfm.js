var lfm  = require('../lib/lastfm')
  , User = require('../lib/model/user')

lfm.setAPIKey('967ce1901a718b229e7795a485666a1e')
lfm.setSecret('481afa56ce326649a15b9f584060a695')

module.exports = function(http) {
  http.get('/lastfm/track/getInfo', function(req, res) {
    var query = { track: req.query.track, artist: req.query.artist }

    lfm.Track.getInfo(query, function(err, data) {
      res.send(err || data.track)
    })
  })

  http.get('/lastfm/auth', function(req, res, next) {
    lfm.Auth.getSession({'token': req.query.token}, function(err, data) {
      if (err) return next(err)

      var user = req.session.user

      user.lastfm.session  = data.session.key
      user.lastfm.username = data.session.name

      req.session.user = user // halp?

      User.findById(req.session.user._id, function(err, user) {
        user.lastfm.session  = data.session.key
        user.lastfm.username = data.session.name

        user.save(function(err) {
          console.log(err)
        })

        res.redirect('/')
      })
    })
  })

  http.get('/lastfm/nowplaying', function(req, res, next) {
    var q      = req.query
      , user   = req.session.user
      , params = { 'track':   q.title
                 , 'artist':  q.artist
                 , 'sk':      user.lastfm.session
                 }

    if (q.album)    params.album       = q.album
    if (q.number)   params.trackNumber = q.number
    if (q.duration) params.duration    = q.duration >>> 0

    lfm.Track.updateNowPlaying(params, function(err, data) {
      if (err) return next(err)

      res.send(data.nowplaying.track)
    })
  })

  http.get('/lastfm/scrobble', function(req, res) {
    var q      = req.query
      , user   = req.session.user
      , params = { 'track':     q.title
                 , 'artist':    q.artist
                 , 'timestamp': Math.round(q.date / 1000)
                 , 'sk':        user.lastfm.session
                 }

    if (q.album)    params.album       = q.album
    if (q.number)   params.trackNumber = q.number
    if (q.duration) params.duration    = q.duration >>> 0

    lfm.Track.scrobble(params, function(err, data) {
      // TODO: Save failed scrobbles and scrobble them later as a batch
      if (err) return next(err)

      res.send(data.scrobbles)
    })
  })
}
