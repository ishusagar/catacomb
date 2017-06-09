# mean-stack-photo-app
Built on the MEAN stack, this app lets you login, upload, share, favorite and comment on photos. To login as a pre-existing example user, their login name is their last name, and the password for them all is "weak".
## Installation
Assuming you have mongo and node (and nodemon, of course) setup, install everything with
```
npm install
```
then get the database up by running in a seperate command line window

```
monogod
```

(you can reset it with `node loadDatabase.js`, and be sure you've got a database setup)

Launch your actual server with

```
nodemon webServer.js
```

and check it out on http://localhost:3000/photo-share.html
