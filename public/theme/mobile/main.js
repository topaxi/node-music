// This script is loaded if all dependencies are
// finished loading and the DOM is ready
;(function(window) { 'use strict'

var document = window.document
  , head     = document.head

requirejs.config({
  paths: {
      'jquery':        '//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min'
    , 'jquery-mobile': '//code.jquery.com/mobile/1.1.0-rc.2/jquery.mobile-1.1.0-rc.2.min'
  }
})

head.innerHTML += '<link rel="stylesheet" href="//code.jquery.com/mobile/1.1.0-rc.2/jquery.mobile-1.1.0-rc.2.min.css">'

define(['jquery', 'jquery-mobile'], function($, $m) {

var nm         = window.nm
  , body       = document.body
  , Player     = nm.Player
  , artistData = {}

Player.getAllTracks(function(err, tracks) {
  var artists = Player._artists

  for (var i = 0, l = artists.length; i < l; ++i) {
    artistData[artists[i].name] = artists[i]

    artists[i].tracks = []

    for (var ii = 0, ll = tracks.length; ii < ll; ++ii) {
      if (~tracks[ii].artists.indexOf(artists[i])) {
        artists[i].tracks.push(tracks[ii])
      }
    }
  }

  //
  var $artists = $('<div id="artists" data-role="page" data-url="/">')
    , $content = $('<div data-role="content">')
    , $list    = $('<ul data-role="listview" data-inset="true">')
    , artist   = nm.utils.Query.get('artist')

  $artists.append(
    '<div data-role="header" data-position="fixed">'
      +'<h1>Artists</h1>'
    +'</div>'
  )
  $content.append('<h2>Select an artist:</h2>')

  artists.forEach(function(artist) {
    createArtistPage(artistData[artist.name])

    $list.append(
      $('<li id="'+ artist._id +'"><a href="#">'+ artist.name +'</a></li>')
        .click(function() {
          // No idea why $(this) does not work here... oO
          $m.changePage($('#'+ this.id))
        })
    )
  })

  $content.append($list)
  $artists.append($content)

  $(body).append($artists)

  $m.changePage(artist ? $('#'+ artist) : $artists)

  Player.audio.controls = true

  body.appendChild(Player.audio)
})

function createArtistPage(artist) {
  var $artist  = $('<div id="'+ artist._id +'" data-role="page" data-url="#artist='+ artist._id +'">')
    , $content = $('<div data-role="content">')
    , $list    = $('<ul data-role="listview" data-inset="true" data-split-theme="c" data-split-icon="plus">')

  $artist.append(
    '<div data-role="header" data-position="fixed">'
      +'<a id="artistsLink" href="/">Artists</a>'
      +'<h1>'+ artist.name +'</h1>'
    +'</div>'
  )
  $content.append('Tracks of '+ artist.name +':')

  artist.tracks.forEach(function(track) {
    $list.append('<li id="'+ track._id +'"><a class="play" title="Play now!">'+ track.title +'</a><a class="queue" href="#">Add to queue</a></li>')
  })

  $list.on('click', '.play', function() {
    Player.play($(this).parents('li')[0].id)
  })

  $list.on('click', '.queue', function() {
    Player.queue($(this).parents('li')[0].id)
  })

  $content.append($list)
  $artist .append($content)

  $(body).append($artist)
}

function createProgressbar() {
  var audio      = Player.audio
    , $audio     = $(audio)
    , $progress  = $$('progress')
    , $indicator = $('<div class="progress">')
    , $waveform  = $('<img id="waveform">')
    , $duration  = $('<div id="duration" class="h">')
    , $time      = $('<div id="time" class="hi">')
    , $remaining = $('<div id="remaining" class="h">')
    , $buffered  = $('<div id="buffered">')

  $indicator.append($time)
            .append($remaining)

  $progress.append($buffered)
           .append($duration)
           .append($indicator)
           .append($waveform)
           .click(function(e) {
             audio.currentTime = (e.clientX - $waveform.offset().left)
                               /  $waveform.width() * (audio.duration || Player.currentTrack.duration)
           })

  // I'm not sure why, but chromium sometimes won't trigger the progress event
  $audio.on('timeupdate progress', nm.utils.throttle(function(e) {
    var ranges   = this.buffered
      , duration = this.duration
      , width    = 800
      , end      = 0
      , i

    for (i = ranges.length; i--;) {
      end = Math.max(ranges.end(i), end)
    }

    $buffered.width(width - width / duration * end)
  }, 500))

  ;(function() {
    var $time  = $('<div class="hovertime">')
      , $hover = $('<div class="hover">').append($time)

    $progress.mouseenter(function() {
      $progress.append($hover)
    })

    $progress.mousemove(nm.utils.throttle(function(e) {
      var x = e.clientX - $waveform.offset().left

      $hover.width(x)

      $time.text(nm.utils.formatTime((audio.duration || Player.currentTrack.duration) / $waveform.width() * x))
    }, 25))

    $progress.mouseleave(function() {
      $hover.remove()
    })
  })()

  $audio.on('durationchange', function() {
    $duration.text(nm.utils.formatTime(audio.duration))
  })

  $audio.on('timeupdate', nm.utils.throttle(function() {
    var currentTime = this.currentTime
      , duration    = this.duration

    $indicator.width(~~($waveform.width() / (duration || Player.currentTrack.duration) * currentTime))
    $time.text(nm.utils.formatTime(currentTime))
    $remaining.text(nm.utils.formatTime(currentTime - (duration || Player.currentTrack.duration)))
  }, 500))
}

Player.bind()
createProgressbar()

})

})(this)
