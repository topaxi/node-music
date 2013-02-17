var cache = {}

module.exports = function(req, res, next) {
  req.browser = new Browser(req.headers['user-agent'])

  next()
}

// Clear browser cache every 5 minutes
setInterval(function() {
  cache = {}
}, 1000 * 60 * 5)

function Browser(ua) {
  if (ua in cache) return cache[ua]

  ua = ua||''

  var ual = ua.toLowerCase()

  this.ua      = ua
  this.ual     = ual
  this.webkit  = false
  this.opera   = false
  this.msie    = false
  this.mozilla = false
  this.ipad    = ual.indexOf('ipad')    > 0
  this.iphone  = ual.indexOf('iphone')  > 0
  this.android = ual.indexOf('android') > 0
  this.os      = this.getOS()

  this.mobile  = this.iphone || this.android   ||
                 ual.indexOf('fennec')     > 0 ||
                 ual.indexOf('maemo')      > 0 ||
                 ual.indexOf('opera mini') > 0 ||
                 ual.indexOf('opera mobi') > 0

  this.bot     = this.getBot()

  var matches = /(webkit)[ \/]([\w.]+)/.exec(ual)              ||
                /(opera)(?:.*version)?[ \/]([\w.]+)/.exec(ual) ||
                /(msie) ([\w.]+)/.exec(ual)                    ||
                ual.indexOf('compatible') == -1 &&
                /(mozilla)(?:.*? rv:([\w.]+))?/.exec(ual)

  if (matches && matches.length >= 1) {
    this.name = matches[1]

    if (matches.length >= 2) {
      this.version = matches[2]
    }
  }

  if (this.name) this[this.name] = true

  cache[ua] = this
}

Browser.prototype.getOS = function() {
  var os = [ 'windows'
           , 'linux'
           , 'mac'
           ]

  if (this.android)             return 'android'
  if (this.iphone || this.ipad) return 'ios'

  for (var i = 0, l = os.length; i < l; ++i) {
    if (~this.ual.indexOf(os[i])) return os[i]
  }

  return null
}

Browser.prototype.getBot = function() {
  var bots = [ 'googlebot'
             , 'msnbot-media'
             , 'msnbot'
             , 'psbot'
             , 'wikiofeedbot'
             , 'slurp'
             , 'jeeves'
             , 'teoma'
             , 'baiduspider'
             ]

  for (var i = 0, l = bots.length; i < l; ++i) {
    if (~this.ual.indexOf(bots[i])) return bots[i]
  }

  return false
}
