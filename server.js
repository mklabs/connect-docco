var connect = require('connect'),
path = require('path'),
docco = require('./lib/connect-docco'),
console = new (require('socket.io/lib/logger'))();

// Default configuration object.
conf = { port: 8082, dirname: process.cwd()};

// handle command line arguments, if any args is matching port or dirname (as defined in `conf`),
// overrides the default `conf` object. args are defined using `-port` or `--port` followed by desired value.
process.argv.slice(2).forEach(function(val, i, arr) {
  var name = val.replace(/-/g, '');
  if(!conf[name]) return;
  conf[name] = arr[i + 1];
});

// resolve path case we get a new one from the command line
conf.dirname= path.resolve(conf.dirname);

// Create and start a basic connect server setup with the docco
// middleware preceding directory and static middlewares.
var app = connect.createServer();

app
  .use(connect.logger('   serve - :method :url - :referrer'))

  .use(docco(conf.dirname, {
    // provides the app reference, so that we could add some socket.io sugar
    app: app,

    // also you'll need to give it the running port, this is used to correctly
    // setup the socket.io client code.
    port: conf.port
  }))

  .use(connect.directory(conf.dirname))

  .use(connect.static(conf.dirname))

  .listen(conf.port);

console.info('Serving ', conf.dirname, 'files... Started on localhost:', conf.port);
