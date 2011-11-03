# connect-docco

Bringing the literate programing tool docco as a connect/express middleware.

Nothing fancy, the idea is to generate dynamically upon request a docco generated page from files.

or simply to get immediate results of docco against local files, which happen to be quite handy.


## install

    npm install connect-docco

*or if you intend to use the connect-docco bin, you should install
globally:  `npm install connect-docco -g`

## usage

##### cli

    connect-docco --port 5678 --dirname ../../any/folder/you/want

command line arguments overides the defaults configuration:

* port: 8082
* dirname: pwd

##### connect middleware

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


