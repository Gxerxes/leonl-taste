var http = require('http');
var express = require('express');
var sio = require('socket.io');

var app = express();
var server = http.createServer(app);
app.get('/', function (req, res) {  
    res.sendFile(__dirname + '/index.html');
});
server.listen(1337);

var socket = sio.listen(server);
socket.on('connection', function (socket) {
    socket.emit('news', {hello: 'hello'});
    socket.on('my other event', function (data) {
        console.log('Server received: %j', data);
    });

    socket.on('set nickname', function (name) {
        // socket.set('nickname', name, function (params) {
        //     socket.emit('send nickname', name);
        // });
    });

    socket.on('get nickname', function () {
        // socket.get('nickname', function (err, name) {
        //     if (err) {
        //         socket.emit('err', err.message); 
        //     } else {
        //         socket.emit('send nickname', name);
        //     }
        // });
    });
});