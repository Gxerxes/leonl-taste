// AMD adopts a browser-first approach to development, 
// opting for asynchronous behaviour and simplified backwards compatability 
// but it doesn't have any concept of File I/O. 
// It supports objects, functions, constructors, strings, JSON and many other types of modules, 
// running natively in the browser. It's incredibly flexible.

// define(
//     module_id /*optional*/, 
//     [dependencies] /*optional*/, 
//     definition function /*function for instantiating the module or object*/
// );

// A module_id (myModule) is used here for demonstration purposes only
 
define('myModule', 
    ['foo', 'bar'], 
    // module definition function
    // dependencies (foo and bar) are mapped to function parameters
    function ( foo, bar ) {
        // return a value that defines the module export
        // (i.e the functionality we want to expose for consumption)
    
        // create your module here
        var myModule = {
            doStuff:function(){
                console.log('Yay! Stuff');
            }
        }
 
        return myModule;
});
 
// An alternative example could be..
define('myModule', 
    ['math', 'graph'], 
    function ( math, graph ) {
 
        // Note that this is a slightly different pattern
        // With AMD, it's possible to define modules in a few
        // different ways due as it's relatively flexible with
        // certain aspects of the syntax
        return {
            plot: function(x, y){
                return graph.drawPie(math.randomGrid(x,y));
            }
        }
});