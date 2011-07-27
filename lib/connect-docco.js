// You probably already know [Docco](http://jashkenas.github.com/docco/). It produces HTML that displays your comments alongside your code. Comments are passed through [Markdown](http://daringfireball.net/projects/markdown/syntax), and code is passed through [Pygments](http://pygments.org/) syntax highlighting.
//
// docco is designed as a command line tool, and primary for generating documentation.
//
// The following is a slight variation of docco, designed to be run as a connect middleware. It allows one to generate docco page upon requests and respond the docco ouput instead of writing to the filesystem.
// 
// Could be a great fit for technical bloggers or simply to get immediate results of docco against local files, which happen to be quite handy.
// 
// What follows is for the most part coming from docco itself.

// ##### fun things starting there

// ### Setup

var Path = require('path'),
Url = require('url'),
fs = require('fs'),
ghm = require('github-flavored-markdown'),
prettify = require('../support/prettify'),
spawn = require('child_process').spawn,
send, parse, highlight,

// The start of each Pygments highlight block.
highlight_start = '<div class="highlight"><pre>',

// The end of each Pygments highlight block.
highlight_end = '</pre></div>',

// Micro-templating, originally by John Resig, borrowed by way of [Underscore.js](http://documentcloud.github.com/underscore/).
template = function(str) {
  return new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + 'with(obj){p.push(\'' + str.replace(/[\r\t\n]/g, " ").replace(/'(?=[^<]*%>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<%=(.+?)%>/g, "',$1,'").split('<%').join("');").split('%>').join("p.push('") + "');}return p.join('');");
},

// Create the template that we will use to generate the Docco HTML page.
docco_template = template(fs.readFileSync(__dirname + '/../node_modules/docco/resources/docco.jst').toString()),

// The CSS styles we'd like to apply to the documentation.
docco_styles = fs.readFileSync(__dirname + '/../node_modules/docco/resources/docco.css').toString(),

// The request handler for the special `docco.css` req.url case
docco_css = function(req, res, next) {
  res.setHeader('Content-Type', 'text/css');
  res.end(docco_styles);
},

// A list of the languages that Docco supports, mapping the file extension to the name of the Pygments lexer and the symbol that indicates a comment. To add another language to Docco's repertoire, add it here.
languages = {
  '.coffee': {
    name: 'coffee-script',
    symbol: '#'
  },
  '.js': {
    name: 'javascript',
    symbol: '//'
  },
  '.json': {
    name: 'javascript',
    symbol: '//'
  },
  '.rb': {
    name: 'ruby',
    symbol: '#'
  },
  '.py': {
    name: 'python',
    symbol: '#'
  }
},

// Get the current language we're documenting, based on the extension.
get_language = function get_language(source) {
  return languages[Path.extname(source)];
};

// Build out the appropriate matchers and delimiters for each language.
for (var ext in languages) {
  l = languages[ext];
  // Does the line begin with a comment?
  l.comment_matcher = new RegExp('^\\s*' + l.symbol + '\\s?');
  // Ignore [hashbangs](http://en.wikipedia.org/wiki/Shebang_(Unix)) and interpolations...
  l.comment_filter = new RegExp('(^#![/]|^\\s*#\\{)');
  // The dividing token we feed into Pygments, to delimit the boundaries between sections.
  l.divider_text = '\n' + l.symbol + 'DIVIDER\n';
  // The mirror of `divider_text` that we expect Pygments to return. We can split on this to recover the original sections. Note: the class is "c" for Python and "c1" for the other languages
  l.divider_html = new RegExp('\\n*<span class="c1?">' + l.symbol + 'DIVIDER<\\/span>\\n*');
}

// ### Middleware
// Create and expose the middleware and request handler.
module.exports = function(root, options) {
	
	// root required
  if (!root) throw new Error('nocco() root path required');
	return function(req, res, next) {
    return send(req, res, next, {
		  root: root,
			path: req.url
		});
	};
};

// Send function, similar to the static middleware send function.
send = exports.send = function send(req, res, next, options) {
  options = options || {};
  if (!options.path) throw new Error('path required');
  
  // setup
  var root = options.root ? Path.normalize(options.root) : null;
  
  // ignore non-GET requests
  if ('GET' != req.method && !head) return next();
  
  // parse url
  var url = Url.parse(options.path),
    path = decodeURIComponent(url.pathname),
    type;
    

  // join / normalize from optional root dir
  path = Path.normalize(Path.join(root, path));
    
  // if req is docco.css, send it to the client
  if(path.match(/docco\.css/)) {
    return docco_css(req, res, next); 
  }
    
    // requested file extension not supported by docco, fallback silently
  if(!get_language(path)) return next();
  
  fs.stat(path, function(err, stat) {
    // ignore ENOENT
    if (err) {
      return 'ENOENT' == err.code ? next() : next(err);
    // ignore directories
    } else if (stat.isDirectory()) {
      return next();
    }
    
    // Generate the documentation for a source file by reading it in, splitting it up into comment/code sections, highlighting them for the appropriate language, and merging them into an HTML template.
    fs.readFile(path, 'utf8', function(err, content) {
      if(err) return next(err);
      
      var sections = parse(path, content);
      return highlight(path, sections, function() {
          var title = Path.basename(path),
          html = docco_template({
            title: title,
            sections: sections,
            sources: [],
            path: path,
            style: docco_styles,
            destination: 'dtc'
          });
          
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
      });
    });
  });
};

// ### Generation function

// Given a string of source code, parse out each comment and the code that follows it, and create an individual **section** for it.
parse = function parse(source, code) {
  var code_text, docs_text, has_code, language, line, lines, save, sections, _i, _len;
  lines = code.split('\n');
  sections = [];
  language = get_language(source);
  has_code = docs_text = code_text = '';
  
  save = function(docs, code) {
    return sections.push({
      docs_text: docs,
      code_text: code
    });
  };
  
  lines.forEach(function(line) {
    if (line.match(language.comment_matcher) && !line.match(language.comment_filter)) {
      if (has_code) {
        save(docs_text, code_text);
        has_code = docs_text = code_text = '';
      }
      docs_text += line.replace(language.comment_matcher, '') + '\n';
    } else {
      has_code = true;
      code_text += line + '\n';
    }
  });
  save(docs_text, code_text);
  return sections;
};

// Highlights a single chunk of CoffeeScript code, using **Pygments** over stdio, and runs the text of its corresponding comment through **Markdown**, using the **Github-flavored-Markdown** modification of [Showdown.js](http://attacklab.net/showdown/).
highlight = function highlight(source, sections, callback) {
  var language = get_language(source);
  
  if(!language) return callback();
  
  // Main processing: Builds for each sections, build according docs_html/code_html.
  sections.forEach(function(section, i) {
    // var output = output.replace(highlight_start, '').replace(highlight_end, '');
    // var fragments = output.split(language.divider_html);
    console.log(section);
    //section.code_html = fragments['Totally foobar'];
    
    section.code_html = prettify.prettyPrintOne(section.code_text);
    section.docs_html = ghm.parse(section.docs_text);
    
  });
  
  return callback();
};



highlightt = function highlightt(source, sections, callback) {
  var language, output, pygments, section;
  language = get_language(source);
  output = '';
  
  // requested file extension not support by docco, fallback silently
  if(!language) return callback();
  
  pygments = spawn('pygmentize', ['-l', language.name, '-f', 'html', '-O', 'encoding=utf-8']);
  pygments.stderr.addListener('data', function(error) {
    if (error) {
      return console.error(error);
    }
  });
  pygments.stdout.addListener('data', function(result) {
    if (result) {
      output = output + result;
    }
  });
  pygments.addListener('exit', function() {
    var fragments, i, section, _len;
    output = output.replace(highlight_start, '').replace(highlight_end, '');
    fragments = output.split(language.divider_html);
    for (i = 0, _len = sections.length; i < _len; i++) {
      section = sections[i];
      section.code_html = highlight_start + fragments[i] + highlight_end;
      section.docs_html = ghm.parse(section.docs_text);
    }
    return callback();
  });
  pygments.stdin.write(((function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sections.length; _i < _len; _i++) {
      section = sections[_i];
      _results.push(section.code_text);
    }
    return _results;
  })()).join(language.divider_text));
  return pygments.stdin.end();
};