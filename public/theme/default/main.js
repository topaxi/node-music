// This script is loaded if all dependencies are
// finished loading and the DOM is ready
;(function(window) { 'use strict'

define(['player', 'utils', 'superagent'],
  function(Player, utils, request) {

var jQueryUI = '1.10.1'

require.config({
  paths: { 'jquery-ui':  '//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/jquery-ui.min'
  }
})

var document   = window.document
  , setTimeout = window.setTimeout
  , location   = window.location
  , Math       = window.Math
  , formatTime = utils.formatTime

  , DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

  , COLORS = { 'Drum & Bass':   [  0,  48, 160]
             , 'Drumstep':      [176,  32, 160]
             , 'Dubstep':       [192,  24,   0]
             , 'Bass':          [160,  16,   8]
             }

Player.emitLastfmTrackInfo = true
Player.on('lastfmTrackInfo', function displayLastfmCoverArt(trackInfo) {
  if (trackInfo && trackInfo.album && trackInfo.album.image &&
      trackInfo.album.image.length) {
    Player.audio.poster = trackInfo.album.image[2]['#text']
  }
  else {
    Player.audio.poster = null
  }
})

function getPlaylists() {
  request('/playlist/all', function(res) {
    if (!res.body) return

    var playlists  = Player.playlists = res.body
      , $playlists = $('<ul id="playlists">')

    $playlists.append('<li id="newPlaylist">Create Playlist</li>')

    for (var i = 0, l = playlists.length; i < l; ++i) {
      $playlists.append('<li id="'+ playlists[i]._id +'">'+ playlists[i].name +'</li>')

      populatePlaylist(playlists[i])
    }

    $playlists.on('click', 'li', function() {
      if (this.id == 'newPlaylist') return newPlaylist()

      for (var l = playlists.length; l--; ) {
        if (this.id == playlists[l]._id) {
          loadTracks(playlists[l].tracks)

          break
        }
      }
    }).appendTo('#places')
  })

  function populatePlaylist(playlist) {
    var tracks = Player._tracks

    for (var l = tracks.length; l--; )
      for (var ll = playlist.tracks.length; ll--; )
        if (playlist.tracks[ll] == tracks[l]._id)
          playlist.tracks[ll] = tracks[l]
  }
}

function newPlaylist() {
  var name     = prompt('Playlist name?')
    , playlist = { 'name': name, 'filters': [], 'tracks': [] }

  if (!name) return false

  request.post('/playlist/save')
            .send(playlist)
            .end(function(res) {
              if (!res.text) return alert('fail')

              playlist._id = res.body

              Player.playlists.push(playlist)

              $('#playlists').append('<li id="'+ playlist._id +'">'+ playlist.name +'</li>')
            })
}

function loadTracks(tracks, cb) {
  var $table = $('<table>').appendTo($('#tracks').empty())
    , $tbody = $('<tbody>')

  $table.append('<thead><tr><th style="width:16px"></th><th style="width:16px"></th><th>Track</th><th>Artist</th><th>Album</th><th>Genres</th><th style="width:64px">Duration</th><th style="width:1px">Year</th><th style="width:24px"></th></tr></thead>')

  if (!tracks) return

  tracks.forEach(function(track, i) {
    $tbody.append(trackrow(track))
  })

  $table.append($tbody)

  $tbody.on('click', 'tr', function() {
    Player.play(this.id)
  })

  $table.find('.queue').on('click', function(e) {
    e.stopPropagation()

    Player.queue(this.parentNode.parentNode.id)
  })

  if ($.ui) {
    $tbody.find('.download').click(stopPropagation)
  }

  if (Player.currentTrack) {
    $tbody.find('#'+ Player.currentTrack._id).addClass('active')
  }

  if (typeof cb == 'function') cb()
}

function loadArtists(artists) {
  var $artists = $('<ul>').appendTo($('#artists').empty())

  $artists.append($('<li class="active">Show All</li>').click(function() {
      loadTracks(Player._tracks)
      $artists.children().removeClass('active')

      utils.Query.set('artist', null)

      $(this).addClass('active')
  }))

  artists.forEach(function(artist, i) {
    var $li = $('<li id="'+ artist._id +'">'+ artist.name +'</li>')

    $li.data('artist', artist).click(function() {
      loadTracks(filterTracksByArtist(artist))

      utils.Query.set('artist', artist._id)

      $artists.children().removeClass('active')
      $li.addClass('active')
    })

    $artists.append($li)
  })

  var query = utils.fromQuery(location.hash.slice(1))

  if (query.artist) {
    $('#artists').animate({'scrollTop': $('#'+ query.artist).click().position().top - $('#artists').height() / 2})
  }
}

function loadAlbums(albums) {
  var $albums = $('<ul>').appendTo($('#albums').empty())

  $albums.append($('<li class="active">Show All</li>').click(function() {
      loadTracks(Player._tracks)
      $albums.children().removeClass('active')

      utils.Query.set('album', null)

      $(this).addClass('active')
  }))

  albums.forEach(function(album, i) {
    var $li = $('<li id="'+ album._id +'">'+ album.title +'</li>')

    $li.data('album', album).click(function() {
      loadTracks(filterTracksByAlbum(album))

      utils.Query.set('album', album._id)

      $albums.children().removeClass('active')
      $li.addClass('active')
    })

    $albums.append($li)
  })

  var query = utils.fromQuery(location.hash.slice(1))

  if (query.album) {
    $('#albums').animate({'scrollTop': $('#'+ query.album).click().position().top - $('#albums').height() / 2})
  }
}

function trackrow(track) {
  var album = track && track.album && track.album.title
    , isNew = Date.now() - +track.imported < DAY_IN_MILLISECONDS

  return $('<tr id="'+ track._id +'"'+ (isNew ? ' class="new" title="New!"' : '') +'>'
             + '<td><a title="Add to queue" class="queue ui-icon ui-icon-circle-plus"></a></td>'
             + '<td class="tar">'+ (track.number ? track.number + '.' :  '') +'</td>'
             + '<td>'+ htmltruncate(track.title, 48, ' ') +'</td>'
             + '<td>'+ track.artist +'</td>'
             + '<td>'+ (album ? htmltruncate(album, 32, ' ') : '') +'</td>'
             + '<td>'+ track.genres.join(', ') +'</td>'
             + '<td class="tac">'+ formatTime(track.duration) +'</td>'
             + '<td class="tac">'+ (parseInt(track.year, 10) ? track.year.slice(0, 4) : '') +'</td>'
             + '<td><a href="'+ track.path +'?download" title="Download" class="download ui-icon ui-icon-arrowthickstop-1-s ui-button ui-widget ui-corner-all ui-state-default"></a></td>'
           + '</tr>'
          )
}

function stopPropagation(e) { e.stopPropagation() }

Player.on('load', function displayCurrentTrack(track) {
  var waveform
    , genre    = track.genres[0]

  utils.Query.set('track', track._id)

  $('#buffered').width(800)

  $('tr.active').removeClass('active')
  $('#'+ track._id).addClass('active')

  if (genre in COLORS) {
    $('#progress').find('.progress, .hover')
                  .css({ 'border-right': '1px solid rgb('+ COLORS[genre] +')'
                       , 'background': 'rgba('+ COLORS[genre] +', .33)' })

    waveform = '/wave/'+ track._id +'-'+ COLORS[genre].join('-') +'.png'
  }
  else {
    $('#progress').find('.progress, .hover').removeAttr('style')

    waveform = '/wave/'+ track._id +'.png'
  }

  // Set blank gif first, the waveform might take a second to load
  $('#waveform').prop('src', 'data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw%3D%3D')
  setTimeout(function() {
    $('#waveform').prop('src', waveform)
  }, 1)

  $('#current').html([ '<strong>', track.title, '</strong><br>'
                     , '<span class="h">by</span>'
                     , track.artist
                     , track.album ? '<span class="h">from</span>' : ''
                     , track.album ? track.album.title : ''
                     ].join(' '))

  document.title = $('#current').text()
})

Player.on('load',   displayNextInQueue)
Player.on('queued', displayNextInQueue)

function displayNextInQueue() {
  redrawQueueList()

  var $toggle = $('#queueNextWaveform')
    , track

  if (!(track = Player._queue[Player._queueIndex + 1])) {
    $toggle.hide()
    $('#queueNextTitle').text('Show queue')
    $('#queueNextRemove').addClass('dn')

    return
  }

  var waveform = '/wave/'+ track._id
    , genre    = track.genres[0]

  waveform += genre in COLORS ? '-'+ COLORS[genre].join('-') +'.png' : '.png'

  $toggle[0].src = waveform

  $('#queueNextTitle').text('Next track: '+ track.artist +' – '+ track.title)
  $('#queueNextRemove').removeClass('dn')

  $toggle.show()
}

function redrawQueueList() {
  var $list = $('#queueList')

  $list.empty()

  Player._queue.forEach(queueEntry)

  function queueEntry(track, i) {
    var genre    = track.genres[0]
      , waveform = '/wave/'+ track._id
      , $img     = $('<img>')
      , $text    = $('<span class="text">')
      , $li      = $('<li>').append($img).append($text)

    if (Player._queueIndex == i && Player.currentTrack === track) {
      $li.addClass('current')
    }
    else if (Player._queueIndex >= i) {
      $li.addClass('played')
    }

    $li.append('<span class="remove">X</div>')

    waveform += genre in COLORS ? '-'+ COLORS[genre].join('-') +'.png' : '.png'

    $img[0].src = waveform
    $text.text(track.artist +' – '+ track.title)

    $list.append($li)
  }
}

function createProgressbar() {
  var audio      = Player.audio
    , $audio     = $(audio)
    , $progress  = $('#progress')
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
  $audio.on('timeupdate progress', utils.throttle(function(e) {
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

    $progress.mousemove(utils.throttle(function(e) {
      var x = e.clientX - $waveform.offset().left

      $hover.width(x)

      $time.text(formatTime((audio.duration || Player.currentTrack.duration) / $waveform.width() * x))
    }, 25))

    $progress.mouseleave(function() {
      $hover.detach()
    })
  })()

  $audio.on('durationchange', function() {
    $duration.text(formatTime(audio.duration))
  })

  $audio.on('timeupdate', utils.throttle(function() {
    var currentTime = this.currentTime
      , duration    = this.duration

    $indicator.width(~~($waveform.width() / (duration || Player.currentTrack.duration) * currentTime))
    $time.text(formatTime(currentTime))
    $remaining.text(formatTime(currentTime - (duration || Player.currentTrack.duration)))
  }, 500))
}

// Load jQuery and get this thing started! :)
require(['jquery', 'menu'], function($) {
  Player.getAllTracks(function(err, tracks) {
    if (!utils.Query.get('artist') && !utils.Query.get('album')) {
      loadTracks(tracks)
    }

    loadArtists(Player._artists)
    loadAlbums(Player._albums)

    var query = utils.fromQuery(location.hash.slice(1))

    if (query.track) {
      Player.play(query.track)

      $('#tracks').animate({'scrollTop': $('#'+ query.track).position().top - $('#tracks').height() / 2})
    }
  })

  Player.bind()

  $('#queueNextRemove').click(function(e) {
    e.stopPropagation()

    Player._queue.splice(Player._queueIndex + 1, 1)

    displayNextInQueue()
  })

  $('#queueList').click(stopPropagation)

  $('#queueList').on('click', '.remove', function(e) {
    e.stopPropagation()

    var li = $(this).parent()[0]
      , i  = $('#queueList').children().index(li)

    Player._queue.splice(i, 1)

    if (i < Player._queueIndex + 1) {
      Player._queueIndex -= 1
    }

    displayNextInQueue()
  })

  $('#queueList').on('click', '.text', function(e) {
    e.stopPropagation()

    var li = $(this).parent()[0]

    Player.queue($('#queueList').children().index(li))
  })

  $('#video').append(Player.audio)

  $('#play').toggleClass('paused', Player.audio.paused)
            .click(function() { Player.play() })

  $(Player.audio).on('play pause', function() {
    var label = this.paused ? 'Play' : 'Pause'
      , $play = $('#play').toggleClass('paused', this.paused)
                          .text(label)


    if ($.ui) {
      $play.button({ 'icons': { 'primary': this.paused
                                         ? 'ui-icon-play'
                                         : 'ui-icon-pause' }
                   , 'label': label })
    }
  })

  $(Player.audio).click(function(e) {
    e.preventDefault()

    $(this).toggleClass('fullscreen')
  })

  $('head').append('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/themes/base/jquery-ui.css">')
  require(['jquery-ui'], function() {
    var audio = Player.audio

    $('#back').button({ 'icons': { 'primary': 'ui-icon-seek-first' }, 'text': false })
    $('#play').button({ 'icons': { 'primary': 'ui-icon-play'       }, 'text': false })
    $('#next').button({ 'icons': { 'primary': Player.shuffle ? 'ui-icon-shuffle' : 'ui-icon-seek-end' }, 'text': false })

    $('#shuffle').button().click(function() {
      Player.shuffle = !Player.shuffle

      $('#next').button('option', 'icons', { 'primary': Player.shuffle ? 'ui-icon-shuffle' : 'ui-icon-seek-end' })
    })

    $('#repeat').buttonset().on('click', 'input', function() {
      Player.repeat = this.value || false
    })

    var steps   = 50
      , volume  = audio.volume
      , $volume = $('#volume').slider({
          'value':  audio.volume * steps
        , 'change': function(e, ui) {
                      volume = ui.value / steps

                      if (volume != audio.volume) audio.volume = volume
                    }
        , 'range':  'min'
        , 'max':    steps
      })

    $(audio).on('volumechange', function() {
      var volume = Math.round(audio.volume * steps) / steps

      audio.volume = volume

      if (volume * steps != $volume.slider('value')) {
        $volume.slider('value', volume * steps)
      }
    })
  })

  createProgressbar()

  $('#queue').click(function showQueue() {
    var $list = $('#queueList')

    if ($list.is(':visible')) return $list.hide()

    redrawQueueList()

    $list.show()
  })

  $('#search').on('keyup', utils.throttle(searchFilter, 500))
              .on('blur',  searchFilter)
})

function searchFilter() {
  var val = $('#search').val().trim()

  if (val.length > 2) {
    loadTracks(filterTracksByRegExp(new RegExp(val, 'i')))
  }
  else if ($('#tracks').find('tr').length - 1 != Player._tracks.length) {
    loadTracks(Player._tracks)
  }
}

function loggedOut() {
  // TODO: halp
  if (typeof $ == 'undefined') {
    return setTimeout(function() { loggedOut() }, 500)
  }

  $('#avatar').remove()

  $('<a id="login"><img alt="Sign in" src="/theme/default/images/sign_in_blue.png"></a>').appendTo(document.body).click(function() {
    utils.login.show()
  })

  Player.scrobble = false

  $('#playlists').remove()
}

function loggedIn(res) {
  // TODO: halp, not ready yet!
  if (typeof $ == 'undefined' || !Player._tracks) {
    return setTimeout(function() { loggedIn(res) }, 500)
  }

  $('#login').remove()

  var user = res.body

  if (user.email) {
    utils.gravatar.getAvatar(user.email, 64, function(avatar) {
      // Yes target _blank... but node-music is a music player so we want to stay
      // on the page! :)
      $('<a id="avatar" href="http://gravatar.com/emails/" target="_blank">').append(
          $('<img>').prop('src', avatar)
      ).appendTo(document.body)
    })
  }

  var $scrobble = $('<div style="position:absolute;right:10px" class="scrobble">')
    , $checkbox = $('<input id="scrobble" type="checkbox">')

  $scrobble.append($checkbox)

  if (user.lastfm && user.lastfm.session) {
    $scrobble.append('<label for="scrobble">Scrobble</label>')
    $checkbox[0].checked = true
    Player.scrobble      = true
  }
  else {
    $scrobble.append('<a href="http://www.last.fm/api/auth/?api_key=967ce1901a718b229e7795a485666a1e&cb=http://'+ location.hostname +'/lastfm/auth">Scrobble</a>')
    $checkbox.prop('disabled', true)
  }

  $checkbox.click(function(e) {
    Player.scrobble = this.checked

    if (Player.scrobble && Player.currentTrack && !Player.audio.paused) {
      Player.updateNowPlaying(Player.currentTrack)
    }
  })

  $scrobble.appendTo(document.body)

  getPlaylists()
}

utils.login.on('loggedOut', loggedOut)
utils.login.on('loggedIn',  loggedIn)

utils.login.on('error', function() {
  console.log('Authentication error!', arguments)
})

function htmltruncate(str, limit, breakword, pad) {
  if (typeof str !== 'string' || str.length <= limit) return str

  return '<span title="'+ str +'">'
           + utils.truncate(str, limit, breakword, pad)
         +'</span>'
}

function filterTracksByArtist(artist) {
  return Player._tracks.filter(function(track) {
    return ~track.artists.indexOf(artist)
  })
}

function filterTracksByAlbum(album) {
  return Player._tracks.filter(function(track) {
    return track.album === album
  })
}

function filterTracksByRegExp(regexp) {
  return Player._tracks.filter(function(track) {
    if (regexp.test(track.title))                      return true
    if (track.album && regexp.test(track.album.title)) return true

    return track.artists.some(function(artist) {
                                return regexp.test(artist.name)
                              })
  })
}

// Expose theming functions for other scripts
return { 'trackrow': trackrow }

}) })(this)
