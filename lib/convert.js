var exec   = require('child_process').exec
  , fs     = require('fs')
  , path   = require('path')
  , nice   = 'nice -n19'
  , ffmpeg = '/usr/bin/ffmpeg -vn'
  , Binary = require('binary')

function decode(file, cb) {
  var tmp = '/tmp/__node-music_'+ path.basename(file) +'.tmp.wav'

  fs.unlink(tmp, function() {
    //exec(ffmpeg +' -i "'+ file  +'" -ar 11025 -ac 1 '+ tmp, function(err) {
    exec(ffmpeg +' -i "'+ file  +'" -ar 4000 '+ tmp, function(err) {
      if (err) return cb(err)

      var stream = fs.createReadStream(tmp)

      stream.on('close', function() { fs.unlink(tmp) })

      cb(null, stream)
    })
  })
}

function transcode(file, options, cb) {
  var ext     = /.*\.(.*)$/.exec(file)
    , bitrate = options.bitrate || '64k'
    , codecs  = options.codecs  || [ 'ogg' ]
    , c       = codecs.length

  if (!ext) {
    return cb(new Error('Could not match file extension in "'+ file +'"!'))
  }

  codecs.forEach(function(codec) {
    var out = file.replace(new RegExp('.'+ ext[1] +'$'), '.'+ codec)

    fs.stat(out, function(err) {
      if (!err) return fireCallback()

      console.log('Started transcoding of "%s"', out)

      var cmd = [ nice, ffmpeg
                , '-i', '"'+ file +'"'
                , '-ab', bitrate
                , '-acodec', codec == 'ogg' ? 'libvorbis' : 'libmp3lame'
                , '"'+ out +'"'
                ].join(' ')

      exec(cmd, fireCallback)
    })

    function fireCallback() {
      if (!--c) cb(null)
    }
  })
}

function getWavInfo(file, cb) {
  cb = cb || function() { }

  decode(file, function(err, s) {
    if (err) return cb(err)

    Binary.stream(s)
      // RIFF
      .word32bu('chunkID')
      .word32lu('chunkSize')
      .word32bu('format')
      // FMT
      .word32bu('subchunk1ID')
      .word32lu('subchunk1Size')
      .word16lu('audioFormat')
      .word16lu('numChannels')
      .word32lu('sampleRate')
      .word32lu('byteRate')
      .word16lu('blockAlign')
      .word16lu('bitsPerSample')
      // DATA
      .word32bu('subchunk2ID')
      .word32lu('subchunk2Size')
      .tap(function(wav) {
        this.buffer('data', wav.subchunk2Size)
            .tap(function() { cb(null, wav) })
      })
  })
}

exports.decode     = decode
exports.getWavInfo = getWavInfo
exports.transcode  = transcode
