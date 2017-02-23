(function() {
    var test = [5,9,0,17,3,29];

    // console.log(quickSort(test));

    // function quickSort(arr){
    //     if(arr.length<=1){
    //         return arr;//如果数组只有一个数，就直接返回；
    //     }

    //     var num = Math.floor(arr.length/2);//找到中间数的索引值，如果是浮点数，则向下取整

    //     var numValue = arr.splice(num,1);//找到中间数的值
    //     var left = [];
    //     var right = [];

    //     for(var i=0;i<arr.length;i++){
    //         if(arr[i]<numValue){
    //             left.push(arr[i]);//基准点的左边的数传到左边数组
    //         }
    //         else{
    //             right.push(arr[i]);//基准点的右边的数传到右边数组
    //         }
    //     }

    //     return quickSort(left).concat([numValue],quickSort(right));//递归不断重复比较
    // }

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

        console.log(quickSort([32,45,37,16,2,87]));//弹出“2,16,32,37,45,87”
})();