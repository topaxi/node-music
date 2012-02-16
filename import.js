#!/usr/bin/env node

//var config = { 'library':   './public/music'
//             , 'forceTags': false // force tag reading, currently broken
//             , 'waveform':  { 'detail':   5 // higher means less detail
//                            , 'width':  1024
//                            , 'height':  128
//                            , 'color': [0, 48, 160]
//                            }
//             }
var config = require('./config.json')


///////////////////////////////////////////////////////////////////////////////

var fs         = require('fs')
  , path       = require('path')
  , mmd        = require('musicmetadata')
  , readSync   = require('./lib/fs').recursiveReaddirSync
  , getWavInfo = require('./lib/convert').getWavInfo

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

;(function importTrack(i) {
  if (i == files.length) process.exit()

  var path = files[i++]

  console.log('importing', i +'/'+ files.length, path)

  tags(path, function(err, tags) {
    if (err) throw err

    tags.path = path.replace('./public', '')

    getTrack(tags, function(err, track) {
      if (err) throw err

      console.log('imported', track.path)

      if (track.duration) return importTrack(i)

      getWavInfo(path, function(err, wave) {
        if (err) throw err

        track.duration = wave.subchunk2Size / wave.byteRate

        track.save(function() {
          console.log('track duration of %d saved', track.duration)

          importTrack(i)
        })
      })
    })
  })
})(0)

function getTrack(tags, cb) {
  Track.findOne({ 'path': tags.path }, function(err, track) {
    if (!config.forceTags && (err || track)) return cb(err, track)

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

function tags(path, cb) {
  var s = fs.createReadStream(path)
    , p = new mmd(s)

  p.on('metadata', function(data) { cb(null, data) })
  p.on('done',     function(err)  { if (err) cb(err); s.destroy() })
}
