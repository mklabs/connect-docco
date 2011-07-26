var connect = require('connect'),
Path = require('path'),
docco = require('./lib/connect-docco'),

// may one day become a configuration holder
options = {};

connect.createServer()

    .use(connect.logger())

    .use(docco(__dirname, options))
    
    .use(connect.directory(__dirname))

    .use(connect.static(__dirname))
    
    .listen(4000);

console.log('Started on localhost:4000');