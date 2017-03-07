define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    var messages = require('./messages');

    // Load library/vendor modules using
    // full IDs, like:
    var print = require('print');

    var sort = require('./sort');

    var faker = require('faker');

    console.log(faker);
    faker.locale = 'en';

    var firstRandom = faker.helpers.createCard();

    var arr = [];

    var test = [5, 3, 10, 7, 12, 9, 2];

    for(var i = 0; i < 10000; i++) {
        arr.push(Math.round(Math.random() * 10000));
    }

    console.time('Bubble sort');
    print(sort.bubbleSort(test));
    console.timeEnd('Bubble sort');

    console.time('Quick sort');
    print(sort.quickSort(test));
    console.timeEnd('Quick sort');
});