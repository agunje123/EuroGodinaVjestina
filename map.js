var mapWidth = 920;
var mapHeight = 600;

var sliderWidth = 920;
var sliderHeight = 50;

var pointerHeight = 330;
var pointerWidth = 885;
var trans = 60;

var years = new Array(
    "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"
  );
years.reverse();

var scaleDomain = [0, years.length - 1];

var projection = 
    d3.geo.mercator()
    .center([13, 52])
    .translate([mapWidth/2, mapHeight/2])
    .scale([mapWidth/1.5]);

//TODO: Treba podesiti domenu i rang, colorbrewer!
var colorScale = 
    d3.scale.threshold()
    .domain([0, 1000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 2000000000])
    .range(['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','white']);

//Path generator
var path = 
    d3.geo.path()
    .projection(projection);

//SVG element mape
var mapSvg = 
    d3.select("#container")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)

//SVG element slidera
var sliderSvg = 
    d3.select("#slider")
    .append("svg")
    .attr("width", sliderWidth)
    .attr("height", sliderHeight);

//Loading JSON data
d3.json("data/ne_50m_admin_0_countries_simplified.json", function(json) {
    mapSvg.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country");

    var pointerdata = [
        {
          x: 0,
          y: 0
        },
        {
          x: 0,
          y: 25
        },
        {
          x: 25,
          y: 25
        },
        {
          x: 25,
          y: 0
        }
    ];

    var drag = d3.behavior
    .drag()
    .origin(function() {
      return {
        x: d3.select(this).attr("x"),
        y: d3.select(this).attr("y")
      };
    })
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);

    var pointerScale = d3.scale
    .linear()
    .domain(scaleDomain)
    .rangeRound([0, pointerWidth]);

    sliderSvg
    .append("g")
    .append("rect")
    .attr("class", "slideraxis")
    .attr("width", sliderWidth)
    .attr("height", 7)
    .attr("x", 0)
    .attr("y", 16);

    var cursor = sliderSvg
    .append("g")
    .attr("class", "move")
    .append("svg")
    .attr("x", pointerWidth)
    .attr("y", 7)
    .attr("width", 30)
    .attr("height", 60);

    cursor.call(drag);
    var drawline = 
    d3.svg
      .line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      })
      .interpolate("linear");

    cursor
      .append("path")
      .attr("class", "cursor")
      .attr("transform", "translate(" + 7 + ",0)")
      .attr("d", drawline(pointerdata));
    cursor.on("mouseover", function() {
      d3.select(".move").style("cursor", "hand");
    });

    function dragmove() {
      var x = Math.max(0, Math.min(pointerWidth, d3.event.x));
      d3.select(this).attr("x", x);
      var z = parseInt(pointerScale.invert(x));
      aux = z;
      drawMap(z);
    }

    function dragstart() {
      d3.select(".cursor").style("fill", "#D9886C");
    }

    function dragend() {
      d3.select(".cursor").style("fill", "");
    }
});