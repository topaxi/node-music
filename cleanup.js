#!/usr/bin/env node

var async  = require('async')
  , model  = require('./lib/model')
  , Artist = model.Artist
  , Album  = model.Album
  , Track  = model.Track

Artist.find({}, function(err, artists) {
  async.forEach(artists, function(artist, done) {
    Track.findOne({'artists': artist}, function(err, track) {
      if (!track) {
        console.log('removing', artist)

        artist.remove()
      }

      done()
    })
  })
})

Album.find({}, function(err, albums) {
  async.forEach(albums, function(album, done) {
    Track.findOne({'album': album}, function(err, track) {
      if (!track) {
        console.log('removing', album)

        album.remove()
      }

      done()
    })
  })
})
