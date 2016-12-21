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
    socket.emit('news', {hello: 'hello.'});
    socket.on('my other event', function (data) {
       console.log('Server accept data: %j', data); 
    });
    socket.emit('setName', 'leon', function(data1, data2) {
        console.log(data1);
        console.log(data2);
    });
    socket.on('message', function(msg) {
        console.log('Accept a message: ', msg)
    });
    socket.on('disconnect', function() {
       console.log('Client disconnect'); 
    });
});
