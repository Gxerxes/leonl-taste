var express = require('express');
var middleware = require('./middleware');
var http = require('http');
var querystring = require('querystring');
var fs = require('fs');
// var mysql = require('mysql');

var app = express();

app.use('/static', middleware.setHeader());

app.get('/*', function (req, res) {
    if (res.head) {
        res.writeHead(res.statusCode, res.header);
        res.write(res.head);
        res.write('Hello');
    }
    res.end();
});

// app.get('/index.html/:id?/:name?', function (req, res) {
//     var str="";
//     if (req.params.id) {
//         str+= 'ID value: ' + req.params.id;
//     }
//     if (str!="") {
//         str+="<br/>";
//     }
//     if(req.params.name) {
//         str+= "Name value: " + req.params.name;
//     }
//     res.send(str);
// });

app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
});