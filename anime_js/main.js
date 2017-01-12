var maxElements = 210;
var colors = ['#FF324A', '#31FFA6', '#206EFF', '#FFFF99'];

// var createElements = (function() {
//   var sectionEl = document.createElement('section');
//   for (var i = 0; i < maxElements; i++) {
//     var el = document.createElement('div');
//     el.style.background = colors[anime.random(0, 3)];
//     sectionEl.appendChild(el);
//   }
//   document.body.appendChild(sectionEl);
// })();

// anime({
//   targets: 'div',
//   translateX: function() { return anime.random(-6, 6) + 'rem'; },
//   translateY: function() { return anime.random(-6, 6) + 'rem'; },
//   scale: function() { return anime.random(10, 20) / 10; },
//   rotate: function() { return anime.random(-360, 360); },
//   delay: function() { return 400 + anime.random(0, 500); },
//   duration: function() { return anime.random(1000, 2000); },
//   direction: 'alternate',
//   loop: true
// });

// var myAnimation = anime({
//   targets: ['.blue', '.green'],
//   translateX: '13rem',
//   rotate: 180,
//   borderRadius: 8,
//   duration: 2000,
//   loop: true
// });

(function() {
    var canvas = document.getElementById("canvas"),
        context = canvas.getContext('2d'),
        width = canvas.width = 800,
        height = canvas.height = 600;
    context.fillRect(0, 0, width, height);

    var scaleMode = "fill";

    var img = document.createElement('img');
    img.addEventListener('load', onImageLoad);
    img.src = 'y.jpg';
    //img.src = 'http://7xp4vm.com1.z0.glb.clouddn.com/y.jpg';

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

            // context.drawImage(img, 0, 0, 1280, 720, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
            context.drawImage(img, 0, 0);
            var imageData = context.getImageData(0, 0, img.width, img.height);
            context.putImageData(sepiaFilter(imageData), 400, 0);
    }

    function getWidthFirst(scaleMode, imageAspectRatio, containerAspectRatio) {
        if (scaleMode === "showAll") {
            return imageAspectRatio > containerAspectRatio;
        } else {
            return imageAspectRatio < containerAspectRatio;
        }
    }

    var sepiaFilter = function(imgData) {
        var d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            let r = d[i]
            let g = d[i + 1]
            let b = d[i + 2]
            d[i] = (r * 0.393) + (g * 0.769) + (b * 0.189) // red
            d[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168) // green
            d[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131) // blue
        }
        return imgData;
    }


})();

