;(function() {

var window       = this
  , document     = window.document
  , location     = window.location
  , nm           = window.nm
  , Player       = nm.Player = new nm.EventEmitter
  , audio        = Player.audio = nm.el(nm.theme == 'mobile' ? 'audio' : 'video')
  , localStorage = window.localStorage
  , Math         = window.Math

if (!window.isNaN(localStorage.volume)) {
  audio.volume = localStorage.volume
}
else {
  localStorage.volume = audio.volume
}

Player.emitLastfmTrackInfo = false
Player.scrobble            = false

Player.on('load', function updateNowPlaying(track) {
  if (!Player.scrobble) return

  var artist = track.artists.map(function(a) { return a.name }).join(' & ')
    , params = { 'title':    track.title
               , 'artist':   artist
               , 'duration': track.duration
               }

  if (track.album)  params.album  = track.album.title
  if (track.number) params.number = track.number

  nm.request('/lastfm/nowplaying')
    .send(params)
    .type('json')
    .end(function(res) {
      console.log(res)
    })
})

Player.on('load', function(track) {
  if (Player.emitLastfmTrackInfo) {
    function getName(artist) { return artist.name }

    nm.request('/lastfm/track/getInfo')
      .send({ 'track':  track.title
            , 'artist': track.artists.map(getName).join(' & ') })
      .type('json')
      .end(function(res) {
        Player.emit('lastfmTrackInfo', res.body)
      })
  }
})

Player.on('ended', function scrobble(track) {
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

  nm.request('/lastfm/scrobble')
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

  var audio = nm.el('audio')
    , video = nm.el('video')

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
Player._queueIndex = 0

Player.queue = function(track) {
  if (typeof track == 'string') return this.queue(this.getTrackById(track))

  this._queue.push(track)

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
  if (Player._queue.length > Player._queueIndex) {
    Player.play(Player._queue[Player._queueIndex++])
  }
  else if (Player.shuffle) {
    var rnd     = Math.random()
      , $tracks = $$('tracks').find('tbody').children()

    // TODO: Maybe a better random algorithm?
    $tracks.eq(~~(($tracks.length+1) * rnd)).click()
  }
  else {
    var $next = $$('tracks').find('.active').next(':visible')

    if ($next.length) {
      $next.click()
    }
    else if (Player.repeat) {
      $$('tracks').find('tbody').children().eq(0).click()
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
    var source = nm.el('source')
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
  nm.bind(audio, 'volumechange', function() {
    localStorage.volume = audio.volume
  })

  nm.bind(audio, 'ended', function() {
    Player.emit('ended', Player.currentTrack)
  })

  Player.on('ended', function(track) {
    if (this.repeat == 'once') {
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
    nm.bind(document.getElementById(action), 'click', function() {
      Player[action]()
    })
  })

  nm.bind(document, 'keyup', function(e) {
    switch (e.keyCode) {
      case 37: Player.back(); break
      case 38: Player.stop(); break
      case 39: Player.next(); break
      case 40: Player.play(); break
    }
  })

  nm.bind(window, 'hashchange', function() {
    if (location.hash) {
      var trackId = nm.utils.Query.get('track')

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

  for (var i = 0, l = track.artists.length; i < l; ++i)
    if (typeof track.artists[i] == 'string')
      for (var ii = 0, ll = Player._artists.length; ii < ll; ++ii)
        if (track.artists[i] == Player._artists[ii]._id) {
          track.artists[i] = Player._artists[ii]; break
        }

  return track
}

Player.getAllAlbums = function(cb) {
  var self = this

  cb = cb || nm.noop

  if (self._albums) return cb(null, self._albums)

  nm.request('/albums/all', function(res) {
    if (!res.error) {
      sortByAlphabet(res.body, 'title')

      self.loadAlbums(self._albums = res.body)
    }

    cb(res.error ? res : null, res.body)
  })
}

Player.getAllArtists = function(cb) {
  var self = this

  cb = cb || nm.noop

  if (self._artists) return cb(null, self._artists)

  nm.request('/artists/all', function(res) {
    if (!res.error) {
      sortByAlphabet(res.body, 'name')

      self.loadArtists(self._artists = res.body)
    }

    cb(res.error ? res : null, res.body)
  })
}

Player.getAllTracks = function(cb) {
  cb = cb || nm.noop

  if (this._tracks) return cb(null, this._tracks)

  var self = this
    , c    = 3
    , tracks

  nm.request('/tracks/all', function(res) {
    if (res.error) return cb(res)

    tracks = res.body

    if (!--c) populate()
  })

  Player.getAllAlbums (function() { if (!--c) populate() })
  Player.getAllArtists(function() { if (!--c) populate() })

  function populate() {
    self._tracks = tracks = tracks.map(populateTrack)

    sortByNumber(tracks, 'number')
    sortByAlphabet(tracks, 'album', 'title')

    self.loadTracks(tracks)

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

Player.getArtistById = function(artistId) {
  var artists = this._artists

  for (var i = artists.length; i--;) {
    if (artists[i]._id == artistId) return artists[i]
  }

  return null
}

Player.getAlbumById = function(albumId) {
  var albums = this._albums

  for (var i = albums.length; i--;) {
    if (albums[i]._id == albumId) return albums[i]
  }

  return null
}

Player.loadAlbums  = nm.noop
Player.loadArtists = nm.noop
Player.loadTracks  = nm.noop

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

}())
