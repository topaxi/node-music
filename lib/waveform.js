var gd         = require('node-gd')
  , getWavInfo = require('./convert').getWavInfo
  , Binary     = require('binary')

function draw(wav, options) {
  var buf    = wav.data
    , bpcs   = wav.bitsPerSample * wav.numChannels
    , detail = options.detail * bpcs
    , word   = 'word'+ (wav.bitsPerSample == 16 ? '16ls' : '8lu')
    , rwidth = options.width
    , height = options.height
    , half   = height / 2
    // fixme, width is kinda wrong
    //, width  = ~~(buf.length / detail - buf.length / (wav.bitsPerSample * wav.numChannels) / detail)
    , width  = ~~(buf.length / (detail + bpcs / 8))
    , img    = gd.createTrueColor(width, height)

  img.alphaBlending(0)
  img.saveAlpha(1)
  img.fill(0, 0, img.colorAllocateAlpha(0, 0, 0, 127))

  var i = 0
  Binary.parse(buf)
        .loop(function(end, vars) {
          this[word]('left')
              [word]('right')
              .skip(detail) // Skip bytes
              .tap(function(sample) {
                var x = i / detail

                sample.left  =  Math.floor(Math.abs(sample.left)  / 0xFFFF * height)
                sample.right = -Math.floor(Math.abs(sample.right) / 0xFFFF * height)

                img.line(x, half - sample.left, x, half - sample.right, img.colorAllocate(options.color[0], options.color[1], options.color[2]))

                if (this.eof()) end()

                i += detail
              })
        })

  var resampled = gd.createTrueColor(rwidth, height)

  resampled.alphaBlending(0)
  resampled.saveAlpha(1)
  var trans = resampled.colorAllocateAlpha(0, 0, 0, 127)
  resampled.fill(0, 0, trans)

  img.copyResampled(resampled, 0, 0, 0, 0, rwidth, height, width, height)

  return resampled
}

exports.draw = draw
