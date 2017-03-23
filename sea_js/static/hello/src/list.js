define(function(require, exports, module) {

    function List() {
        this.listSize = 0;
        this.pos = 0;
        this.dataStore = [];
    }

    List.prototype = {
        append: function(element) {
            this.dataStore[this.listSize++] = element;
        },

        find: function (element) {

        },

        remove: function(element) {

        },

        length: function() {

        },

        toString: function() {

        },

        insert: function() {

        },

        clear: function() {

        },

        contains: function() {

        },

        front: function() {

        },

        end: function() {

        },

        prev: function() {

        },

        next: function() {
            
        }

    }

    module.exports = new List();
});