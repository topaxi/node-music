#!/usr/bin/env node

var config = require('./config.json')

///////////////////////////////////////////////////////////////////////////////

var fs         = require('fs')
  , path       = require('path')
  , mmd        = require('musicmetadata')
  , async      = require('async')
  , findit     = require('findit')
  , getWavInfo = require('./lib/convert').getWavInfo
  , mongoose   = require('mongoose')

var Album  = require('./lib/model/album')
  , Artist = require('./lib/model/artist')
  , Track  = require('./lib/model/track')

  , albums  = {}
  , artists = {}
  , files   = []

  , rFileTester = new RegExp('\\.'+ Object.keys(config.transcode.codecs).join('|') +'$')

  , i = 0

var finder = findit.find(config.library)

finder.on('file', function(path, stat) {
  if (rFileTester.test(path)) files.push([path, stat])
})

finder.on('end', function() {
  async.forEachSeries(files, function(file, done) {
    var path = file[0]
      , stat = file[1]

    i++

    getTrack(file, function(err, track) {
      if (err) return done(err)

      if (track.duration) return done()

      getWavInfo(path, function(err, wave) {
        if (err) return done(err)

        track.duration = wave.subchunk2Size / wave.byteRate

        track.save(function() {
          console.log('track duration of %d saved', track.duration)

          done()
        })
      })
    })
  }, function(err) {
    if (err) console.log(err)

    mongoose.connection.close()
  })
})

function getTrack(file, cb) {
  var path  = file[0]
    , stat  = file[1]
    , rpath = path.replace('./public', '')

  Track.findOne({ 'path': rpath }, function(err, track) {
    if (err) return cb(err)

    if (!config.forceTags && track && stat.mtime <= track.updated) {
      return cb(err, track)
    }

    console.log('importing', i +'/'+ files.length, path)

    tags(path, function(err, tags) {
      if (err) return cb(err, track)

      // Set path which is needed for the unique album key
      tags.path = rpath

      getArtists(tags.artist, function(err, artists) {
        if (err) return cb(err, track)

        if (!track) {
          track = new Track
          track.imported = Date.now()
        }

        track.artists     = artists
        track.path        = rpath
        track.title       = tags.title
        track.genres      = tags.genre
        track.year        = tags.year
        track.number      = tags.track.no
        track.albumartist = tags.albumartist
        track.updated     = Date.now()

        if (!tags.album) {
          return track.save(function(err) { cb(err, track) })
        }

        getAlbum(tags, function(err, album) {
          if (err) return cb(err, track)

          track.album = album

          track.save(function(err) { cb(err, track) })

          if (tags.albumartist && tags.albumartist.length) {
            getArtists(tags.albumartist, function(err, artists) {
              if (err) return cb(err, track)

              artists.forEach(function(artist) {
                if (!~artist.albums.indexOf(album._id)) {
                  artist.albums.push(album)

                  artist.save()
                }
              })
            })
          }
        })
      })
    })
  })
}

function getAlbum(tags, cb) {
  var apath = path.dirname(tags.path)

  if (albums[apath]) return cb(null, albums[apath])

  Album.findOne({'path': apath}, function(err, album) {
    if ((err || (albums[apath] = album)) && !config.forceTags) return cb(err, album)

    if (!album) {
      album = albums[apath] = new Album
      album.imported = Date.now()
    }

    album.title = tags.album
    album.year  = tags.year
    album.path  = path.dirname(tags.path)
    album.save(function(err) { cb(err, album) })
  })
}

function getArtist(name, cb) {
  if (artists[name]) return cb(null, artists[name])

  Artist.findOne({'name': name}, function(err, artist) {
    if ((err || (artists[name] = artist)) && !config.forceTags) return cb(err, artist)

    if (!artist) {
      artist = artists[name] = new Artist
      artist.imported = Date.now()
    }

    artist.name     = name
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
  var p = new mmd(fs.createReadStream(path))

  p.on('metadata', function(data) { cb(null, data) })
  p.on('done',     function(err)  { if (err) cb(err)
                                  })
}
