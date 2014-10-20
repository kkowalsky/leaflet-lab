$(document).ready(function(){
    //declare global variables
    var cities;
    var citiesMin;
    var citiesMax;
    var timestamps = [];
    //create a leaflet map with these variables
    var map = L.map('map', {
                center: [38, -96],
                zoom: 4,
                minZoom: 4
        });
    //add stamen toner basemap to map
        L.tileLayer(
        'http://a.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
                    attribution: '<a href="http://maps.stamen.com">Stamen tileset</a>'
        }).addTo(map);

    //push geojson data to load and create different map components
    $.getJSON("data/leafletmapdata.geojson")
        .done(function(data) {
            var info = processData(data);
            createPropSymbols(info.timestamps, data);
            createLegend(info.min, info.max);
            createSliderUI(info.timestamps);
        })
    .fail(function() { alert("There has been a problem loading the data")});

    //this function creates the data used for the prop symbols
    function processData(data){
        var min = Infinity;
        var max = -Infinity;
        
        /*this for loop goes through each feature in the data to create the 
        necessary data for min and max, featuremin, featuremax, and timestamps
        */
            for (var feature in data.features) {
                var properties = data.features[feature].properties;
                var featureMax = 0;
                var featureMin = Infinity;
                
                /* this for loop searches through each feature and creates certain
                variables with the values found in the data */
                for (var attribute in properties) {
                    //makes sure not to use id, city, lat or long data in this search
                    if (attribute != 'id' &&
                        attribute != 'city' &&
                        attribute != 'lat' &&
                        attribute != 'lon') {
                    //if the timestamp doesn't exist yet, it's added to the array
                    if ($.inArray(attribute, timestamps) === -1){
                        timestamps.push(attribute);
                    }
                    /* if that attribute is smaller than the min, then it becomes the
                        new min of the array */
                    if (properties[attribute] < min) {
                        min = properties[attribute];
                    }
                    /* if the attribute is larger than the max, then it becomes the new
                        min of the array*/
                    if (properties[attribute] > max) {
                        max = properties[attribute];

                    }
                    /*  if the attribute is the smallest of its feature, then it becomes
                        the min for that particular feature */
                    if (properties[attribute] < featureMin){
                        featureMin = properties[attribute];
                    }
                    /*  if the attribute is the largest of its feature, then it becomes
                        the max for that particular feature */
                    if (properties[attribute] > featureMax){
                        featureMax = properties[attribute];
                    }
                }
                //sets the featureMax and featureMin for the properties
                properties.max = featureMax;
                properties.min = featureMin;
            }
        };
        //returns timestamps, min, and max after the for loops
        return {
            timestamps : timestamps,
            min : min,
            max : max,

        };
    }; //end ProcessData function

    //this function creates the legend for the map
    function createLegend(min, max){
        //rounds the numbers for the legend
        function roundNumber(inNumber){
            return (Math.round(inNumber/10) * 10);   
        }
        
        //creates and puts the legend in the bottom right
        var legend = L.control({position: "bottomright"});

        //when the legend is created, the different parts of the legend are created
        legend.onAdd = function(map) {
            var legendContainer = L.DomUtil.create("div", "legend");
            var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
            var classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
            var legendCircle;
            var lastRadius = 0;
            var currentRadius;
            var margin;

            //stops clicks from editing the map in this section
            L.DomEvent.addListener(legendContainer, 'mousedown', function(e){
                L.DomEvent.stopPropagation(e);
            })

            //adds a legend label
            $(legendContainer).append("<h4 id='legendTitle'># of Assaults</h4><center><i>per 100,000 people</center></i><br>");
            
            //creates the legend circles for the classes that we created above 
            for (var i = 0; i <= classes.length-1; i++){
                //creates the legend circle
                legendCircle = L.DomUtil.create("div", "legendCircle");
                //calculates the radius for each of the legend circles
                currentRadius = calcPropRadius(classes[i]);
                //creates a margin for each legend class
                margin = -currentRadius - lastRadius - 2;

                //creates the 
                $(legendCircle).css({
                    "width": currentRadius*2 + "px",
                    "height": currentRadius*2 + "px",
                    "margin-left": margin + "px"
                });
                //adds the description to the legend
                $(legendCircle).append("<span class='legendValue'>" + classes[i] + "</span>");
                //the legend circle is appended to the symbols container
                $(symbolsContainer).append(legendCircle);
                
                //sets the radius used to be the old radius for next class circle
                lastRadius = currentRadius;
            }
            //the symbol container is appended to the  legend container 
            $(legendContainer).append(symbolsContainer);
            //returns the legend container
            return legendContainer;

        };
        
        //adds legend to map
        legend.addTo(map);
    }; //end createLegend

    //this function creates the proportional symbols
    function createPropSymbols(timestamps, data){
        //this whole statement creates the symbol for each city
        cities= L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                //this returns a circle marker with these specifications
                return L.circleMarker(latlng, {
                    fillColor: "rgba(100, 0, 0, .75)",
                    color: 'rgba(50, 0, 0, 1)',
                    weight: 3,
                    fillOpacity: 1
                    //this opens and closes the popups on mouseover
                    }).on({
                        mouseover: function(e) {
                            this.openPopup();
                            this.setStyle({color: 'rgba(34, 0, 0, 1)', weight: 7});
                        },

                        mouseout: function(e) {
                            this.closePopup();
                            this.setStyle({color: 'rgba(50, 0, 0, 1)', weight: 3});
                        }

                });
            }
        //adds the city symbols to the map
        }).addTo(map);
        
        //this statement creates the min circles for each city
        citiesMin= L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                //this returns a circle min marker with these specifications
                return L.circleMarker(latlng, {
                    fillOpacity: 0,
                    color: 'rgba(29, 39, 51, 1)',
                    weight: 3
                    //this opens and closes the popups on mouseover
                    }).on({
                        mouseover: function(e) {
                            this.openPopup();
                        },

                        mouseout: function(e) {
                            this.closePopup();
                        }

                });
            }
        });
        
        //this statement creates the max circles for each city
        citiesMax= L.geoJson(data, {
            //this returns a circle max marker with these specifications
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    fillOpacity: 0,
                    color: 'rgba(112, 114, 14, 1)',
                    weight: 3
                    //this opens and closes the popups on mouseover
                    }).on({
                        mouseover: function(e) {
                            this.openPopup();
                        },

                        mouseout: function(e) {
                            this.closePopup();
                        }

                });
            }
        });
        
     //calls the update prop symbols to grab the popup    
     updatePropSymbols(0);  
    }; //end createPropSymbols()

    //this function resizes each proportional symbol and adds popup content
    function updatePropSymbols(timestamp){
        //this creates a popup to occur on the min circle for the specific place and time
        citiesMin.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props.min);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";
                //sets the radius of the symbol and binds the popup to a location 
                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
        });
        //this creates a popup to occur on the min circle for the specific place and time
        citiesMax.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props.max);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i> " + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";
                //sets the radius of the symbol and binds the popup to a location 
                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
              

        });
        //this creates a popup to occur on the min circle for the specific place and time
        cities.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[timestamps[timestamp]]);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";
                //sets the radius of the symbol and binds the popup to a location 
                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
        });
    
     //creates a min max button response
     createMinMax(citiesMin, citiesMax);
    }; //end updatePropSymbols
    
    //this creates the radius of the circle
    function calcPropRadius(attributeValue){
        var scaleFactor = .75;
        var area = attributeValue * scaleFactor;
        return Math.sqrt(area/Math.PI) * 2;
    }; //end calcPropRadius

    //This creates the temporal slider
    function createSliderUI(timestamps){
        //puts the slider in the bottom left corner
        var sliderControl = L.control({ position: 'bottomleft'} );
        
        //creates a range slider 
        sliderControl.onAdd = function(map) {
            var slider = L.DomUtil.create("input", "range-slider");
            //stops click behavior from being propagated by leaflet map
            L.DomEvent.addListener(slider, 'mousedown', function(e) {
                L.DomEvent.stopPropagation(e);
            });

            //defines the slider and its functionalities
            $(slider)
                .attr({'type':'range',
                    'max': timestamps.length-2,
                    'min': 0,
                    'step': 1,
                    'value': 0
                 //when on the prop symbols update and the year is changed on the slider
                 }).on('input', function() {
                   updatePropSymbols($(this).val());
                   $('.temporal-legend').text(timestamps[this.value]);
                    //calls minmax function
                    createMinMax(citiesMin, citiesMax);
            });
            //returns the slider
            return slider;
        }
        //adds slider to map and creates a temporal legend
        sliderControl.addTo(map);
        createTemporalLegend(timestamps[0]);  
    } //end sliderUI

    //makes the legend temporal
    function createTemporalLegend(startTimestamp) {
        //adds legend to bottom left 
        var temporalLegend = L.control({ position: 'bottomleft'});
        //creates the output and returns the output 
        temporalLegend.onAdd = function(map) {
            var output = L.DomUtil.create("output", "temporal-legend");
            $(output).text(startTimestamp);
            return output;
        }

        //returns temporal legend to map
        temporalLegend.addTo(map);
    } //end createTemporalLegend
    
    function createMinMax(Min, Max){
        //when clicked, turn on min layer unless it's already on, then you turn off
       $(".minButton").click(function(){
            if (map.hasLayer(citiesMin)){
                map.removeLayer(citiesMin);
            } else {
                map.addLayer(citiesMin);
            }
       });
     //when clicked, turn on max layer unless it's already on, then you turn off
     $(".maxButton").click(function(){
        if (map.hasLayer(citiesMax)){
            map.removeLayer(citiesMax);
        } else {
            map.addLayer(citiesMax);
        }
     });
    } //end createMinMax
    
    
});//end main.js


