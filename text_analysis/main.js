// var _ = require('lodash');

var val = $('textarea').text();
var arr = val.split(' ').filter(function (value) {
    return value;
}).sort();
console.log(val);
console.log(arr);