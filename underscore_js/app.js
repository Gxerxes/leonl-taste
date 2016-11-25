var items = [
        {name: "Alejandro"},
        {name: "Benito"},
        {name: "Chinea"},
        {name: "Domingo"},
        {name: "Eduardo"},
        {name: "..."},
        {name: "Yolanda"},
        {name: "Zacarias"}
    ];
 
var template = usageList.innerHTML;
target.innerHTML = _.template(template,{items:items});


console.log(_.shuffle([1, 2, 3, 4, 5, 6]));