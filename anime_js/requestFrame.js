var demo1 = document.getElementById('demo1');
var len1 = 0;
var timerFunc1 = function () {
    len1 += 5;
    if (len1 <= 1000) {
        demo1.style.width = len1 + 'px';
    } else {
        clearInterval(timer1);
    }
}
var timer1 = setInterval(timerFunc1, 20);


var demo2 = document.getElementById('demo2');
var len2 = 0;
var timerFunc2 = function () {
    len2 += 5;
    if (len2 <= 1000) {
        demo2.style.width = len2 + 'px';
        requestAnimationFrame(timerFunc2)
    } else {
        cancelAnimationFrame(timer2);
    }
}

var timer2 = requestAnimationFrame(timerFunc2);