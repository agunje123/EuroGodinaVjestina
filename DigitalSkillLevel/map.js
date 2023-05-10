// Digital Skills map.

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
    .center([13, 53])
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

// Waits for both the json and csv files to load, then calls the function processData
function loadData() {

  queue() 
    .defer(d3.json, "data/world-topo.json")
    .defer(d3.csv, "data/DigitalSkillLevel.csv")
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
        tooltipDiv.html(d.properties.admin + "'s percentage: " + d.properties[attributeArray[currentAttribute]] + "%")  
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

    svg.append("rect") // Outline of the map
    .attr("x", 1)
    .attr("y", 1)
    .attr("height", 598)
    .attr("width", 918)
    .style("stroke", "black")
    .style("fill", "none")
    .style("stroke-width", 2);

  var dataRange = getDataRange(); // Get the range of data
  d3.selectAll('.country')  // Select all countries
  .attr('fill', function(d) { // Color them if they have defined values
    if (d.properties[attributeArray[currentAttribute]] == 0 || d.properties[attributeArray[currentAttribute]] == undefined){
      return "#dbdbdb"; 
    } else {
      return getColor(d.properties[attributeArray[currentAttribute]], dataRange)
    } 
  });
  drawLegend();
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
  drawLegend();
}

// Function takes in the value of the country and the data range.
// Returns the color according to a equal interval scale.
function getColor(countryValue, dataRange) {

  // For readability
  var min = dataRange[0];
  var max = dataRange[1];
  var interval = (max - min)/4;

  var color = d3.scale.threshold()
    .domain([min + interval, min + (2*interval), min + (3*interval)])
    .range(['#ffffcc','#a1dab4','#41b6c4','#225ea8']);

  return color(countryValue);
}


// Function loops through all the data values from the current data attribute.
// Returns the minimum and maximum values in the form of an array.
function getDataRange() {

  var min = Infinity;
  var max = -Infinity; 

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
      
        d3.select(this).html('Stop');  // Change the button to say "stop"
        playing = true;   // Change the boolean 
      } else {    // If it is playing
        clearInterval(timer);   // Stop the animation by clearing the interval
        d3.select(this).html('Play');   // Change the button to say "play"
        playing = false;   // Change the boolean
      }
  });
}

//Function deletes any previous legend, draws a new one based on the data of the current year.
function drawLegend() {

  d3.select("#legend")
    .select("svg.legend")
    .remove(); // Removes previous legend if there is any

  var dataRange = getDataRange(); // Fetches the data range 
  var min = dataRange[0];
  var max = dataRange[1];
  var interval = (max - min)/4;

  var color = d3.scale.linear() // Color scale based on dynamic data
    .domain([min + interval, min + (2*interval), min + (3*interval), max])
    .range(['#ffffcc','#a1dab4','#41b6c4','#225ea8']);

  var legendText = [
    min.toFixed(2).toString() + " % - " + (min + interval).toFixed(2).toString() + " %", 
    (min + interval).toFixed(2).toString() + " % - " + (min + (2*interval)).toFixed(2).toString() + " %", 
    (min + (2*interval)).toFixed(2).toString() + " % - " + (min + (3*interval)).toFixed(2).toString() + " %", 
    (min + (3*interval)).toFixed(2).toString() + " % - " + max.toFixed(2).toString() + " %"
    ]; // Text of the legend

  var legend = d3.select("#legend")
    .append("svg")
    .attr("class", "legend")
    .selectAll("g")
    .data(color.domain())
    .enter()
    .append("g")
    .attr("transform", function(d, i) { 
      return "translate(20," + i * 15 + ")"; 
    });
          
    legend.append("rect") // Draws the color rectangle
      .attr("width", 25)
      .attr("height", 15)
      .style("fill", color);

    legend.append("text") // Renders the text
      .data(legendText)
      .attr("x", 27)
      .attr("y", 9)
      .attr("dy", ".30em")
      .text(function(d) {
         return d; 
    });
}

window.onload = onInit();
