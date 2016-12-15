var argv = require('minimist');
var argv1 = argv(process.argv.slice(2));

process.argv.forEach((val,index) => {
    console.log(`${index}: ${val}`);
    console.log('-------------------');
})

console.dir(process.argv);
console.log('-------------------');
console.log(argv);
console.log('-------------------');
console.log(argv1)