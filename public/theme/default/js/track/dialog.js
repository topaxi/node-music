define(['theme', 'jquery', 'jquery-ui'], function(theme, $) {
  var dialog   = {}
    , template = [ '<div><form name="trackForm">'
                   , '<input name="_id" type="hidden">'
                   , '<label class="db">Title: <input name="title"></label>'
                   , '<label class="db">Artist: <input name="artists[]"></label>'
                   //, '<label class="db">Original: <input name="remixOf"></label>'
                   , '<label class="db">Album: <input name="album" disabled></label>'
                   , '<label class="db">Track Nr: <input name="number"></label>'
                   , '<label class="db" title="Comma separated">Genres: <input name="genres"></label>'
                   , '<label class="db" title="Comma separated">Tags: <input name="tags"></label>'
                   , '<label class="db">Year: <input name="year"></label>'
                   , '<label class="db">Imported: <input name="imported" disabled></label>'
                 , '</form></div>'
                 ].join('')

  dialog.show = function(track) {
    var $dialog = $(template).appendTo('body')
      , form    = document.trackForm

    $dialog.attr('title', 'Edit track information of '+ track.title)

    form._id.value  = track._id

    form.title.value  = track.title
    form['artists[]'].value = track.artists[0].name

    if (track.album)  form.album.value  = track.album.title
    if (track.number) form.number.value = track.number
    if (track.year)   form.year.value   = +track.year || ''

    form.genres.value   = track.genres.join(', ')
    form.tags.value     = track.tags.join(', ')
    form.imported.value = track.imported

    $dialog.dialog({
        buttons: { 'Cancel': function() { $dialog.dialog('close') }
                 , 'Ok':     function() {
                               save(serialize(form), track)
                               $dialog.dialog('close')
                             }
                 }
      , close: function() { $dialog.remove() }
    })
  }

  function save(updates, track) {
    nm.request.post('/track/update')
              .set('Accept', 'application/json')
              .send(updates)
              .type('json')
              .end(function(res) {
                if (!res.ok) return alert(res.body.error.message)

                var track = nm.Player.getTrackById(res.body._id)

                track.title   = res.body.title
                track.artists = res.body.artists.map(function(id) { return nm.Player.getArtistById(id) })
                //track.album   = nm.Player.getAlbumById(res.body.album)
                track.tags    = res.body.tags
                track.genres  = res.body.genres
                track.number  = res.body.number
                track.year    = res.body.year

                $('#'+ track._id).replaceWith(theme.trackrow(track))
              })
  }

  function serialize(form) {
    var seri = {}

    $(form).serializeArray().forEach(function(data) {
      var name  = data.name
        , value = data.value

      if (name.slice(-2) == '[]') {
        name = name.slice(0, -2)

        if (seri[name]) {
          seri[name].push(value)
        }
        else {
          seri[name] = [value]
        }
      }
      else {
        if (name == 'tags' || name == 'genres') {
          value = value.split(',').map(function(val) { return val.trim() })
        }

        seri[name] = value
      }
    })

    return seri
  }

  return dialog
})
