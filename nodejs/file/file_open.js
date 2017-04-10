var fs = require('fs');

//async open file
console.log('prepare to open file');
fs.open('input.txt', 'w+', function(err, fd) {
    if (err) {
        return console.log(err);
    }

    console.log('open file success');
});


//get file info
fs.stat('input.txt', function(err, stats) {
    if (err) {
        return console.error(err);
    }

    console.log(stats);
    console.log('is File ' + stats.isFile());
    console.log('is Directory ' + stats.isDirectory());
});

//write file
fs.writeFile('input.txt', 'this is content written by me', function(err) {
    if (err) {
        return console.log(err);
    }

    console.log('write data success');
    console.log('-----------------------');
    fs.readFile('input.txt', function( err, data) {
        if (err) {
            return console.error(err);
        }
        console.log('data async read: ' + data.toString());
    })
});