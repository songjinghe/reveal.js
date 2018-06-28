var http        = require('http');
var express		= require('express');
var fs			= require('fs');
var io			= require('socket.io');
var crypto		= require('crypto');

var app       	= express();
var staticDir 	= express.static;
var server    	= http.createServer(app);

io = io(server);

var opts = {
	port: process.env.PORT || 8948,
	baseDir : __dirname + '/../../'
};

io.on( 'connection', function( socket ) {
	console.log("connected +1")
	socket.on('multiplex-statechanged', function(data) {
		if (typeof data.secret == 'undefined' || data.secret == null || data.secret === '') return;
		//console.log(data)
		//if (createHash(data.secret) === data.socketId) {
			data.secret = null;
			socket.broadcast.emit('action', data);
		//}
	});
});

[ 'css', 'js', 'plugin', 'lib' ].forEach(function(dir) {
	app.use('/' + dir, staticDir(opts.baseDir + dir));
});

function listDir(dir, result){
	if(result===undefined){
		result = []
	}
	var fileList = fs.readdirSync(dir,'utf-8');
	for(var i=0;i<fileList.length;i++) {
		var stat = fs.lstatSync(dir + fileList[i]);
		// 是目录，需要继续
		if (stat.isDirectory() && fileList[i].startsWith('ppt')) {
			listDir(dir + fileList[i]  + '/', result);
		} else if(fileList[i].endsWith('.html')){
			result.push(dir + fileList[i]);
		}
	}
	return result
}

function files2html(fileList, baseDir){
	var time = new Date().getTime()
	return '<ul>' + fileList.map(function(i){
		var relPath = i.substr(baseDir.length)
		return '<li><a href="/'+relPath+'?show='+time+'" target="_blank">'+relPath+'</a></li>'
	}).join('\n') + '</ul>'
}

app.get("/*.html", function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var path = decodeURI(req.path)
	console.log(path)
	var stream = fs.createReadStream(opts.baseDir + path);
	stream.on('error', function( error ) {
		res.write('can not read file ['+req.path+'], check name again.');
		res.end();
	});
	stream.on('readable', function() {
		stream.pipe(res);
	});
});

app.get("/", function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	//var stream = fs.createReadStream(opts.baseDir + '/index.html');
	//stream.on('error', function( error ) {
		var hostName = req.hostname+(opts.port==80?'':(':'+opts.port))
		var htmlFiles = listDir(opts.baseDir)
		res.write(files2html(htmlFiles, opts.baseDir, hostName));
		res.end();
	//});
	//stream.on('readable', function() {
	//	stream.pipe(res);
	//});
});

app.get("/token", function(req,res) {
	var id = req.query.t
	if(id){
		res.send({secret: createHash(id)});
	}else{
		res.send({error:'need param t.'})
	}
});

var createHash = function(secret) {
	var cipher = crypto.createCipher('blowfish', secret);
	return(cipher.final('hex'));
};

// Actually listen
server.listen( opts.port || null );

var brown = '\033[33m',
	green = '\033[32m',
	reset = '\033[0m';

console.log( brown + "reveal.js:" + reset + " Multiplex running on port " + green + opts.port + reset );