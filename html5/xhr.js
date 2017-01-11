(function() {
    var httpRequest;

    document.getElementById("ajaxButton").onclick = function() {
        makeRequest('test.html');
    }

    function makeRequest(url) {
        httpRequest = new XMLHttpRequest();
        
        if (!httpRequest) {
            alert('Giving up :( Cannot create an XMLHTTP instance)');
            return false;
        }

        httpRequest.onreadystatechange = consoleContents;
        httpRequest.open('GET', url);
        httpRequest.send();
    }

    function consoleContents() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                console.log(httpRequest.responseText);
            } else {
                console.log('There was a problem with the request.')
            }
        }
    }
})()


var canvas = document.getElementById("canvas"),
    context = canvas.getContext('2d'),
    width = canvas.width = 640,
    height = canvas.height = 480;
context.fillRect(0, 0, width, height);

var scaleMode = "fill";

var img = document.createElement('img');
img.addEventListener('load', onImageLoad);
img.src = '';

function onImageLoad() {
    var imageWidth,
        imageHeight,
        imageAspectRatio = img.width / img.height,
        containerAspectRatio = width / height,
        widthFirst = getWidthFirst(scaleMode, imageAspectRatio, containerAspectRatio);

        if (widthFirst) {
            imageWidth = width;
            imageHeight = imageWidth / imageAspectRatio;
        } else {
            imageHeight = height;
            imageWidth = imageHeight * imageAspectRatio;
        }

        context.drawImage(img, 0, 0, 1280, 720, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
}

function getWidthFirst(scaleMode, imageAspectRatio, containerAspectRatio) {
    if (scaleMode === "showAll") {
        return imageAspectRatio > containerAspectRatio;
    } else {
        return imageAspectRatio < containerAspectRatio;
    }
}