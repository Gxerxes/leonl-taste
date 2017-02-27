define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    var messages = require('./messages');

    // Load library/vendor modules using
    // full IDs, like:
    var print = require('print');

    var sort = require('./sort');

    var test = [5,9,0,17,3,29];

    print(sort.quickSort(test));

    print(sort.bubbleSort(test));

    print(messages.getHello());
});