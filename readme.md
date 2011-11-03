# connect-docco

Bringing the literate programing tool docco as a connect/express middleware.

Nothing fancy, the idea is to generate dynamically upon request a docco generated page from files.

or simply to get immediate results of docco against local files, which happen to be quite handy.

** New Hot Stuff:** A mix of
[docco](http://jashkenas.github.com/docco/),
[socket.io](http://socket.io/) and
[watch](https://github.com/mikeal/watch). Save files, get immediate results and
see the docco page updated automatically.


## install

    npm install connect-docco

or if you intend to use the connect-docco bin, you may want to install globally:  `npm install connect-docco -g`

## usage

### cli

    connect-docco --port 5678 --dirname ../../any/folder/you/want

command line arguments overrides the defaults configuration:

* port: 8082
* dirname: pwd

### connect middleware

Here is an example of a basic connect server setup using docco
middleware with logger, static and directory.

      connect.createServer()
        .use(connect.logger())
        .use(docco(__dirname))
        .use(connect.directory(__dirname))
        .use(connect.static(__dirname))
        .listen(8080);

The middleware handle any docco-compatible extension and `next()` to the
directory/static connect layers if the file extension is not one of the
following:

* .coffee
* .js
* .json
* .rb
* .py

You'll have to append a docco querystring parameter (eg.
`http://localhost:8082/path/to/js/files.js?docco`) to get the
output of docco for `path/to/js/files.js`

#### socket.io/watch

The docco middleware, if given an `app` instance (that is the server
created by express/connect or http.createServer), will walk the dir and
watch for any file changes. It then emits back to clients the new content
to display.

    var app = connect.createServer();

    app
      .use(connect.logger())
      .use(docco(conf.dirname, {
        // provides the app reference, so that we could add some socket.io sugar
        app: app
      }))
      .use(connect.directory(conf.dirname))
      .use(connect.static(conf.dirname))
      .listen(conf.port);

This is basic, but ends up working pretty well.
