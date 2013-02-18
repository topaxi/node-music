;(function(window) { 'use strict'

var deps = [ 'eventemitter'
           , 'superagent'
           , 'utils'
           ]

define('player', deps, function(EventEmitter, request, utils) {

var document     = window.document
  , location     = window.location
  , Player       = window.Player = new EventEmitter
  // TODO: How do we decide on audio or video? Maybe use always video?
  //       If we use video, what will happen to devices like iphone?
  , audio        = Player.audio = cel(nm.theme == 'mobile' ? 'audio' : 'video')
  , localStorage = window.localStorage
  , Math         = window.Math
  , noop         = function noop() { }
  , albummap, artistmap

if (isNaN(localStorage.volume)) {
  localStorage.volume = audio.volume
}
else {
  audio.volume = localStorage.volume
}

Player.emitLastfmTrackInfo = false
Player.scrobble            = false

Player.updateNowPlaying = function updateNowPlaying(track) {
  if (!this.scrobble) return

  var artist = track.artists.map(function(a) { return a.name }).join(' & ')
    , params = { 'title':    track.title
               , 'artist':   artist
               , 'duration': track.duration
               }

  if (track.album)  params.album  = track.album.title
  if (track.number) params.number = track.number

  request('/lastfm/nowplaying')
    .send(params)
    .type('json')
    .end(function(res) {
      console.log(res)
    })
}

Player.on('load', Player.updateNowPlaying)

Player.on('load', function getLastfmTrackInfo(track) {
  function getName(artist) { return artist.name }

  if (Player.emitLastfmTrackInfo) {
    request('/lastfm/track/getInfo')
      .send({ 'track':  track.title
            , 'artist': track.artists.map(getName).join(' & ') })
      .type('json')
      .end(function(res) {
        Player.emit('lastfmTrackInfo', res.body)
      })
  }
})

Player.on('ended', function scrobble(track) {
  if (!this.scrobble) return

  // Do not scrobble tracks less than 30s
  // See: http://www.last.fm/api/scrobbling#when-is-a-scrobble-a-scrobble
  if (track.duration < 30) return

  var artist = track.artists.map(function(a) { return a.name }).join(' & ')
    , params = { 'title':    track.title
               , 'artist':   artist
               , 'duration': track.duration
               , 'date':     this.loadTime
               }

  if (track.album)  params.album  = track.album.title
  if (track.number) params.number = track.number

  request('/lastfm/scrobble')
    .send(params)
    .type('json')
    .end(function(res) {
      console.log(res)
    })
})

;(function(Player) {
  function canPlayType(el, playType) {
    return typeof el.canPlayType == 'function'
      ? el.canPlayType(playType) !== 'no' && el.canPlayType(playType) !== ''
      : false
  }

  var audio = cel('audio')
    , video = cel('video')

  Player.support = {
      'theora': canPlayType(video, 'video/ogg; codecs="theora, vorbis"')
    , 'h264':   canPlayType(video, 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
    , 'webm':   canPlayType(video, 'video/webm; codecs="vp8, vorbis"')
    , 'ogg':    canPlayType(audio, 'audio/ogg')
    , 'mp3':    canPlayType(audio, 'audio/mpeg')
  }
})(Player)

audio.autobuffer = true
audio.controls   = false
audio.preload    = 'auto'

//audio.addEventListener('play', function() {
//  document.title = '▶ '+ document.title
//})
Player.currentTrack = { 'duration': 60 }

Player._queue = []
Player._queueIndex = -1 // -1, means no track from the queue has been played yet

Player.queue = function(track) {
  if (typeof track == 'string') return this.queue(this.getTrackById(track))
  if (typeof track == 'number') {
    this._queueIndex = track - 1
    this.next()

    return
  }

  this._queue.push(track)

  Player.emit('queued', track, this._queue.length)

  return this
}

Player.shuffle = false
Player.repeat  = false

Player.play = function(play) {
  if (typeof play == 'string') return this.play(this.getTrackById(play))
  if (typeof play == 'object') return this.load(play).play(true)

  if (play === undefined) play = audio.paused

  if (play === false) {
    audio.pause()

    this.emit('pause')
  }
  else {
    audio.play()

    this.emit('play')
  }

  return this
}

Player.back = function() {
  window.history.back()

  this.emit('back')
}

Player.next = function() {
  // add 2 to index, as we are starting @ -1 ...
  if (Player._queue.length >= Player._queueIndex + 2) {
    Player.play(Player._queue[++Player._queueIndex])
  }
  else if (Player.shuffle) {
    var rnd     = Math.random()
      , $tracks = $('#tracks').find('tbody').children()

    // TODO: Maybe a better random algorithm?
    $tracks.eq(~~(($tracks.length+1) * rnd)).click()
  }
  else {
    var $next = $('#tracks').find('.active').next(':visible')

    if ($next.length) {
      $next.click()
    }
    else if (Player.repeat) {
      $('#tracks').find('tbody').children().eq(0).click()
    }
  }

  Player.emit('next')
}

/**
 * Function to load audio sources, loads the original file
 * plus an ogg and mp3 transcoded version
 */
function sources(audio, track) {
  var path = track.path.replace(/(.*\.).*$/, '$1')

  audio.innerHTML = ''

  src(track.path)

  if (Player.support.ogg && !/\.ogg$/.exec(track.path)) {
    src('/transcodes/'+ track._id +'.ogg')
  }

  if (Player.support.mp3 && !/\.mp3$/.exec(track.path)) {
    src('/transcodes/'+ track._id +'.mp3')
  }

  function src(path) {
    var source = cel('source')
    source.src = path
    audio.appendChild(source)
  }
}

Player.load = function(track) {
  audio.poster = null

  this.currentTrack = track
  this.loadTime     = Date.now()

  sources(audio, track)
  audio.load()

  this.emit('load', track)

  return this
}

Player.bind = function() {
  utils.bind(audio, 'volumechange', function() {
    localStorage.volume = audio.volume
  })

  utils.bind(audio, 'ended', function() {
    Player.emit('ended', Player.currentTrack)
  })

  Player.on('ended', function next(track) {
    if (this.repeat == 'one') {
      this.play(track)
    }
    else {
      this.next()
    }
  })

  var repeat  = document.getElementsByName('repeat')
    , shuffle = document.getElementById('shuffle')

  if (shuffle) this.shuffle = shuffle.checked

  for (var i = 0, l = repeat.length; i < l; ++i) {
    if (repeat[i].checked) {
      this.repeat = repeat[i].value || false; break
    }
  }

  ;['back', 'next'].forEach(function(action) {
    utils.bind(document.getElementById(action), 'click', function() {
      Player[action]()
    })
  })

  utils.bind(document, 'keyup', function(e) {
    switch (e.keyCode) {
      case 37: Player.back(); break
      case 38: Player.stop(); break
      case 39: Player.next(); break
      case 40: Player.play(); break
    }
  })

  utils.bind(window, 'hashchange', function() {
    if (location.hash) {
      var trackId = utils.Query.get('track')

      if (Player.currentTrack._id != trackId) {
        Player.play(trackId)
      }
    }
  })

  this.emit('ready')
}

function populateTrack(track) {
  track.imported = new Date(track.imported)

  if (typeof track.album == 'string') {
    track.album = Player.getAlbumById(track.album)
  }

  for (var i = 0, l = track.artists.length; i < l; ++i) {
    if (typeof track.artists[i] == 'string') {
      track.artists[i] = Player.getArtistById(track.artists[i])
    }
  }

  return track
}

Player.getAllAlbums = function(cb) {
  var self = this

  cb = cb || noop

  if (self._albums) return cb(null, self._albums)

  request('/albums/all', function(res) {
    if (res.error) return cb(res)

    sortByAlphabet(res.body, 'title')

    var map = {}
    for (var i = res.body.length; i--; ) {
      map[res.body[i]._id] = res.body[i]
    }

    albummap = map

    cb(null, self._albums = res.body)
  })
}

Player.getAllArtists = function(cb) {
  var self = this

  cb = cb || noop

  if (self._artists) return cb(null, self._artists)

  request('/artists/all', function(res) {
    if (res.error) return cb(res)

    sortByAlphabet(res.body, 'name')

    var map = {}
    for (var i = res.body.length; i--; ) {
      map[res.body[i]._id] = res.body[i]
    }

    artistmap = map

    cb(null, self._artists = res.body)
  })
}

Player.getAllTracks = function(cb) {
  cb = cb || noop

  if (this._tracks) return cb(null, this._tracks)

  var self = this
    , c    = 3
    , tracks

  request('/tracks/all', function(res) {
    if (res.error) return cb(res)

    tracks = res.body

    if (!--c) populate()
  })

  Player.getAllAlbums (function() { if (!--c) populate() })
  Player.getAllArtists(function() { if (!--c) populate() })

  function populate() {
    self._tracks = tracks = tracks.map(populateTrack)

    tracks.sort(sortByAlbum)

    cb(null, tracks)
  }
}

Player.getTrackById = function(trackId) {
  var tracks = this._tracks

  for (var i = tracks.length; i--;) {
    if (tracks[i]._id == trackId) return tracks[i]
  }

  return null
}

Player.getArtistById = function(id) {
  return artistmap[id] || null
}

Player.getAlbumById = function(id) {
  return albummap[id] || null
}

function sortByAlphabet(array) {
  var args = Array.prototype.slice.call(arguments, 1)

  array.sort(function(a, b) {
    for (var i = 0, l = args.length; i < l; ++i) {
      if (!a[args[i]]) a = ''
      else if(a)       a = a[args[i]]

      if (!b[args[i]]) b = ''
      else if(b)       b = b[args[i]]
    }

    if (a < b) return -1
    if (a > b) return  1

    return 0
  })
}

function sortByNumber(array) {
  var args = Array.prototype.slice.call(arguments, 1)

  array.sort(function(a, b) {
    for (var i = 0, l = args.length; i < l; ++i) {
      if (!a[args[i]]) a = 0
      else if(a)       a = a[args[i]]

      if (!b[args[i]]) b = 0
      else if(b)       b = b[args[i]]
    }

    if (a < b) return -1
    if (a > b) return  1

    return 0
  })
}

function sortByAlbum(a, b) {
  var a_name = a.album ? a.album.title : ''
    , b_name = b.album ? b.album.title : ''

  if (a_name < b_name) return -1
  if (a_name > b_name) return  1

  if (a.number < b.number) return -1
  if (a.number > b.number) return  1

  if (a.artists[0].name < b.artists[0].name) return -1
  if (a.artists[0].name > b.artists[0].name) return  1

  return 0
}

function cel(name) {
  return document.createElement(name)
}

return nm.Player = Player

}) })(this)
