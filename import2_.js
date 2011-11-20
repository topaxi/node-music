var options = { 'library':   './public/music'
              , 'forceTags': false // force tag reading, currently broken
              , 'waveform':  { 'detail':   5 // higher means less detail
                             , 'width':  1024
                             , 'height':  128
                             , 'color': [0, 48, 160]
                             , 'overwrite': false
                             }
              }

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

var Album  = require('./lib/model/Album')
  , Artist = require('./lib/model/Artist')
  , Track  = require('./lib/model/Track')

  , albums  = {}
  , artists = {}
  , files   = []

readSync(options.library, function(err, path) {
  if (err) throw err

  files.push(path)
})

var count0r = 0

var _gwi = getWavInfo
getWavInfo = function(file, cb) {
  if (!cb) return future(_gwi, arguments);

  return _gwi.call(this, file, cb)
}

flows.each(_, files, function(_, path, i) {
  var prefix = i+1 +'/'+ files.length

  console.log('')
  console.log(prefix, 'importing', path)

  var tags = readTags(path, _)

  tags.path = path.replace('./public', '')

  var track = getTrack(tags, _)

  console.log(prefix, 'imported', track.path)

  var pngPath   = './public/wave/'+ track._id +'.png'
    , pngExists = options.waveform.overwrite ? false : fileExists(pngPath, _)

  if (!pngExists || !track.duration) {
    var wave = getWavInfo(path, _)

    if (!track.duration) {
      track.duration = wave.subchunk2Size / wave.byteRate

      console.log(prefix, 'saving track duration...')
      track.save(function() {
        console.log(prefix, 'track duration of', track.duration, 'saved')
      })
    }

    if (!pngExists) {
      console.log(prefix, 'drawing waveform...')
      track.drawWaveform(wave, options.waveform, function(err) {
        if (err) throw err

        console.log(prefix, 'waveform saved', pngPath)
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
    return false
  }
}

function getTrack(tags, cb) {
  Track.findOne({ 'path': tags.path }, function(err, track) {
    if (!options.forceTags && (err || track)) return cb(err, track)

    getArtists(tags.artist, function(err, artists) {
      if (err) return cb(err, track)

      if (!track) track = new Track

      track.artists = artists
      track.path    = tags.path
      track.title   = tags.title
      track.genres  = tags.genre
      track.year    = tags.year

      if (!tags.album) {
        return track.save(function(err) { cb(err, track) })
      }

      getAlbum(tags, function(err, album) {
        if (err) return cb(err, track)

        /// The album is now referenced on the track
        // The track must not be referenced twice in the album tracks array
        //if (~!album.tracks.indexOf(track)) {
        //  album.tracks.push(track)
        //  album.save()
        //}

        track.album = album

        track.save(function(err) { cb(err, track) })
      })
    })
  })
}

function getAlbum(tags, cb) {
  if (albums[tags.album]) return cb(null, albums[tags.album])

  Album.findOne({'title': tags.album}, function(err, album) {
    if (!options.forceTags && (err || album)) return cb(err, album)

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
    if (!options.forceTags && (err || artist)) return cb(err, artist)

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
  if (path == './public/music/Modestep/Modestep - To The Stars (Break The Noize & The Autobots Remix).mp4') {
    return cb(null, {
        'artist': ['Break The Noize', 'The Autobots']
      , 'title':  'Modestep - To The Stars (Break The Noize & The Autobots Remix)'
      , 'genre': ['Dubstep']
      , 'year':  2011
    })
  }

  var s = fs.createReadStream(path)
    , p = new mmd(s)

  p.on('metadata', function(data) { cb(null, data) })
  p.on('done',     function(err)  { if (err) cb(err); s.destroy() })
}
