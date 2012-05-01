var Track  = require('../lib/model/track')
  , Artist = require('../lib/model/artist')
  , Album  = require('../lib/model/album')

module.exports = function(http) {
  http.get('/', function(req, res) {
    res.render('layout', {
        'title': 'node-music'
      , 'theme': req.browser.mobile ? 'mobile' : 'default'
    })
  })

  http.get('/tracks/all', function(req, res) {
    Track.find({}, function(err, tracks) {
      res.send(tracks)
    })
  })

  http.get('/artists/all', function(req, res) {
    Artist.find({}, function(err, artists) {
      res.send(artists)
    })
  })

  http.get('/tracks/artist/:id', function(req, res) {
    Track.find({'artists': req.params.id})
          .populate('artists')
          .populate('album')
          .asc('title')
          .run(function(err, artists) {
            res.send(artists)
          })
  })

  http.get('/albums/all', function(req, res) {
    Album.find({}, function(err, artists) {
      res.send(artists)
    })
  })

  http.get('/tracks/album/:id', function(req, res) {
    Track.find({'album': req.params.id})
          .populate('album')
          .populate('artists')
          .asc('title')
          .run(function(err, albums) {
            res.send(albums)
          })
  })
}
