//create tile layers for background of map
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

//grayscale layer
var grayMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// world Imagery layer
var worldImage = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

//Nat Geo Layer
var GeoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16
});

//make basemaps obj
let basemaps = {
    GrayScale: grayMap,
    "World Imagery" : worldImage,
    "Nat Geo World" : GeoMap,
    Default: defaultMap
}

//make map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5.4,
    layers: [defaultMap, worldImage, grayMap, GeoMap ]
});

//add default map to map
defaultMap.addTo(myMap);

// get data for the tectonic plates and draw on map
//variable to hold tectonic plates layer
let tectonicplates = new L.layerGroup();
//call api to get the info for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    //console.log(); to make sure data loaded
    //console.log(plateData);
    //load data using geoJson then add to tectonic plates layer group
    L.geoJson(plateData,{
        //add styling to make the lines visible
        color: "red",
        weight: 1
    }).addTo(tectonicplates);
});

//add the tectonic plates to the map
tectonicplates.addTo(myMap);

//variable to hold earthquake layer
let earthquakes = new L.layerGroup();

//get the data for the earthquakes and populate the layer group
//call the UCGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
.then(
    function(earthquakeData){
        //console.log(); to make sure data loaded
        console.log(earthquakeData);
        //plot ciclces where the radius is dependent on the magnitude
        //and the color is dependent on the depth

        //make a function that chooses color of the data point
        function dataColor(depth){
            if  (depth > 90)
                return "red";
            else if(depth > 70)
                return"#ff5517";
            else if(depth > 50)
                return "#ff8317";
            else if (depth > 30)
                return "#ffbd17";
            else if( depth > 10)
                return "#d4ff17";
            else
                return "green";
        }

        //make a function that derives the size of the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; //makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; //makes sure that the circle is proounced in the map

        }

        // add on to the style of each data point
        function dataStyle(feature){
            return{
                opacity: 1,
                fillOpacity: .75,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for the depth (in tools)
                color: "000000",
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5,
                stroke: true
            }
        }

        //add the geoJson data to the earthquake layer group
        L.geoJson(earthquakeData, {
            //make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(feature, latLng){
                return L.circleMarker(latLng);
            },
            //set the style for each marker
            style: dataStyle, // calls the data style function and passes in the earthquake data
            //add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b><br>`);
            }
        }).addTo(earthquakes)
    }
);
// add the earthquake layer to the map
earthquakes.addTo(myMap);
// add overlay for tectonic plates for earthquakes
let overlay = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

//add layer control
L.control
    .layers(basemaps, overlay)
    .addTo(myMap);

//add legend to map
let legend = L.control({
    position: "bottomright"
});
//add properties for legeng
legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");

    //set up intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    //set colors for intervals
    let colors = [
        "green",
        "#ffbd17",
        "#d4ff17",
        "#ff8317",
        "#ff5517",
        "red"
    ];

    //loop through intervals and colors and generate a label
    // with a colored square for each interval
    for(var i = 0; i < intervals.length; i++)
    {
        // use inner HTML sets the square for each interval and label
        div.innerHTML += "<i style='background: "
            + colors[i]
            + "'></i>"
            + intervals[i]
            + (intervals[i+1] ? "km $ndash km;" + intervals[i+1] + "km<br>" : "+");
    }

    return div;
};

//add legend to the map
legend.addTo(myMap);