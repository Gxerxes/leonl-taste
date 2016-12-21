var http = require('http');
var sio = require('socket.io');
var fs = require('fs');

var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync('./index.html'));
    console.log('Server started');
});
server.listen(1337);

var socket = sio.listen(server);
socket.on('connection', function(socket) {
    console.log('Client connection');

    socket.send('Hello');
    socket.on('message', function(msg) {
        console.log('Accept a message: ', msg)
    });
    socket.on('disconnect', function() {
       console.log('Client disconnect'); 
    });
});
