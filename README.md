# json-server for nodebb

This application is intended for web-only development purposes. It uses the node package [```json-server```](https://github.com/typicode/json-server) to automatizally generate an REST API from a json database file.

It is a replacement for the full-blown node application on the parent directory that uses Express+Sequelize and a proper database server. 

To run the application:

- Execute `npm install`
- Execute `npm start`
- Load `http://localhost:3000`

Before executing these steps, the web application has to be already generated in the parent ```../public``` folder (webpack)