var width, height, projection, path, svg;
var attributeArray = [];
var currentAttribute = 0;
var playing = false;

var tooltipDiv = d3.select("body").append("div")    
    .attr("class", "tooltip")               
    .style("opacity", 0);

function onInit() {

  setMap();
  animateMap();

}

// Just a setup of some basic parameters
function setMap() {

  // Map width and height
  width = 920;  
  height = 600;  

  // Defines our projection
  projection = d3.geo.mercator()
    .center([13, 52])
    .translate([width/2, height/2])
    .scale([width/1.5]);

  // Path generator with the projection inside of it
  path = d3.geo.path()
    .projection(projection);

  // Appends an svg to our html div to hold our map
  svg = d3.select("#container")
    .append("svg")   
    .attr("width", width)
    .attr("height", height);

  // Loads the data
  loadData();  
}

// Waits for both the geojson and csv files to load, then calls the function processData
function loadData() {

  queue() 
    .defer(d3.json, "data/world-topo.json")
    .defer(d3.csv, "data/podaci_transformirani.csv")
    .await(processData);
}

// Accepts any errors as the first argument
function processData(error, europeMap, countryData) {

  // For easier loop readability, selects the geometry of the country
  var countries = europeMap.objects.countries.geometries;

  for (var i in countries) {    // For each geometry object
    for (var j in countryData) {  // For each row in the CSV
      if(countries[i].properties.id == countryData[j].id) {   // If the names match
        for(var k in countryData[j]) {   // For each column in the row within the CSV
          if(k != 'name' && k != 'id') { 
            if(attributeArray.indexOf(k) == -1) { 
               attributeArray.push(k); // Add new column headings to our array for later
            }
            countries[i].properties[k] = Number(countryData[j][k])  // Add each CSV column key/value to the geometry object
          } 
        }
        break;
      }
    }
  }
  d3.select('#clock').html(attributeArray[currentAttribute]);  // Populate the clock with the current year
  drawMap(europeMap); 
} 

function drawMap(europeMap) {

  svg.selectAll(".country")   // Select the non-existant country objects
    .data(topojson.feature(europeMap, europeMap.objects.countries).features)  // Bind data to the non-existent objects
    .enter()
    .append("path") // Prepare data to be appended to paths
    .attr("class", "country") // Class for styling with css
    .attr("id", function(d) { return "code_" + d.properties.id; }, true)  // Unique id
    .attr("d", path) // Create them using the svg path generator
    .on("mouseover", function(d) {      
      tooltipDiv.transition()     
          .duration(500)      
          .style("opacity", 1);   
      if (d.properties[attributeArray[currentAttribute]] != undefined && d.properties[attributeArray[currentAttribute]] != 0) { 
        tooltipDiv.html(d.properties.admin + "'s percentage of the ICT sector on GDP: " + d.properties[attributeArray[currentAttribute]])  
          .style("left", (d3.event.pageX) + "px")     
          .style("top", (d3.event.pageY - 28) + "px");  
      } else {
        tooltipDiv.html(d.properties.admin)  
          .style("left", (d3.event.pageX) + "px")     
          .style("top", (d3.event.pageY - 28) + "px");  
      }
    })                  
    .on("mouseout", function(d) {       
        tooltipDiv.transition()        
            .duration(500)      
            .style("opacity", 0);   
    });

  var dataRange = getDataRange(); // Get the range of data
  d3.selectAll('.country')  // Select all countries
  .attr('fill', function(d) { // Color them if they have defined values
    if (d.properties[attributeArray[currentAttribute]] == 0 || d.properties[attributeArray[currentAttribute]] == undefined){
      return "#dbdbdb"; 
    } else {
      return getColor(d.properties[attributeArray[currentAttribute]], dataRange)
    } 
  });
}

function sequenceMap() {
  
  var dataRange = getDataRange(); // Get the range of data
  d3.selectAll('.country')
    .transition()  // Select all countries and prepare for a transition to new values
    .duration(750)  // Duration of the transition
    .attr('fill', function(d) {
      if (d.properties[attributeArray[currentAttribute]] == 0 || d.properties[attributeArray[currentAttribute]] == undefined){
        return "#dbdbdb";  // New colors
      } else {
        return getColor(d.properties[attributeArray[currentAttribute]], dataRange)
      }
    })

}

// Function takes in the value of the country and the data range.
// Returns the color according to a equal interval scale.
function getColor(countryValue, dataRange) {

  // For readability
  var min = dataRange[0];
  var max = dataRange[1];
  var interval = (max - min)/4;

  var color = d3.scale.threshold()
    .domain([min, min + interval, min + (2*interval), min + (3*interval), max])
    .range(['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494']);

  return color(countryValue);
}


// Function loops through all the data values from the current data attribute.
// Returns the minimum and maximum values in the form of an array.
function getDataRange() {

  var min = 10;
  var max = 0; 

  d3.selectAll('.country')
    .each(function(d,i) {
      var currentValue = d.properties[attributeArray[currentAttribute]];
      if(currentValue <= min && currentValue != undefined && currentValue != 0 ) {
        min = currentValue;
      }
      if(currentValue >= max && currentValue != undefined && currentValue != 0 ) {
        max = currentValue;
      }
  });
  return [min,max];
}

// More information on what the function does inside.
function animateMap() {

  var timer;
  d3.select('#play')  
    .on('click', function() {
      if(playing == false) {  // If the map is currently not playing
        timer = setInterval(function(){   // set a JS interval
          if(currentAttribute < attributeArray.length-1) {  
              currentAttribute +=1;  // Increment the attribute counter
          } else {
              currentAttribute = 0;  // Reset it to zero
          }
          sequenceMap();  // Update the map 
          d3.select('#clock').html(attributeArray[currentAttribute]);  // Update the clock
        }, 2000);
      
        d3.select(this).html('stop');  // Change the button to say "stop"
        playing = true;   // Change the boolean 
      } else {    // If it is playing
        clearInterval(timer);   // Stop the animation by clearing the interval
        d3.select(this).html('play');   // Change the button to say "play"
        playing = false;   // Change the boolean
      }
  });
}

window.onload = onInit();
