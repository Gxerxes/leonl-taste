/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

function skewDiv() {
    if ($('.square').hasClass('skew')) {
        $('.square').removeClass('skew');
    } else {
        $('.square').addClass('skew');
    }
}

function scaleDiv() {
    if ($('.square').hasClass('scale')) {
        $('.square').removeClass('scale');
    } else {
        $('.square').addClass('scale');
    }
}

function tranDiv(params) {
    if ($('.square').hasClass(params)) {
        $('.square').removeClass(params);
    } else {
        $('.square').addClass(params);
    }
}

function flipCard() {
    // if ($('#card').hasClass('front')) {
    //     $('#card').removeClass('front');
    //     $('#card').addClass('back');
    // } else {
    //     $('#card').removeClass('back');
    //     $('#card').addClass('front');
    // }
    
    //$('#card').addClass('flipped');

    // if ($('#card').hasClass('flipped')) {
    //     $('#card').removeClass('flipped');
    // } else {
    //     $('#card').addClass('flipped');
    // }

}

var init = function() {
  var card = document.getElementById('card');
  
  document.getElementById('flip').addEventListener( 'click', function(){
    //card.toggleClassName('flipped');
    $('#card').toggleClass('flipped');
  }, false);
};

window.addEventListener('DOMContentLoaded', init, false);