var config = require('./config.json')

///////////////////////////////////////////////////////////////////////////////

var fs         = require('fs')
  , path       = require('path')
  , mmd        = require('musicmetadata')
  , flows      = require('streamline/lib/util/flows')
  , future     = require('streamline/lib/util/future').future
  , readSync   = require('./lib/fs').recursiveReaddirSync
  , getWavInfo = require('./lib/convert').getWavInfo
  , fileFunnel = flows.funnel(20)
  , cpuFunnel  = flows.funnel(require('os').cpus().length - 1 || 1)

var Album  = require('./lib/model/album')
  , Artist = require('./lib/model/artist')
  , Track  = require('./lib/model/track')

  , albums  = {}
  , artists = {}
  , files   = []

readSync(config.library, function(err, path) {
  if (err) throw err

  files.push(path)
})

// Wrap getWavInfo for futures support
var _gwi = getWavInfo
getWavInfo = function(file, cb) {
  if (!cb) return future(_gwi, arguments);

  return _gwi.call(this, file, cb)
}

flows.each(_, files, function(_, path, i) {
  var prefix = i+1 +'/'+ files.length

  console.log('')
  console.log(prefix, 'importing', path)

  var track = getTrack(path, _)

  console.log(prefix, 'imported', track.path)

  if (!track.duration) {
    var wave = getWavInfo(path, _)

    if (!track.duration) {
      track.duration = wave.subchunk2Size / wave.byteRate

      console.log(prefix, 'saving track duration...')
      track.save(function(err) {
        if (err) throw err

        console.log(prefix, 'track duration of', track.duration, 'saved')
      })
    }
  }
})

function fileExists(file, _) {
  try {
    fs.stat(file, _)

    return true
  }
  catch (err) {
    if (err.code == 'ENOENT') return false

    throw err
  }
}

function getTrack(path, _) {
  // "./public" isn't available from the browser
  var trackPath = path.replace('./public', '')
    , track     = Track.findOne({ 'path': trackPath }, _)

  if (!config.forceTags && track) return track

  var tags    = readTags(path, _)
    , artists = getArtists(tags.artist, _)

  if (!track) track = new Track

  track.artists = artists
  track.path    = trackPath
  track.title   = tags.title
  track.genres  = tags.genre
  track.year    = tags.year

  if (!tags.album) {
    track.save(function() {})

    return track
  }

  var album = getAlbum(tags, _)

  track.album = album

  track.save(function() {})

  return track
}

function getAlbum(tags, cb) {
  if (albums[tags.album]) return cb(null, albums[tags.album])

  Album.findOne({'title': tags.album}, function(err, album) {
    if (!config.forceTags && (err || album)) return cb(err, album)

    if (!album) album = albums[tags.album] = new Album

    album.title = tags.album
    album.year  = tags.year
    album.path  = path.dirname(tags.path)
    album.save(function(err) { cb(err, album) })
  })
}

function getArtist(name, cb) {
  if (artists[name]) return cb(null, artists[name])

  Artist.findOne({'name': name}, function(err, artist) {
    if (!config.forceTags && (err || artist)) return cb(err, artist)

    if (!artist) artist = artists[name] = new Artist

    artist.name = name
    artist.save(function(err) { cb(err, artist) })
  })
}

function getArtists(names, cb) {
  var artists = []
    , l = names.length
    , c = l
    , i

  for (i = 0; i < l; ++i) {
    getArtist(names[i], function(err, artist) {
      if (err) cb(err)

      artists.push(artist)

      if (!--c) cb(null, artists)
    })
  }
}

function readTags(path, cb) {
  var s = fs.createReadStream(path)
    , p = new mmd(s)

  p.on('metadata', function(data) { cb(null, data) })
  p.on('done',     function(err)  { s.destroy(); if (err) cb(err) })
}
