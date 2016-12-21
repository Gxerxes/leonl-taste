var http = require('http');
var express = require('express');
var sio = require('socket.io');

var app = express();
var server = http.createServer(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
server.listen(1337);
var io = sio.listen(server);
var names = [];
io.sockets.on('connection', function (socket) {
    socket.emit('login', names);
    socket.on('login', function (name) {
        names.push(name);
        io.sockets.emit('login', names);
        socket.emit('login', names);
        socket.broadcast.emit('login', names);
    });
});