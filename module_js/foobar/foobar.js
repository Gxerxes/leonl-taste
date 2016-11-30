function foobar() {
    this.foo = function() {
        console.log('Hello foo');
    }

    this.bar = function() {
        console.log('Hello bar');
    }
}

exports.foobar = foobar;