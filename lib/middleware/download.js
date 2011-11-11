module.exports = function(req, res, next) {
  if (!~req.originalUrl.indexOf('/music')) {
    return next()
  }

  if ('download' in req.query) {
    res.attachment()
  }

  next()
}
