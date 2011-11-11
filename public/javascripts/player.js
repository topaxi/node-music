;(function() {

var window       = this
  , document     = window.document
  , location     = window.location
  , nm           = window.nm
  , Player       = nm.Player = new nm.EventEmitter
  , audio        = Player.audio = nm.el('video')
  , localStorage = window.localStorage
  , Math         = window.Math

if (!window.isNaN(localStorage.volume)) {
  audio.volume = localStorage.volume
}
else {
  localStorage.volume = audio.volume
}

audio.autobuffer = true
audio.controls   = false

//audio.addEventListener('play', function() {
//  document.title = '▶ '+ document.title
//})
Player.currentTrack = { 'duration': 60 }

Player._queue = []
Player._queueIndex = 0

Player.queue = function(track) {
  Player._queue.push(track)
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

  src()

  if (!/\.ogg$/.exec(track.path)) src('ogg')
  if (!/\.mp3$/.exec(track.path)) src('mp3')

  function src(ext) {
    var source = nm.el('source')
    source.src = ext ? path + ext : track.path
    audio.appendChild(source)
  }
}

Player.load = function(track) {
  this.currentTrack = track

  sources(audio, track)
  audio.load()

  nm.utils.Query.set('track', track._id)

  this.emit('load', track)

  return this
}

Player.bind = function() {
  nm.bind(audio, 'volumechange', function() {
    localStorage.volume = audio.volume
  })

  nm.bind(audio, 'ended', function() {
    if (Player.repeat == 'once') {
      Player.play(Player.currentTrack)
    }
    else {
      Player.next()
    }
  })

  var repeat = document.getElementsByName('repeat')

  for (var i = 0, l = repeat.length; i < l; ++i) {
    if (repeat[i].checked) {
      this.repeat = repeat[i].value || false; break
    }
  }

  this.shuffle = document.getElementById('shuffle').checked

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

  document.getElementById('video').appendChild(audio)

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
  if (typeof track.album == 'string')
    for (var i = 0, l = Player._albums.length; i < l; ++i)
      if (track.album == Player._albums[i]._id) {
        track.album = Player._albums[i]; break
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

  nm.getJSON('/albums/all', function(err, albums) {
    self.loadAlbums(albums)

    cb(err, self._albums = albums)
  })
}

Player.getAllArtists = function(cb) {
  var self = this

  cb = cb || nm.noop

  if (self._artists) return cb(null, self._artists)

  nm.getJSON('/artists/all', function(err, artists) {
    self.loadArtists(artists)

    cb(err, self._artists = artists)
  })
}

Player.getAllTracks = function(cb) {
  cb = cb || nm.noop

  if (this._tracks) return cb(null, this._tracks)

  var self = this
    , c    = 3
    , tracks

  nm.getJSON('/tracks/all', function(err, t) {
    if (err) return cb(err)

    tracks = t

    if (!--c) populate()
  })

  Player.getAllAlbums (function() { if (!--c) populate() })
  Player.getAllArtists(function() { if (!--c) populate() })

  function populate() {
    self._tracks = tracks = tracks.map(populateTrack)

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

}())
