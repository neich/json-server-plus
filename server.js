var fs = require('fs');
const jsonServer = require('json-server');
const jsServer = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const expressSession = require('express-session');
const sharedSession = require("express-socket.io-session");
const Auth = require('./auth');


// Set default middlewares (logger, static, cors and no-cache)
let session = expressSession({
    secret: '63?gdº93!6dg36dºb36%Vv57V%c$%/(!V497',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
});
jsServer.use(session);
jsServer.use(middlewares);
jsServer.use(jsonServer.bodyParser);

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let configuredRouter = Auth.configure(router, config);

jsServer.use('/api', configuredRouter);

http_server = require('http').createServer(jsServer);

if (config.service)
    if (config.service === 'peerjs') initPJS();
    else initWS();

let port = config.port || 3000;

http_server.listen(port, () => {
    console.log('JSON Server is running on port ' + port)
});


function initWS() {
    console.log('Starting socket.io server ...');

    // Web Sockets
    const socketIO = require('socket.io')(http_server);
    socketIO.use(sharedSession(session));

    const wsConnections = {};

    socketIO.on('connection', function (socket) {
        console.log('Websocket connection');
        let username = socket.handshake.session.username;
        if (!wsConnections[username]) wsConnections[username] = socket;

        socket.on('connected', function (data) {
            console.log("Connected!");
        })

        socket.on('message', function (data) {
            let kk = socketIO.clients;
            if (socket.handshake.session.username) {
                const destSocket = wsConnections[data.dest];
                if (destSocket) {
                    console.log('Message: ' + data.message + ' from user ' + username + ', to ' + data.dest);
                    wsConnections[data.dest].emit('message', {
                        message: data.message,
                        from: socket.handshake.session.username
                    });
                }
            } else {
                console.log('User not logged in. Message: ' + data.message + ', to ' + data.dest);
            }
        });
    });
}

function initPJS() {

    console.log('Starting peerjs server ...');

    const app_ps = require('peer').ExpressPeerServer(http_server, {debug: false, allow_discovery: true});

    jsServer.use('/peerjs', app_ps);
    app_ps.on('connection', function (id) {
        console.log('Peerjs connection with id=' + id)
    });

}
