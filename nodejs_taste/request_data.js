var http = require('http');
var options = {
    hostname: 'www.microsoft.com',
    port: 80,
    path: '/',
    method: 'GET'
};
var req = http.request(options, function(res) {
    console.log('Status code: ' + res.statusCode);
    console.log('Response head: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
        console.log('Response content: ' + chunk);
    });
});
req.end();