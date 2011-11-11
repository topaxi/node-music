// This script is loaded if all dependencies are
// finished loading and the DOM is ready
;(function(undefined) {

var window         = this
  , JSON           = window.JSON
  , location       = window.location
  , sessionStorage = window.sessionStorage
  , nm             = window.nm
  , Player         = nm.Player

Player.loadTracks = function loadTracks(tracks, cb) {
  var $table = $('<table>').appendTo($('#tracks').empty())
    , $tbody = $('<tbody>')

  $table.append('<thead><tr><th style="width:16px"></th><th>Track</th><th>Artist</th><th>Album</th><th>Genres</th><th style="width:64px">Duration</th><th style="width:24px"></th></tr></thead>')

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

  if (cb) cb()
}

Player.loadArtists = function(artists) {
  var $artists = $('<ul>').appendTo($('#artists').empty())

  $artists.append($('<li class="active">Show All</li>').click(function() {
      Player.loadTracks(Player._tracks)
      $artists.children().removeClass('active')

      nm.utils.Query.set('artist', null)

      $(this).addClass('active')
  }))

  artists.forEach(function(artist, i) {
    var $li = $('<li id="'+ artist._id +'">'+ artist.name +'</li>')

    $li.data('artist', artist).click(function() {
      $.getJSON('/tracks/artist/'+ artist._id, Player.loadTracks)

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
      $.getJSON('/tracks/all', Player.loadTracks)
      $albums.children().removeClass('active')

      nm.utils.Query.set('album', null)

      $(this).addClass('active')
  }))

  albums.forEach(function(album, i) {
    var $li = $('<li>'+ album.title +'</li>')

    $li.data('album', album).click(function() {
      $.getJSON('/tracks/album/'+ album._id, Player.loadTracks)

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
         ,   '<td>', track.title, '</td>'
         ,   '<td>', artist(track.artists), '</td>'
         ,   '<td>', album, '</td>'
         ,   '<td>', track.genres, '</td>'
         ,   '<td class="tac">', nm.utils.formatTime(track.duration), '</td>'
         ,   '<td><a href="', track.path, '?download" title="Download" class="download ui-icon ui-icon-arrowthickstop-1-s ui-button ui-widget ui-corner-all ui-state-default"></a></td>'
         , '</tr>'
         ].join('')
}

function stopPropagation(e) { e.stopPropagation() }

var Player_load = Player.load
Player.load = function(track) {
  Player_load.call(this, track)

  $$('buffered').width(800)

  $('tr.active').removeClass('active')
  $$(track._id).addClass('active')

  $$('waveform').prop('src', '/wave/'+ track._id +'.png')

  $$('current').html([ '<strong>', track.title, '</strong><br>'
                     , '<span class="h">by</span>'
                     , artist(track.artists)
                     , track.album ? '<span class="h">from</span>' : ''
                     , track.album ? track.album.title : ''
                     ].join(' '))

  document.title = $$('current').text()

  return this
}

Player.getAllTracks(function() {
  var query = nm.utils.fromQuery(location.hash.slice(1))

  if (query.track) {
    $('#tracks').animate({'scrollTop': $$(query.track).click().position().top - $('#tracks').height() / 2})
  }
})
Player.bind()

})()
