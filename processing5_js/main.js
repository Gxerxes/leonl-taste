var fft, // Allow us to analyze the song
    numBars = 1024, // The number of bars to use; power of 2 from 16 to 1024
    song; // The p5 sound object

// Returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
};
// My function to interpolate between two colors completely, returning an array
function interpolateColors(color1, color2, steps) {
    var stepFactor = 1 / (steps - 1),
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    for(var i = 0; i < steps; i++) {
        interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
    }

    return interpolatedColorArray;
}


// Load our song
var loader = document.querySelector(".loader");
document.getElementById("audiofile").onchange = function(event) {
    if(event.target.files[0]) {
        if(typeof song != "undefined") { // Catch already playing songs
            song.disconnect();
            song.stop();
        }
        console.log(event.target.files[0]);
        // Load our new song
        song = loadSound(URL.createObjectURL(event.target.files[0]));
        loader.classList.add("loading");

        songStarted = false;

        console.log(song);
    }
}


var canvas;
function setup() { // Setup p5.js
    canvas = createCanvas(windowWidth, windowHeight);
}

var colorArray = interpolateColors("rgb(94, 79, 162)", "rgb(247, 148, 89)", numBars),
    songStarted = false;
function draw() {
    background(51);
    
    if(typeof song != "undefined" 
       && song.isLoaded() 
       && !songStarted) { // Do once
        loader.classList.remove("loading");
        
        song.play();
        song.setVolume(0.5);
        playPauseButton.innerHTML = "&#9646;&#9646;";

        fft = new p5.FFT();
        fft.waveform(numBars);
        fft.smooth(0.85);

        songStarted = true;
    }
    
    if(typeof fft != "undefined") {
        var spectrum = fft.analyze();
        noStroke();
        for(var i = 0; i < numBars; i++) {
            fill(colorArray[i]);
            var x = map(i, 0, numBars, 0, width);
            var h = -height + map(spectrum[i], 0, 255, height, 0);
            rect(x, height, width / numBars, h);
        }
    }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

var playPauseButton = document.querySelector(".playPauseButton");
playPauseButton.onclick = function() {
    if(!song.isPlaying()) {
        song.play();
        playPauseButton.innerHTML = "&#9646;&#9646;";
    } else {
        song.pause();
        playPauseButton.innerHTML = "&#9654;";
    }
}


var elem = document.querySelector('.pulse');
var animation = elem.animate({
    opacity: [0.5, 1],
    transform: ['scale(0.5)', 'scale(1)'],
}, {
    direction: 'alternate',
    duration: 500,
    iterations: Infinity
})