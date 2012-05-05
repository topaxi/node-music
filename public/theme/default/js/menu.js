;(function(global) { 'use strict'

define(['jquery', 'player', 'utils'], function($, Player, utils) {

var document = global.document

$('#tracks').on('contextmenu', 'tr', function(e) {
  if (!utils.login.loggedIn) return

  $('.contextmenu').remove()

  e.preventDefault()
  e.stopPropagation()

  $(document).one('click contextmenu', function() { $('.contextmenu').remove() })

  var $this = $(this)
    , track = $this.data('track')
    , $menu = $('<ul class="contextmenu ui-menu ui-widget ui-widget-content ui-corner-all">')

  $menu.on('hover', 'a', function() { $(this).toggleClass('ui-state-hover') })

  var menu = [ { 'name': 'Add to queue',
                 'click': addToQueue(track) }
             , { 'name':  'Add to playlist',
                 'sub':   Player.playlists,
                 'click': addToPlaylist(track) } ]

  if (utils.login.user.admin) {
    menu.push({ 'name':  'Edit track information'
              , 'click': editTrackInformation(track)
              })
  }

  for (var i = 0, l = menu.length; i < l; ++i) {
    var $el = $('<li class="ui-menu-item">').html($('<a class="ui-corner-all">').text(menu[i].name))

    if (!menu[i].sub) {
      $el.click(menu[i].click)
    }
    else if (menu[i].sub.length) {
      var $sub = $('<ul class="submenu ui-menu ui-widget ui-widget-content ui-corner-all">').on('click', 'li', menu[i].click)

      for (var ii = 0, ll = menu[i].sub.length; ii < ll; ++ii) {
        $sub.append($('<li class="ui-menu-item">').html($('<a class="ui-corner-all">').text(menu[i].sub[ii].name))
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

function editTrackInformation(track) {
  return function(e) {
    require(['track/dialog'], function(dialog) {
      dialog.show(track)
    })
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

}) })(this)
