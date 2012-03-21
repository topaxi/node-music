// This script is loaded if all dependencies are
// finished loading and the DOM is ready
;(function(undefined) {

var window     = this
  , setTimeout = window.setTimeout
  , JSON       = window.JSON
  , location   = window.location
  , Math       = window.Math
  , nm         = window.nm
  , Player     = nm.Player

Player.emitLastfmTrackInfo = true
Player.on('lastfmTrackInfo', function(trackInfo) {
  if (trackInfo && trackInfo.album && trackInfo.album.image &&
      trackInfo.album.image.length) {
    Player.audio.poster = trackInfo.album.image[2]['#text']
  }
  else {
    Player.audio.poster = null
  }
})

function getPlaylists() {
  nm.request('/playlist/all', function(res) {
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

    for (var l = tracks.length; l--; ) {
      for (var ll = playlist.tracks.length; ll--; ) {
        if (playlist.tracks[ll] == tracks[l]._id) {
          playlist.tracks[ll] = tracks[l]
        }
      }
    }
  }
}

function newPlaylist() {
  var name     = prompt('Playlist name?')
    , playlist = { 'name': name, 'filters': [], 'tracks': [] }

  if (!name) return false

  nm.request.post('/playlist/save')
            .data(playlist)
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
    $tbody.append($(trackrow(track)).data('track', track))
  })

  $table.append($tbody)

  $tbody.on('click', 'tr', function() {
    Player.play($(this).data('track'))
  })

  $table.find('.queue').on('click', function(e) {
    e.stopPropagation()

    Player.queue($(this.parentNode.parentNode).data('track'))
  })

  if ($.ui) {
    $tbody.find('.download').click(stopPropagation)
  }

  if (Player.currentTrack) {
    $tbody.find('#'+ Player.currentTrack._id).addClass('active')
  }

  if (typeof cb == 'function') cb()
}

Player.loadArtists = function(artists) {
  var $artists = $('<ul>').appendTo($('#artists').empty())

  $artists.append($('<li class="active">Show All</li>').click(function() {
      loadTracks(Player._tracks)
      $artists.children().removeClass('active')

      nm.utils.Query.set('artist', null)

      $(this).addClass('active')
  }))

  artists.forEach(function(artist, i) {
    var $li = $('<li id="'+ artist._id +'">'+ artist.name +'</li>')

    $li.data('artist', artist).click(function() {
      $.getJSON('/tracks/artist/'+ artist._id, loadTracks)

      nm.utils.Query.set('artist', artist._id)

      $artists.children().removeClass('active')
      $li.addClass('active')
    })

    $artists.append($li)
  })

  var query = nm.utils.fromQuery(location.hash.slice(1))

  if (query.artist) {
    $$('artists').animate({'scrollTop': $$(query.artist).click().position().top - $$('artists').height() / 2})
  }
}

Player.loadAlbums = function(albums) {
  var $albums = $('<ul>').appendTo($('#albums').empty())

  $albums.append($('<li class="active">Show All</li>').click(function() {
      loadTracks(Player._tracks)
      $albums.children().removeClass('active')

      nm.utils.Query.set('album', null)

      $(this).addClass('active')
  }))

  albums.forEach(function(album, i) {
    var $li = $('<li id="'+ album._id +'">'+ album.title +'</li>')

    $li.data('album', album).click(function() {
      $.getJSON('/tracks/album/'+ album._id, loadTracks)

      nm.utils.Query.set('album', album._id)

      $albums.children().removeClass('active')
      $li.addClass('active')
    })

    $albums.append($li)
  })

  var query = nm.utils.fromQuery(location.hash.slice(1))

  if (query.album) {
    $$('albums').animate({'scrollTop': $$(query.album).click().position().top - $$('albums').height() / 2})
  }
}

function artist(artists) {
  return artists.map(function(a) { return a.name }).join(' & ')
}

function trackrow(track) {
  var album  = track && track.album && track.album.title

  return [ '<tr id="', track._id, '">'
         ,   '<td>', '<a title="Add to queue" class="queue ui-icon ui-icon-circle-plus"></a>', '</td>'
         ,   '<td class="tar">', track.number ? track.number + '.' :  '', '</td>'
         ,   '<td>', htmltruncate(track.title, 48, ' '), '</td>'
         ,   '<td>', artist(track.artists), '</td>'
         ,   '<td>', htmltruncate(album, 32, ' '), '</td>'
         ,   '<td>', track.genres, '</td>'
         ,   '<td class="tac">', nm.utils.formatTime(track.duration), '</td>'
         ,   '<td class="tac">', parseInt(track.year) ? track.year.slice(0, 4) : '', '</td>'
         ,   '<td><a href="', track.path, '?download" title="Download" class="download ui-icon ui-icon-arrowthickstop-1-s ui-button ui-widget ui-corner-all ui-state-default"></a></td>'
         , '</tr>'
         ].join('')
}

function stopPropagation(e) { e.stopPropagation() }

Player.on('load', function(track) {
  nm.utils.Query.set('track', track._id)

  $$('buffered').width(800)

  $('tr.active').removeClass('active')
  $$(track._id).addClass('active')

  // Set blank gif first, the waveform might take a second to load
  $$('waveform').prop('src', 'data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw%3D%3D')
  setTimeout(function() {
    $$('waveform').prop('src', '/wave/'+ track._id +'.png')
  }, 1)

  $$('current').html([ '<strong>', track.title, '</strong><br>'
                     , '<span class="h">by</span>'
                     , artist(track.artists)
                     , track.album ? '<span class="h">from</span>' : ''
                     , track.album ? track.album.title : ''
                     ].join(' '))

  document.title = $$('current').text()
})

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

// Load jQuery and get this thing started! :)
require(['https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'], function() {
  require(['menu'])

  var $ = window.jQuery

  Player.getAllTracks(function(err, tracks) {
    if (!nm.utils.Query.get('artist')) {
      loadTracks(tracks)
    }

    var query = nm.utils.fromQuery(location.hash.slice(1))

    if (query.track) {
      Player.play(query.track)

      $('#tracks').animate({'scrollTop': $$(query.track).position().top - $('#tracks').height() / 2})
    }
  })

  Player.bind()

  $$('video').append(Player.audio)

  $$('play').toggleClass('paused', Player.audio.paused)
            .click(function() { Player.play() })

  $(Player.audio).on('play pause', function() {
    var label = this.paused ? 'Play' : 'Pause'
      , $play = $$('play').toggleClass('paused', this.paused)
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

  var jQueryUI = '1.8.17'

  $('head').append('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/themes/base/jquery-ui.css">')
  require(['//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/jquery-ui.min.js'], function() {
    var audio = Player.audio

    $$('back').button({ 'icons': { 'primary': 'ui-icon-seek-first' }, 'text': false })
    $$('play').button({ 'icons': { 'primary': 'ui-icon-play'       }, 'text': false })
    $$('next').button({ 'icons': { 'primary': 'ui-icon-seek-end'   }, 'text': false })
    $$('shuffle').button().click(function() { Player.shuffle = !Player.shuffle })
    $$('repeat').buttonset().on('click', 'input', function() {
      Player.repeat = this.value || false
    })

    var steps   = 50
      , volume  = audio.volume
      , $volume = $$('volume').slider({
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

    // TODO: Remove this!
    $('.download').button()
  })

  createProgressbar()

  //if (nm.utils.login.loggedIn) {
  //  loggedIn()
  //}
  //else {
  //  loggedOut()
  //}
})

function loggedOut() {
  // TODO: halp
  if (typeof $ == 'undefined') {
    return setTimeout(function() { loggedOut() }, 500)
  }

  $('#avatar').remove()

  $('<a id="login"><img alt="Sign in" src="/theme/default/images/sign_in_blue.png"></a>').appendTo(document.body).click(function() {
    nm.utils.login.show()
  })

  Player.off('load', updateNowPlaying)

  $('#playlists').remove()
}

function loggedIn(res) {
  // TODO: halp, not ready yet!
  if (typeof $ == 'undefined' || !Player._tracks) {
    return setTimeout(function() { loggedIn(res) }, 500)
  }

  $('#login').remove()

  if (res.body.email) {
    nm.utils.gravatar.getAvatar(res.body.email, 64, function(avatar) {
      // Yes target _blank... but node-music is a music player so we want to stay
      // on the page! :)
      $('<a id="avatar" href="http://gravatar.com/emails/" target="_blank">').append(
          $('<img>').prop('src', avatar)
      ).appendTo(document.body)
    })
  }

  $('<div style="position:absolute;right:10px" class="scrobble"><input id="scrobble" type="checkbox"> <a href="http://www.last.fm/api/auth/?api_key=967ce1901a718b229e7795a485666a1e&cb=http://192.168.1.4:3000/lastfm/auth">Scrobble</a></div>')
    .appendTo(document.body)
    .find('input')
    .click(function(e) { Player.scrobble = this.checked })

  getPlaylists()
}

nm.utils.login.on('loggedOut', loggedOut)
nm.utils.login.on('loggedIn',  loggedIn)

nm.utils.login.on('error', function() {
  console.log('Authentication error!', arguments)
})

function htmltruncate(str, limit, breakword, pad) {
  return [ '<span title="', str, '">'
         ,   nm.utils.truncate(str, limit, breakword, pad)
         , '</span>'
         ].join('')
}

})()
