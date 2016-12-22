var mongo = require('mongodb');
var host = "localhost";
var server = new mongo.Server(host, 27017, {auto_reconnect: true});
var db = new mongo.Db('node-mongo-examples', server, {safe: true});
db.open(function(err, db) {
    if(err) throw err;
    else {
        console.log('connect db succeess.');
        db.close();
    }
});
db.on('close', function(err, db) {
    if(err) throw err;
    else console.log('close db succeess')
})

// mongod.exe --logpath "d:\data\dbConf\mongodb.log" --logappend --dbpath "d:\data\db" --serviceName "myMongodbService" --serviceDisplayName "myMongodbService" --install