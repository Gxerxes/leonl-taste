var fs = require('fs');
var buf = new Buffer(1024);

console.log('prepare to open file');
fs.open('input.txt', 'r+', function (err, fd) {
    if (err) {
        return console.error(err);
    }

    console.log('file open success');
    console.log('truncate last 10 bytes content.');

    // truncate file
    fs.ftruncate(fd, 10, function(err) {
        if (err) {
            console.log(err);
        }

        console.log('file truncate success');
        console.log('read same file');

        fs.read(fd, buf, 0, buf.length, 0, function(err, bytes) {
            if (err) {
                console.log(err);
            }

            // only output read bytes
            if (bytes > 0) {
                console.log(buf.slice(0, bytes).toString());
            }

            // close file
            fs.close(fd, function(err) {
                if (err) {
                    console.log(err);
                }
                console.log('file close success');
            });
        });

    });
});