var fs = require('fs');

console.log('create directory /tmp/test');
fs.mkdir('./tmp', function(err) {
    if (err) {
        return console.error(err);
    }
    console.log('directory create success');
});

fs.readdir('.', function(err, files) {
    if (err) {
        return console.error(err);
    }
    files.forEach(function (file) {
        console.log(file);
    });
});

fs.rmdir('./tmp', function (err, files) {
    if (err) {
        return console.error(err);
    }
    
    files.forEach(function (file) {
        console.log(file);
    });
});