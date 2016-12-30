
function getElementLeft(element) {
    var actualLeft = element.offsetLeft;
    var current = element.offsetParent;

    while (current != null) {
        actualLeft += current.offsetLeft;
        current = current.offsetParent;
    }

    return actualLeft;
}

function getElementTop(element) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;

    while (current != null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }

    return actualTop;
}

function getViewport() {
    if (document.compatMode == "BackCompat") {
        return {
            width: document.body.clientWidth,
            height: document.body.clientHeight
        };
    } else {
        return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight
        };
    }
}

function scrollToTop(element) {
    if (element.scrollToTop != 0) {
        element.scrollToTop = 0;
    }
}

function getBoundingClientRect (element) {
    if (typeof arguments.callee.offset != "number") {
        var scrollToTop = document.documentElement.scrollTop;
        var temp = document.createElement("div");
        temp.style.cssText = "position:absolute;left:0;top:0;";
        document.body.appendChild(temp);
        arguments.callee.offset = temp.getBoundingClientRect().top - scrollTop;
        document.body.removeChild(temp);
        temp = null;
    }

    var rect = element.getBoundingClientRect();
    var offset = arguments.callee.offset;

    return {
        left: rect.left + offset,
        right: rect.right + offset,
        top: rect.top + offset,
        bottom: rect.bottom + offset
    };
}

function loadScript(url) {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = url;
    document.body.appendChild(script);
}

function loadStyles(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(link);
}