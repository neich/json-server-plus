# json-server with authentication, authorization, and peerjs-server added

This application is intended for web-only development purposes. It uses the node package [```json-server```](https://github.com/typicode/json-server) to automatically generate an REST API from a json database file.

This version adds:

- Authentication using express-session. Sign in, sign out, and sign up
- Authorization. You can configure some routes to be private. Only users that are signed in and are the owners of the entities can accss them
- PeerJS server. Access [peerjs-server](https://github.com/peers/peerjs-server) functionality at ´/peerjs´
- Websockets server using [socket.io](https://socket.io/)

Prerequisites:

* [Nodejs](https://nodejs.org) installed


To run the application:

- Execute `npm install`
- Execute `npm run start`
- The API is ready at `http://localhost:3000/api`
- The peerjs service is ready at `http://localhost:3000/peerjs`

# How it works

The servers reads a configuration file at startup to add the desired features. Here it is an example:

```
{
  "authentication": {
    "private": false
  },
  "authorization": [
    "orders", "users"
  ],
  "fileUpload": true,
  "filter": [
    {
      "entity": "users",
      "fields": [
        "id",
        "username"
  ]}]
}
```

### Options

#### `authentication`

This is an object that can contain a field `private`. If the fild is present, then authentication is added to the api. In this case the server assumes that there is an entity `users` int the database, and it contains the fields `username, password`. There are three new endpoints:
 
`POST /users/login`

It expects a body in the form `application/json` with a single JSON object with two fields: `username, password`. If there is a user that matches, it stores the user id in the express session and the following REST calls from the same client are authenticated.

`POST /users/logout`

It ignores the body and simple deletes the user id from the express session. All the following REST calls from the same client are not authenticated.

`GET /users/self`

If the user is authenticated, it returns a `200 OK` with the user info. If not, it returns a `400 BAD_REQUEST` with error information.


#### `authorization`


This option only activates if `authentication` is enabled. It allows to restrict access to certain entities only for the owners of those ones. For this option to work, the entity that will be subject of authorization must have a filed called `userId` which value is the id of a `users` entity (the owner).

This field contains an array of string corresponding to the entities that we want to restrict access.


#### `fileUpload`

This field has to be an object. If it is present, a new endpoint `files` is created to upload and download binary files. The object must contain a filed `dest` with a relative path to an existing folder where all files will be stored. The object may also contain a boolean field `keepNames` if yu want the files stored with the same name they get in the multi-part body.


`POST /files`

It uploads a set of files in a multi-part body. It returns an array of filenames as stored in the server.

`GET /files/:filename`

If returns the file with name `filename`.

#### `filter`

This feature allows to have restricted access to entities that you do not own. For those entities, only the fields specified in the array `fields` will be displayed. This feature should not be used at the same time that `authorization` with the same entity.

#### `service`

This feature allows to start two additional services: [peerjs](https://peerjs.com/) and [socket.io](https://socket.io/). Accepted values are `peerjs` and `ws`. There are two files in the `public` folder to test the services: `index_ws.html` and `index_peerjs.html`.
