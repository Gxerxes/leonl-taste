define(function(require, exports, module) {

    function List() {
        this.listSize = 0;
        this.pos = 0;
    }

    List.prototype = {
        listSize: 1,
        dataStore: [],
        find: function () {

        }
    }

    module.exports = new List();
});