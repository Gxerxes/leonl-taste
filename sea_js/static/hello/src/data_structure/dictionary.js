define(function(require, exports, module) {

    function Dictionary() {
        this.datastore = new Array();
    }

    Dictionary.prototype = {
        add: function(key, value) {
            this.datastore[key] = value;
        },

        find: function(key) {
            return this.datastore[key];
        },

        remove: function(key) {
            delete this.datastore[key];
        },

        showAll: function() {
            Object.keys(this.datastore).sort().forEach(function(key){
                console.log(key + ' -> ' + this.datastore[key]);
            });
        },

        count: function() {
            var n = 0;
            Object.keys(this.datastore).forEach(function(key) {
                ++n;
            });
        },

        clear: function() {
            Object.keys(this.datastore).forEach(function(key) {
                delete this.datastore[key];
            });
        }
    }

    module.exports = new Dictionary();
});