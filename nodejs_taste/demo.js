var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<head><meta charset="utf-8"/></head>');
    res.end('hello\n');
}).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000');