onmessage = function (evt) {
    console.log(evt);
    var d = evt.data;
    postMessage(d);
}