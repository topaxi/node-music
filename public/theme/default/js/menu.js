;(function(window) { 'use strict'

var document = window
  , $        = window.jQuery
  , nm       = window.nm
  , Player   = nm.Player

$('#tracks').on('contextmenu', 'tr', function(e) {
  if (!nm.utils.login.loggedIn) return

  $('.contextmenu').remove()

  e.preventDefault()
  e.stopPropagation()

  $(document).one('click contextmenu', function() { $('.contextmenu').remove() })

  var $this = $(this)
    , track = $this.data('track')
    , $menu = $('<ul class="contextmenu">')

  var menu = [ { 'name': 'Add to queue',
                 'click': addToQueue(track) }
             , { 'name':  'Add to playlist',
                 'sub':   Player.playlists,
                 'click': addToPlaylist(track) } ]

  for (var i = 0, l = menu.length; i < l; ++i) {
    var $el = $('<li>').text(menu[i].name)

    if (!menu[i].sub) {
      $el.click(menu[i].click)
    }
    else if (menu[i].sub.length) {
      var $sub = $('<ul class="submenu">').on('click', 'li', menu[i].click)

      for (var ii = 0, ll = menu[i].sub.length; ii < ll; ++ii) {
        $sub.append($('<li>').text(menu[i].sub[ii].name)
                             .data('data', menu[i].sub[ii]))
      }

      $el.append($sub)
    }
    else continue

    $menu.append($el)
  }

  $menu.appendTo('body').position({
      'my': 'left top'
    , 'at': 'left top'
    , 'of': e
  })

  return false
})

function addToQueue(track) {
  return function(e) {
    Player.queue(track)
  }
}

function addToPlaylist(track) {
  return function(e) {
    var $this    = this
      , playlist = $(this).data('data')

    playlist.tracks.push(track)

    nm.request.post('/playlist/save')
              .data(playlist)
              .end()
  }
}

})(this)
