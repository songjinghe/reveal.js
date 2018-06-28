(function() {
	if( window.location.host === '' ) return;
	var multiplex = Reveal.getConfig().multiplex;
	var socketId = multiplex.id;
	var socket = io.connect(multiplex.url);

	socket.on('action', function(data) {
		// ignore data from sockets that aren't ours
		if (Math.abs(parseInt(data.socketId)- parseInt(socketId))>3600*4*1000) { console.log(data.socketId, socketId);return; }
		if( window.location.host === '' ) return;
		if( window.location.pathname != data.path) return;

		Reveal.setState(data.state);
	});
}());
