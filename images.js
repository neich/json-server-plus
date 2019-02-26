const util = require('./util')
const uuidv4 = require('uuid/v4');
const mime = require('mime-types')
const fs = require('fs');
const path = require('path')

module.exports = function (router) {

  router.post('/images', util.isAuthenticated, function (req, res) {
    var images = []
    Object.getOwnPropertyNames(req.files).forEach(function (fileName) {
      var file = req.files[fileName]
      var fname = uuidv4() + '.' + mime.extension(file.mimetype)
      fs.writeFileSync('./data/' + fname, file.data)
      router.db.get('images')
        .insert({filename: fname, userId: req.session.userId})
        .write()
      images.push(fname)
    })
    util.jsonResponse(res, images);
  })

  router.get('/images/:filename', util.isAuthenticated, function (req, res) {
    var file = router.db.get('images').find(['filename', req.params.filename]).value()
    if (file)
      res.sendFile(path.resolve('./data/' + file.filename))
    else
      util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'Image dos not exists')
  })
}

