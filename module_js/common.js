// CommonJS on the other hand takes a server-first approach, 
// assuming synchronous behaviour, 
// no global baggage as John Hann would refer to it as and it attempts to cater for the future (on the server). 
// What we mean by this is that because CJS supports unwrapped modules, 
// it can feel a little more close to the ES.next/Harmony specifications, 
// freeing you of the define() wrapper that AMD enforces.
// CJS modules however only support objects as modules.

// var lib = require('package/lib');

// function foo() {
//     lib.log('test');
// }

// exports.foo = foo;

var foobar = require('./foobar/foobar').foobar;
var test = new foobar();

test.bar();
test.foo();