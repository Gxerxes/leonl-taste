var mongo = require('mongodb');
var host = "localhost";
var server = new mongo.Server(host, 27017, {auto_reconnect: true});
var db = new mongo.Db('node-mongo-examples', server, {safe: true});

var docs = [{type: 'food', price: 11},
            {type: 'food', price: 10},
            {type: 'food', price: 9},
            {type: 'food', price: 8},
            {type: 'book', price: 9}];

db.open(function(err, db) {
    // if(err) throw err;
    // else {
    //     console.log('connect db succeess.');
    //     db.close();
    // }
    db.collection('goods', function(err, collection) {
        collection.insert(docs, function(err, docs) {
            if(err) throw err;
            else {
                collection.find({type: 'food', price: {$lt: 10}}).toArray(
                function(err, docs) {
                    if(err) throw err;
                    else {
                        console.log(docs);
                        db.close();
                    }
                });
            }
        });
    });

    db.collection('users', function(err, collection) {
        collection.insert({username: 'leon', firstname: 'li'}, 
        function(err, docs) {
            if(err) throw err;
            else {
                console.log(docs);
                //db.close(false);
            }
        });
    });

    db.collection('users', function(err, collection) {
        if(err) throw err;
        else {
            collection.find({}).toArray(function(err, docs) {
                if(err) throw err;
                else {
                    console.log(docs);
                    db.close();
                }
            });
        }
    });
});
db.on('close', function(err, db) {
    if(err) throw err;
    else console.log('close db succeess')
});
// db.once('close', function(err, db) {
//     console.log(db);
//     if(err) throw err;
//     else {
//         db.open(function(err, db) {
//             db.collection('users', function(err, collection) {
//                 collection.insert({username: 'Jo', firstname: 'Jo'},
//                 function(err, docs) {
//                     if(err) throw err
//                     else {
//                         console.log(docs);
//                         db.close(true);
//                     }
//                 });
//             });
//         });
//     }
// });