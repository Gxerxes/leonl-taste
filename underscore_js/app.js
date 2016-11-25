var items = [
        {name: "Alejandro"},
        {name: "Benito"},
        {name: "Chinea"},
        {name: "Domingo"},
        {name: "Eduardo"},
        {name: "..."},
        {name: "Yolanda"},
        {name: "Zacarias"}
    ];
 

console.log(_.shuffle([1, 2, 3, 4, 5, 6]));

function throttleTest() {
    console.log('throttle clicked');
}

function debounceTest() {
    console.log('debounce clicked');
}

var throttled = _.throttle(throttleTest, 1000);
var debounced = _.debounce(debounceTest, 1000);

function functionTest(func) {
    var result, context, args;

    return func.apply(context, args)
}