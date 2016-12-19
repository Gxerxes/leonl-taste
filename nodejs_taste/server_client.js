var http = require('http');
var fs = require('fs');

var server = http.createServer(function (req, res) {
    if (req.url !== "/favicon.ico") {
        var out = fs.createWriteStream('./request.log');
        out.write('Client request method: ' + req.method + '\r\n');
        out.write('Client request url: ' + req.url + '\r\n');
        out.write('Client request head: ' + JSON.stringify(req.headers) + '\r\n');
        out.end('Client request HTTP version: ' + req.httpVersion);

        req.on('data', function (data) {
            console.log('Server accept data: ' + decodeURIComponent(data));
        });
        req.on('end', function () {
            console.log('accept finished')
        })
    }

    res.end();
}).listen(1337, "127.0.0.1")