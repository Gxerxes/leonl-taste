var http = require('http');

var server = http.createServer(function(req, res) {

}).listen(1337, '127.0.0.1');

server.on('listening', function() {
    console.log('Server start listening.');
    //server.close();
});

server.on('close', function() {
    console.log('Server is closed.');
})

server.on('error', function(e) {
    if (e.code == 'EADDRINUSE') {
        console.log('Port is taken');
    }
});