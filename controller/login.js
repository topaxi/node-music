var request = require('superagent')
  , User    = require('../lib/model/user')

function getUser(email, cb) {
  User.findOne({ 'email': email }, function(err, user) {
    if (err) return cb(err)

    if (!user) {
      user        = new User
      user.email  = email
      user.joined = new Date
      user.save()
    }

    cb(null, user)
  })
}

module.exports = function(http) {
  http.post('/login', function(req, res, next) {
    request.post('https://browserid.org/verify')
           .set('Content-Type', 'application/x-www-form-urlencoded')
           .data({ 'assertion': req.body.assertion
                 , 'audience' : req.headers.origin
                 })
           .end(function(err, rres) {
             if (err) return next(err)

             getUser(rres.body.email, function(err, user) {
               req.session.user = user

               res.send(rres.body)
             })
           })
  })

  http.get('/login/user', function(req, res) {
    res.send(req.session.user)
  })

  http.post('/login/whoami', function(req, res) {
    res.send(req.session && req.session.user && req.session.user.email)
  })

  http.post('/login/logout', function(req, res) {
    req.session.user = null

    res.send(true)
  })
}
