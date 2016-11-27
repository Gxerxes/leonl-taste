(function(global, factory) {
    var div = document.createElement("div");
    div.innerHTML = "Hello";
    document.body.appendChild(div);
    console.log(d3);

    var data = [4, 8, 15];

    var x = d3.scale.linear().domain([0, d3.max(data)]).range([0, 420]);

    d3.select(".chart")
        .selectAll("div")
        .data(data)
        .enter().append("div")
        .style("width", function(d) { return x(d) + "px"; })
        .text(function(d) { return d; });
})(window)
