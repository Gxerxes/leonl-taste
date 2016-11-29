var repl = require('repl');
var con = repl.start('$').context;
con.msg = 'example';
con.testFunction = function() {console.log(con.msg);};