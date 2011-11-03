var connect = require('connect'),
path = require('path'),
docco = require('./lib/connect-docco'),

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
  .use(connect.logger())

  .use(docco(conf.dirname, {
    // pass in the app reference, so that we could
    // add some socket.io sugar
    app: app
  }))

  .use(connect.directory(conf.dirname))

  .use(connect.static(conf.dirname))

  .listen(conf.port);

console.log('Serving ', conf.dirname, 'files... Started on localhost:', conf.port);
