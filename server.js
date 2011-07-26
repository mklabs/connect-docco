var connect = require('connect'),
Path = require('path'),
docco = require('./lib/docconnect'),

// may one day become a configuration holder
options = {};

connect.createServer()

    .use(connect.logger())
    
    .use(docco(options))
    
    .use(connect.directory(Path.join(__dirname)))

    .use(connect.static(Path.join(__dirname)))
    
    .listen(4000);

console.log('Started on localhost:4000');