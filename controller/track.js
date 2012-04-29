var Track  = require('../lib/model/track')
  , Artist = require('../lib/model/artist')
  , Album  = require('../lib/model/album')

module.exports = function(http) {
  http.post('/track/update', function(req, res, next) {
    if (!req.session.user || !req.session.user.admin) {
      return next({'message': 'Permission denied!'})
    }

    var track = req.body

    //track.remixes = track.remixes.filter(filterEmpty)
    track.genres  = track.genres .filter(filterEmpty)
    track.tags    = track.tags   .filter(filterEmpty)
    //track.remixOf = track.remixOf || null
    //track.album   = track.album   || null
    track.number  = track.number  || null
    track.year    = track.year    || null

    getArtist(track.artists[0], function(err, artist) {
      if (err) return next(err)

      track.artists[0] = artist

      var id = track._id

      // Prevent MongoError: Mod on _id not allowed
      delete track._id

      Track.update({ '_id': id }, track, { 'multi': false }, function(err) {
        if (err) return next(err)

        Track.findById(id, function(err, track) {
          if (err) return next(err)

          res.send(track)
        })
      })
    })
  })
}

function filterEmpty(val) {
  return val
}

// TODO: Some of these are copied from import.js
// Get or create artist by name
function getArtist(name, cb) {
  Artist.findOne({'name': name}, function(err, artist) {
    if (err || artist) return cb(err, artist)

    if (!artist) {
      artist = new Artist
      artist.imported = Date.now()
    }

    artist.name     = name
    artist.save(function(err) { cb(err, artist) })
  })
}
