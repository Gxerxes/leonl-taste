"use strict";

var sort = (function() {
    function sort() {
        //no-op
    }

    sort.quickSort = function(arr) {
        if (arr.length <= 1) {
            return arr;
        }

        var middle = Math.floor(arr.length / 2);
        var middleValue = arr.splice(middle, 1);
        var left = [];
        var right = [];
        for(var i = 0; i < arr.length; i++) {
            if (arr[i] < middleValue) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }
        var result = quickSort(left);
        result = result.concat(middleValue);
        result = result.concat(quickSort(right));
        return result;
        //return quickSort(left).concat([middleValue], quickSort(right));
    }
}());

exports.sort = sort;
// function foo() { return 'foo'; }

// function bar() { return 'bar'; }

// export { foo, bar };