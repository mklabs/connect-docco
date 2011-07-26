

var Path = require('path'),
connect = require('connect'),
send = connect.static.send;

// middleware
module.exports = function(options) {
	
	options = options || {};
	
	return function(req, res, next) {
		console.log('docco middleware ', req.url);
		
		
				
		return send(req, res, next, {
			path: req.url
		});
	}
};


/*
function run (port, builddir) {
  var assets;
  setupBuildDir(builddir)
  createAssets(configpath, builddir, assets, function (a) {
	assets = a
	http.createServer(function (req, resp) {
	  if (req.url === '/') {
		return assets.index.emit('request', req, resp)
	  }
	  if (req.url === '/site.rss') {
		return assets.rss.emit('request', req, resp)
	  }
	})
	.listen(port, function () {
	  console.log('http://localhost:'+port)
	})
  })

  var interval = function () {
	fullbuild(getconfig(configpath), builddir,  function () {
	  console.log('regenerated from hosts')
	  createAssets(configpath, builddir, assets, function (a) {
		assets = a
		setTimeout(interval, 1000 * 60 * 10)
	  })
	}) 
  }



*/