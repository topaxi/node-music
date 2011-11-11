#!/usr/bin/env node

var options = { 'library':   './public/music'
              , 'codecs':    [ 'mp3', 'ogg' ]
              , 'bitrate':   '128k'
              }


///////////////////////////////////////////////////////////////////////////////

var transcode = require('./lib/convert').transcode
  , readSync  = require('./lib/fs').recursiveReaddirSync
  , files     = []

readSync(options.library, function(err, path) {
  if (err) throw err

  files.push(path)
})

;(function transcodeTrack(i) {
  if (i == files.length) process.exit()

  var path = files[i++]

  transcode(path, options, function(err) {
    if (err) return console.log(err)

    console.log('Transcoding of "%s" done!', path)

    transcodeTrack(++i)
  })
})(0)
