(function() {
    var test = [5,9,0,17,3,29];

    function quickSort(arr) {
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

    function bubbleSort(arr) {
        if (arr.length <= 1) {
            return arr;
        }

        var length = arr.length;
        for(var i = 0; i < length; i++) {
            for(var j = 0; j < (length - i - 1); j++) { //Notice that j < (length - i)
                if (arr[j] > arr[j + 1]) {
                    var tmp = arr[j];
                    arr[j] = arr[j+1];
                    arr[j+1] = tmp;
                }
            }
        }

        return arr;
    }

    console.log(quickSort([32,45,37,16,2,87]));
    console.log(bubbleSort([32,45,37,16,2,87]));
})();