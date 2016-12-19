var http = require('http');
var url = require('url');

var server = http.createServer().listen(1337, 'localhost');
server.on('request', function (req, res) {
    if (req.url !== "/favicon.ico") {
        res.writeHead(200, { 'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': 'http://localhost'});
        res.write('<html><head><meta charset="utf-8" /><head>');
        var url_parts = url.parse(req.url);
        
        switch(url_parts.pathname) {
            case '/':
            case '/index.html':
                res.write('<body>Website first page.</body>/<html>');
                break;
            default:
                res.write('<body>You are now visiting' + url_parts.pathname + '</body></html>');
        }
    }
    res.end();
});