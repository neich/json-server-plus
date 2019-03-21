const util = require('./util');
const uuidv4 = require('uuid/v4');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
var multer = require('multer');

module.exports = function (router, db, configUpload) {

    var dest = path.resolve(configUpload.dest);

    if (!fs.existsSync(dest))
        throw new Error("Destination path for file upload dons not exists: " + dest);

    var upload = multer({dest: dest});

    router.post('/files', util.isAuthenticated, upload.any(), function (req, res) {
        var images = [];
        for (var i = 0; i < req.files.length; i++) {
            var file = req.files[i];
            var fname;
            if (configUpload.keepNames) {

                fname = file.originalname;
                fs.renameSync(path.join(dest, file.filename), path.join(dest, fname));
            }
            else {
                fname = file.filename + '.' + mime.extension(file.mimetype);
                fs.renameSync(path.join(dest, file.filename), path.join(dest, fname));
            }
            db.get('files')
                .insert({filename: fname, userId: req.session.userId})
                .write();
            images.push(fname)
        }
        util.jsonResponse(res, images);
    });

    router.get('/files/:filename', util.isAuthenticated, function (req, res) {
        var file = db.get('files').find(['filename', req.params.filename]).value();
        if (file)
            res.sendFile(path.join(dest, file.filename));
        else
            util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'Image dos not exists')
    })
};

