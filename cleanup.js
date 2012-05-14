#!/usr/bin/env node

var fs       = require('fs')
  , async    = require('async')
  , mongoose = require('mongoose')
  , model    = require('./lib/model')

  , Artist   = model.Artist
  , Album    = model.Album
  , Track    = model.Track

cleanupTracks()

function close() {
  mongoose.connection.close()
}

function cleanupTracks() {
  Track.find({}, function(err, tracks) {
    async.forEachLimit(tracks, 10, function(track, done) {
      fs.stat('./public/'+ track.path, function(err, stat) {
        if (!err) return done()

        console.log('removing track', track)

        track.remove(done)
      })
    }, cleanupArtists)
  })
}

function cleanupArtists() {
  Artist.find({}, function(err, artists) {
    async.forEachLimit(artists, 5, function(artist, done) {
      Track.findOne({'artists': artist}, function(err, track) {
        if (!track) {
          console.log('removing artist', artist)

          artist.remove(done)
        }
        else done()
      })
    }, cleanupAlbums)
  })
}

function cleanupAlbums() {
  Album.find({}, function(err, albums) {
    async.forEachLimit(albums, 5, function(album, done) {
      Track.findOne({'album': album}, function(err, track) {
        if (!track) {
          console.log('removing album', album)

          album.remove(done)
        }
        else done()
      })
    }, close)
  })
}
