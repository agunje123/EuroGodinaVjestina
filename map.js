const mapWidth = 800;
const mapHeight = 600;

const projection = 
    d3.geo.mercator()
    .center([13, 52])
    .translate([mapWidth/2, mapHeight/2])
    .scale([mapWidth/1.5]);

//TODO: Treba podesiti domenu i rang, colorbrewer!
const colorScale = 
    d3.scale.threshold()
    .domain([0, 1000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 2000000000])
    .range(['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','white']);

//Path generator
const path = 
    d3.geo.path()
    .projection(projection);

//SVG element
const svg = 
    d3.select("#container")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight)

//Loading JSON data
d3.json("data/ne_50m_admin_0_countries_simplified.json", function(json) {
    svg.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country")
});

