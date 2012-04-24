var request = require('superagent')
  , User    = require('../lib/model/user')

function getUser(email, cb) {
  User.findOne({ 'email': email }, function(err, user) {
    if (err) return cb(err)

    if (!user) {
      user        = new User
      user.email  = email
      user.joined = new Date
      user.admin  = false
      user.save(function(err) {
        cb(err, user)
      })
    }
    else {
      cb(err, user)
    }
  })
}

module.exports = function(http) {
  http.post('/login', function(req, res, next) {
    request.post('https://browserid.org/verify')
           .set('Content-Type', 'application/x-www-form-urlencoded')
           .send({ 'assertion': req.body.assertion
                 , 'audience' : req.headers.host
                 })
           .end(function(rres) {
             if (!rres.ok) return next(new Error(rres.text))

             getUser(rres.body.email, function(err, user) {
               if (err) return next(err)

               req.session.user = user

               res.send({ 'email':  user.email
                        , 'lastfm': user.lastfm
                        })
             })
           })
  })

  http.get('/login/user', function(req, res) {
    res.send(req.session.user)
  })

  http.post('/login/whoami', function(req, res) {
    if (req.session && req.session.user) {
      res.send({ 'email':  req.session.user.email
               , 'lastfm': req.session.user.lastfm
               })
    }
    else {
      res.send(0)
    }
  })

  http.post('/login/logout', function(req, res) {
    req.session.user = null

    res.send(true)
  })
}
