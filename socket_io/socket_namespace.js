var http = require('http');
var express = require('express');
var sio = require('socket.io');

var app = express();
var server = http.createServer(app);
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
server.listen(1337);
var io = sio.listen(server);
var chat = io.of('/chat').on('connection', function(socket) {
    socket.send('welcome to access chat space.');
    socket.on('message', function(msg) {
        console.log('chat namespace received message: ', msg);
    });
});

var news = io.of('/news').on('connection', function (socket) {
    socket.emit('send message', 'welcome visit news namespace.');
    socket.on('send message', function(data) {
        console.log('news namespace accept send message event, data is: ', data);
    });
});