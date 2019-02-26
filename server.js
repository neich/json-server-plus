



const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const fileUpload = require('express-fileupload');
const addAuth = require('./auth');
const addFileUpload = require('./images');
const session = require('express-session');


// PeerJS
const ExpressPeerServer = require('peer').ExpressPeerServer;
const app_ps = ExpressPeerServer(server, { debug: true });
server.use('/peerjs', app_ps);
app_ps.on('connection', function(id) {
     console.log('Peerjs connection with id=' + id)
 });


// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);
server.use(fileUpload())
server.use(session({
    secret: '63?gdº93!6dg36dºb36%Vv57V%c$%/(!V497',
    resave: true,
    saveUninitialized: true,
    secure: false
}));
server.use(jsonServer.bodyParser);

app_jsonserver = require('express').Router();
addAuth(app_jsonserver, router.db);
addFileUpload(app_jsonserver);
app_jsonserver.use(router);


// Use default router
server.use('/api', app_jsonserver);


http_server = require('http').createServer(server);

// Web Sockets
const io = require('socket.io')(http_server)
io.on('connection', function(socket){
    console.log('Websocket connection')
})


http_server.listen(3000, () => {
    console.log('JSON Server is running')
});

