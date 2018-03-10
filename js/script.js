(function() {

    // request the JSON country and bitnode files
    var countryJson = d3.json("data/countries.json"),
        bitnodesCsv = d3.csv("data/bitnodes.csv")

    //use promise to call files, then call drawMap function
    Promise.all([countryJson, bitnodesCsv]).then(drawMap, error);

    // function fired if there is an error
    function error(error) {
        console.log(error)
    }

    // accepts the data as a parameter countrysData
    function drawMap(data) {

        // data is array of our two datasets
        var countryData = data[0],
            bitnodesData = data[1]

        // define width and height of our SVG
        var width = 960,
            height = 600

        // select the map element
        var svg = d3.select("#map")
            .append("svg") // append a new SVG element
            .attr("width", width) // give the SVS element a width attribute and value
            .attr("height", height) // same for the height

        // get the GeoJSON representation of the TopoJSON data
        var geojson = topojson.feature(countryData, {
            type: "GeometryCollection",
            geometries: countryData.objects.ne_110m_admin_0_countries.geometries
        })

        // define a projection using the US Albers USA
        // fit the extent of the GeoJSON data to specified width and height
        var projection = d3.geoNaturalEarth1()
            .fitSize([width, height], geojson)

        // define a path generator, which will use the specified projection
        var path = d3.geoPath()
            .projection(projection)

        // create and append a new SVG g element to the SVG
        var countries = svg.append("g")
            .selectAll("path") // select all the paths (that don't exist yet)
            .data(geojson.features) // use the GeoJSON data
            .enter() // enter the selection
            .append("path") // append new path elements for each data feature
            .attr("d", path) // give each path a d attribute value
            .attr("class", "country") // give each path a class of country
            .on("mouseover", function(d) { // when mousing over an element
                d3.select(this).classed("hover", true)}) // select it, add a class name, and bring to front
            .on("mouseout", function() { // when mousing out of an element
                d3.select(this).classed("hover", false)}) // remove the class

        // create and append SVG with facilties data
        var bitnodes = svg.append("g")
            .selectAll("circle")
            .data(bitnodesData)
            .enter() // enter the selection
            .append("circle")
            .attr("cx", function(d) { // define the x position
                d.position = projection([d.LON, d.LAT]);
                return d.position[0];
            })
            .attr("cy", function(d) {
                return d.position[1];
            })
            .attr("r", 3)
            .attr("class", "bitnode")
            .on("mouseover", function(d) { // when mousing over an element
                d3.select(this).classed("hover", true).raise(); // select it, add a class name, and bring to front
                tooltip.style("opacity", 1);
                tooltip.html('<div>ASN: ' +
                    (d.ASN) + '</div><div>City: ' +
                    (d.City) + '</div><div>Country: ' +
                    (d.Country_code) + '</div><div>Connected Since: ' +
                    (d.Connected_since) + '</div>'
                ) // make tooltip visible and update info
            })
            .on("mouseout", function() { // when mousing out of an element
                d3.select(this).classed("hover", false).lower(); // remove the class
                tooltip.style("opacity", 0) // hide the element
            })

        // Create  div for the tooltip and hide with opacity
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")

        // select the map element
        d3.select("#map")
            .on("mousemove", function(event) { // when mouse moves over it
                // update the position of the tooltip
                tooltip.style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");
            })


        addFilter(bitnodesData, bitnodes) // add a dropdown for emission types

    }

    function addFilter(bitnodesData, bitnodes) {

        // select the map element
        var dropdown = d3.select('#map')
            .append('select') // append a new select element
            .attr('class', 'filter') // add a class name
            .on('change', onchange) // listen for change

        // array to hold select options
        var uniqueTypes = [];

        // loop through all features and push unique types to array
        bitnodesData.forEach(function(bitnode) {
            // if the type is not included in the array, push it to the array
            if (!uniqueTypes.includes(bitnode.Organization_name)) uniqueTypes.push(bitnode.Organization_name)
        })

        // sort types alphabeticaly in array
        uniqueTypes.sort();

        // place All Organizations on top of list
        uniqueTypes.unshift("All Organizations")

        // select all the options (that don't exist yet)
        dropdown.selectAll('option')
            .data(uniqueTypes).enter() // attach our array as data
            .append("option") // append a new option element for each data item
            .text(function(d) {
                return d // use the item as text
            })
            .attr("value", function(d) {
                return d // use the time as value attribute
            })
            .property("selected", function(d) {
                return d === "All Organizations"
            })

        function onchange() {
            // get the current value from the select element
            var val = d3.select('select').property('value')

            // style the display of the facilities
            bitnodes.style("display", function(d) {
                // if it's our default, show them all with inline
                if (val === "All Organizations") return "inline"
                // otherwise, if each industry type doesn't match the value
                if (d.Organization_name != val) return "none" // don't display it
            })
        }
    }

})();
