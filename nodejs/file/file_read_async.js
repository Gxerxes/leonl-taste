var fs = require('fs');
var buf = new Buffer(1024);

console.log('prepare to open exist file');
fs.open('input.txt', 'r+', function(err, fd) {
    if (err) {
        return console.error(err);
    }
    console.log('file open success');
    console.log('prepare to open file');
    fs.read(fd, buf, 0, buf.length, 0, function(err, bytes) {
        if (err) {
            console.log(err);
        }

        console.log(bytes + ' bytes read');

        //only output read bytes
        if (bytes > 0) {
            console.log(buf.slice(0, bytes).toString());
        }

        //close file
        fs.close(fd, function(err) {
            if (err) {
                console.log(err);
            }
            console.log('file close success');
        });
    });
});