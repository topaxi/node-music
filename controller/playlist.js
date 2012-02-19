var Playlist = require('../lib/model/playlist')
  , User     = require('../lib/model/user')

module.exports = function(http) {
  http.get('/playlist/all', function(req, res) {
    if (req.session && req.session.user) {
      res.send(req.session.user.playlists)
    }
    else {
      res.send(false)
    }
  })

  http.post('/playlist/save', function(req, res) {
    if (!req.session || !req.session.user) return res.send(false)

    User.findById(req.session.user._id, function(err, user) {
      if (err) throw err

      req.session.user = user
      user.markModified('playlists')

      if (req.body) {
        var p        = req.body
          , playlist

        if (p._id && (playlist = user.playlists.id(p._id))) {
          playlist.name    = p.name
          playlist.filters = p.filters

          playlist.tracks.length = 0

          p.tracks.forEach(function(track) {
            playlist.tracks.push(typeof track == 'string' ? track : track._id)
          })

          user.save(function() {
            req.session.user = user
            res.send(playlist._id)
          })
        }
        else {
          playlist = new Playlist
          playlist.name    = p.name
          playlist.tracks  = p.tracks
          playlist.filters = p.filters

          if (user.playlists) {
            user.playlists.push(playlist)
          }
          else {
            user.playlists = [playlist]
          }

          user.save(function() {
            req.session.user = user
            res.send(playlist._id)
          })
        }
      }
      else {
        res.send(false)
      }
    })
  })
}
