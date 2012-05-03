#!/usr/bin/env node

var fs       = require('fs')
  , async    = require('async')
  , mongoose = require('mongoose')
  , model    = require('./lib/model')

  , Artist   = model.Artist
  , Album    = model.Album
  , Track    = model.Track

  // Number of async loops, we need to know this, to proberly close
  // the mongoose connection if everything is done.
  , i = 0

function close() {
  if (--i) mongoose.connection.close()
}

Track.find({}, function(err, tracks) {
  if (tracks.length) i++

  async.forEachLimit(tracks, 10, function(track, done) {
    fs.stat('./public/'+ track.path, function(err, stat) {
      if (!err) return done()

      console.log('removing track', track)

      track.remove(function() { done() })
    })
  }, close)
})

Artist.find({}, function(err, artists) {
  if (artists.length) i++

  async.forEachLimit(artists, 5, function(artist, done) {
    Track.findOne({'artists': artist}, function(err, track) {
      if (!track) {
        console.log('removing artist', artist)

        artist.remove(function() { done() })
      }
      else done()
    })
  }, close)
})

Album.find({}, function(err, albums) {
  if (albums.length) i++

  async.forEachLimit(albums, 5, function(album, done) {
    Track.findOne({'album': album}, function(err, track) {
      if (!track) {
        console.log('removing album', album)

        album.remove(function() { done() })
      }
      else done()
    })
  }, close)
})
