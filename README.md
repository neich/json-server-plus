# json-server with authentication, authorization, and peerjs-server added

This application is intended for web-only development purposes. It uses the node package [```json-server```](https://github.com/typicode/json-server) to automatically generate an REST API from a json database file.

This version adds:

- Authentication using express-session. Sign in, sign out, and sign up
- Authorization. You can configure some routes to be private. Only users that are signed in and are the owners of the entities can accss them
- PeerJS server. Access [´peerjs-server´](https://github.com/peers/peerjs-server) functionality at ´/peerjs´  

To run the application:

- Execute `yarn`
- Execute `node ./server.js`
- Load `http://localhost:3000`
