var fs = require('fs')
/*
exports.recursiveReaddir = function recursiveReaddir(path, cb) {
  fs.readdir(path, function(err, files) {
    if (err) return cb(err)

    var l = files.length

    files.forEach(function(file) {
      try {
        var filePath = path +'/'+ file
          , stat     = fs.statSync(filePath)

        if (stat.isDirectory()) {
          recursiveReaddir(filePath, cb)
        }
        else if(stat.isFile()) {
          cb(null, filePath)
        }
      }
      catch (err) {
        cb(err, filePath)
      }
    })
  })
}
//*/

//*
exports.recursiveReaddir = function recursiveReaddir(path, cb) {
  fs.readdir(path, function(err, files) {
    if (err) return cb(err)

    var l = files.length

    files.forEach(function(file) {
      var filePath = path +'/'+ file

      fs.stat(filePath, function(err, stat) {
        if (err) return cb(err)

        if (stat.isDirectory()) {
          recursiveReaddir(filePath, cb)
        }
        else if(stat.isFile()) {
          cb(null, filePath)
        }
      })
    })
  })
}
//*/

exports.recursiveReaddirSync = function recursiveReaddirSync(path, cb) {
  var files = fs.readdirSync(path)
    , l     = files.length

  files.forEach(function(file) {
    var filePath = path +'/'+ file
      , stat     = fs.statSync(filePath)

    if (stat.isDirectory()) {
      recursiveReaddirSync(filePath, cb)
    }
    else if(stat.isFile()) {
      cb(null, filePath)
    }
  })
}
