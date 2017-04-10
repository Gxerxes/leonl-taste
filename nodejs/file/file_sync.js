var fs = require('fs');

//async read
fs.readFile('input.txt', function(err, data) {
    if (err) {
        return console.error(err);
    }

    console.log('async read: ' + data.toString());
});


//sync read
var data = fs.readFileSync('input.txt');
console.log('sync read: ' + data.toString());

console.log('end');