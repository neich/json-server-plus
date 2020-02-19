const validate = require('jsonschema').validate;
const util = require('./util');
const addFileUpload = require('./files');

const configSchema = {
    properties: {
        authentication: {
            type: 'object',
            properties: {
                private: {
                    type: 'boolean'
                }
            }
        },
        authorization: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        fileUpload: {
            type: 'object',
            properties: {
                dest: {
                    type: 'string',
                    required: true
                },
                keepNames: {
                    type: 'boolean'
                }
            }
        },
        filter: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    entity: {
                        type: 'string',
                        required: true
                    },
                    fields: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        required: true
                    }
                }
            }
        },
        port: {
            type: 'number'
        },
        service: {
            type: 'string',
            pattern: '(peerjs|ws)'
        }

    }
};




const userSchemaLogin = {
    properties: {
        username: {
            type: 'string',
            required: true
        },
        password: {
            type: 'string',
            required: true
        }
    }
};

const userSchemaRegister = {
    properties: {
        username: {
            type: 'string',
            required: true
        },
        password: {
            type: 'string',
            required: true
        },
        email: {
            type: 'string',
            required: true
        }
    }
};


const Auth = {
    addAuthentication: function (router, db, private) {
        router.post('/users/login', util.isNotAuthenticated, function (req, res) {
            const v = validate(req.body, userSchemaLogin);

            if (!v.valid)
                util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, util.jsonSchemaError(v));
            else {
                const user = db.get('users').find(['username', req.body.username]).value();
                if (user) {
                    if (user.id === req.session.userId)
                        util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'User already authenticated');
                    else if (user.password === req.body.password) {
                        req.session.userId = user.id;
                        req.session.username = user.username;
                        util.jsonResponse(res, {id: user.id, username: user.username})
                    } else
                        util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'Password do not match')
                } else
                    util.sendError(res, 400, util.Error.ERR_AUTHENTICATION, 'User <' + req.body.username + '> does not exists')
            }
        });

        router.post('/users/logout', util.isAuthenticated, function (req, res) {
            delete req.session['userId'];
            delete req.session['username'];
            util.jsonResponse(res, 'User logged out successfully')
        });

        router.post('/users', util.isNotAuthenticated, function (req, res) {
            const v = validate(req.body, userSchemaRegister);
            if (!v.valid)
                util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, util.jsonSchemaError(v));
            else {
                db
                    .get('users')
                    .insert({
                        username: req.body.username,
                        email: req.body.email,
                        password: req.body.password
                    })
                    .write();
                util.jsonResponse(res, 'User created successfully')
            }
        });

        router.get('/users/self', util.isAuthenticated, function (req, res) {
            const user = db.get('users').find(['id', req.session.userId]).value();
            util.jsonResponse(res, user)
        });

        if (private) {
            router.use('/users', function (req, res) {
                util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'Access to users is forbidden');
            })
        }
    },

    addAuthorization: function (router, db, routes) {
        function addAuthorization(router, entity) {

            function authMiddleware(req, res, next) {
                if (req.params.id) {
                    let obj = db.get(entity).find(['id', parseInt(req.params.id)]).value();
                    if (obj && obj.userId === req.session.userId)
                        next();
                    else
                        util.sendError(res, 400, util.Error.ERR_BAD_REQUEST, 'You don\'t have permissions to access this object')
                } else {
                    req.query.userId = req.session.userId.toString();
                    next()
                }
            }

            router.use('/' + entity + '/:id', util.isAuthenticated, authMiddleware);
            router.use('/' + entity, util.isAuthenticated, authMiddleware);
        }

        // Call this function for each entity that has ownership wrt users
        for (var route of routes)
            addAuthorization(router, route);
    },

    addFilter: function (router, db, entity, fields) {
        router.use('/' + entity, util.isAuthenticated, function (req, res, next) {
            let _jsonp = res.jsonp;
            res.jsonp = function (obj) {
                if (obj instanceof Array) {
                    for (let item of obj) {
                        if (entity === 'users' || (item.userId && item.userId !== req.session.userId))
                            for (let key of Object.getOwnPropertyNames(item)) {
                                if (key && fields.indexOf(key) === -1)
                                    delete item[key]
                            }
                    }
                }
                _jsonp.call(res, obj)
            };
            next();
        });
    },

    configure(router, config) {

        const v = validate(config, configSchema);

        if (!v.valid)
            throw new Error(util.jsonSchemaError(v));


        let configuredRouter = require('express').Router();

        if (config.authentication)
            Auth.addAuthentication(configuredRouter, router.db, config.authentication.private);

        if (config.authorization) {
            if (!config.authentication)
                throw new Error('Authorization cannot be enabled without authentication');
            Auth.addAuthorization(configuredRouter, router.db, config.authorization);
        }

        if (config.fileUpload)
            addFileUpload(configuredRouter, router.db, config.fileUpload);

        if (config.filter)
            for (let f of config.filter)
                Auth.addFilter(configuredRouter, router.db, f.entity, f.fields);

        configuredRouter.use(router);

        return configuredRouter;
    }
};

module.exports = Auth;
