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

