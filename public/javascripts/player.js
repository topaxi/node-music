;(function() {

var window       = this
  , document     = window.document
  , location     = window.location
  , nm           = window.nm
  , audio        = nm.el('video')
  , Player       = nm.Player = { 'audio': audio }
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
  if (typeof play == 'object') return this.load(play).play(true)

  if (play === undefined) play = audio.paused

  play === false
    ? audio.pause()
    : audio.play()

  return this
}

Player.back = function() {
  window.history.back()
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

  return this
}

function createProgressbar() {
  var $audio     = $(audio)
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
  $audio.on('timeupdate progress', throttle(function(e) {
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

    $progress.mousemove(throttle(function(e) {
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

  $audio.on('timeupdate', throttle(function() {
    var currentTime = this.currentTime
      , duration    = this.duration

    $indicator.width(~~($waveform.width() / (duration || Player.currentTrack.duration) * currentTime))
    $time.text(nm.utils.formatTime(currentTime))
    $remaining.text(nm.utils.formatTime(currentTime - (duration || Player.currentTrack.duration)))
  }, 500))
}

function throttle(fun, delay) {
  var timer

  return function(a) {
    var argv    = arguments
      , context = this

    if (!timer) timer = setTimeout(function() {
      var argc = argv.length

      // Function#apply is more expensive than Function#call.
      // Most of the time, throttle is called for events which
      // pass only one argument, use Function#call for those :)
      if (argc > 1)  fun.apply(context, argv)
      else if (argc) fun.call(context, a)
      else           fun.call(context)

      timer = 0
    }, delay)
  }
}

Player.bind = function() {
  this.shuffle = $$('shuffle').is(':checked')
  this.repeat  = $$('repeat').find('input:checked').val() || false

  nm.bind(audio, 'ended', function() {
    if (Player.repeat == 'once') {
      Player.play(Player.currentTrack)
    }
    else {
      Player.next()
    }
  })

  $$('video').append(audio)

  $$('play').toggleClass('paused', audio.paused)
            .click(function() { Player.play() })

  $(audio).on('play pause', function() {
    var label = audio.paused ? 'Play' : 'Pause'
      , $play = $$('play').toggleClass('paused', audio.paused)
                          .text(label)


    if ($.ui) {
      $play.button({ 'icons': { 'primary': audio.paused
                                         ? 'ui-icon-play'
                                         : 'ui-icon-pause' }
                   , 'label': label })
    }
  })

  $$('back').click(function() { Player.back() })
  $$('next').click(function() { Player.next() })

  $(audio).click(function(e) {
    e.preventDefault()

    $(this).toggleClass('fullscreen')
  })

  $(audio).on('volumechange', function() {
    localStorage.volume = audio.volume
  })

  createProgressbar()

  $(document).on('keyup', function(e) {
    switch (e.keyCode) {
      case 37: Player.back(); break
      case 38: Player.stop(); break
      case 39: Player.next(); break
      case 40: Player.play(); break
    }
  })

  var jQueryUI = '1.8.16'

  $('head').append('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/themes/base/jquery-ui.css">')
  require(['//ajax.googleapis.com/ajax/libs/jqueryui/'+ jQueryUI +'/jquery-ui.min.js'], function() {
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

  $(window).on('hashchange', function() {
    if (location.hash) {
      var trackId = nm.utils.Query.get('track')

      if (Player.currentTrack._id != trackId) {
        $$(trackId).click()
      }
    }
  })
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

    self.loadTracks(tracks)

    cb(null, tracks)
  }
}

}())
