var Track  = require('../lib/model/Track')
  , Artist = require('../lib/model/Artist')
  , Album  = require('../lib/model/Album')

module.exports = function(http) {
  http.get('/', function(req, res) {
    res.render('index', {
        'title': 'node-music'
      , 'theme': 'default'
    })
  })

  //http.get('/track', function(req, res) {
  //  Track.findOne({}).populate('artists').run(function(err, tracks) {
  //    res.send(track)
  //  })
  //})

  http.get('/track/random', function(req, res) {
    Track.find({}).populate('artists').run(function(err, tracks) {
      var rand = Math.random() * tracks.length
      res.send(tracks[~~rand])
    })
  })

  http.get('/tracks/all', function(req, res) {
    Track.find({})
         //.populate('artists')
         //.populate('album')
         .asc('title')
         //.asc('album.name')
         //.asc('artists.name')
         .run(function(err, tracks) {
            res.send(tracks)
          })
  })

  http.get('/artists/all', function(req, res) {
    Artist.find({})
          .asc('name')
          .run(function(err, artists) {
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
    Album.find({})
         .asc('title')
         .run(function(err, artists) {
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
