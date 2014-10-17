$(document).ready(function(){
    var cities;
    var citiesMin;
    var citiesMax;
    var timestamps = [];
    var map = L.map('map', {
                center: [38, -96],
                zoom: 4,
                minZoom: 4
        });
        L.tileLayer(
        'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png', {
                    attribution: '<a href="http://maps.stamen.com">Stamen tileset</a>'
        }).addTo(map);

    $.getJSON("data/leafletmapdata.geojson")
        .done(function(data) {
            var info = processData(data);
            createPropSymbols(info.timestamps, data);
            createLegend(info.min, info.max);
            createSliderUI(info.timestamps);
        })
    .fail(function() { alert("There has been a problem loading the data")});

    function processData(data){
        var min = Infinity;
        var max = -Infinity;
            for (var feature in data.features) {
                var properties = data.features[feature].properties;
                var featureMax = 0;
                var featureMin = Infinity;

                for (var attribute in properties) {
                    if (attribute != 'id' &&
                        attribute != 'city' &&
                        attribute != 'lat' &&
                        attribute != 'lon') {

                    if ($.inArray(attribute, timestamps) === -1){
                        timestamps.push(attribute);
                    }

                    if (properties[attribute] < min) {
                        min = properties[attribute];
                    }

                    if (properties[attribute] > max) {
                        max = properties[attribute];

                    }

                    if (properties[attribute] < featureMin){
                        featureMin = properties[attribute];
                    }

                    if (properties[attribute] > featureMax){
                        featureMax = properties[attribute];
                    }
                }
                properties.max = featureMax;
                properties.min = featureMin;
            }
        };
        return {
            timestamps : timestamps,
            min : min,
            max : max,

        };
    }; //end ProcessData function

    function createLegend(min, max){
        if(min < 100) {
            min = 100;
        }

        function roundNumber(inNumber){
            return (Math.round(inNumber/10) * 10);   
        }
        
        var legend = L.control({position: "bottomright"});

        legend.onAdd = function(map) {
            var legendContainer = L.DomUtil.create("div", "legend");
            var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
            var classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
            var legendCircle;
            var lastRadius = 0;
            var currentRadius;
            var margin;

            L.DomEvent.addListener(legendContainer, 'mousedown', function(e){
                L.DomEvent.stopPropagation(e);
            })

            $(legendContainer).append("<h4 id='legendTitle'># of Assaults</h4><center><i>per 100,000 people</center></i><br>");

            for (var i = 0; i <= classes.length-1; i++){
                legendCircle = L.DomUtil.create("div", "legendCircle");

                currentRadius = calcPropRadius(classes[i]);

                margin = -currentRadius - lastRadius - 2;

                $(legendCircle).css({
                    "width": currentRadius*2 + "px",
                    "height": currentRadius*2 + "px",
                    "margin-left": margin + "px"
                });

                $(legendCircle).append("<span class='legendValue'>" + classes[i] + "</span>");
                $(symbolsContainer).append(legendCircle);

                lastRadius = currentRadius;
            }
            $(legendContainer).append(symbolsContainer);

            return legendContainer;

        };

        legend.addTo(map);
    }; //end createLegend

    function createPropSymbols(timestamps, data){
        cities= L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    fillColor: "rgba(100, 0, 0, .8)",
                    color: 'rgba(100, 0, 0, .8)',
                    weight: 2,
                    fillOpacity: 1

                    }).on({
                        mouseover: function(e) {
                            this.openPopup();
                            this.setStyle({color: 'rgba(50, 0, 0, .8)', weight: 3});
                        },

                        mouseout: function(e) {
                            this.closePopup();
                            this.setStyle({color: 'rgba(100, 0, 0, .8)', weight: 2});
                        }

                });
            }
        }).addTo(map);
        
        citiesMin= L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    fillOpacity: 0,
                    color: '#808080',
                    weight: 3
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
        
        citiesMax= L.geoJson(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    fillOpacity: 0,
                    color: '#250000',
                    weight: 3
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
        
     updatePropSymbols(0);  
    }; //end createPropSymbols()


    function updatePropSymbols(timestamp){
        citiesMin.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props.min);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";

                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
        });
        citiesMax.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props.max);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";

                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
              

        });
        cities.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[timestamps[timestamp]]);
            var popupContent = "<b>" + props[timestamps[timestamp]] +
                " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamps[timestamp] + "</i>";

                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
        });
        
     createMinMax(citiesMin, citiesMax);
    }; //end updatePropSymbols


    function calcPropRadius(attributeValue){
        var scaleFactor = 1.2;
        var area = attributeValue * scaleFactor;
        return Math.sqrt(area/Math.PI) * 2;
    }; //end calcPropRadius

    function createSliderUI(timestamps){
        var sliderControl = L.control({ position: 'bottomleft'} );

        sliderControl.onAdd = function(map) {
            var slider = L.DomUtil.create("input", "range-slider");

            L.DomEvent.addListener(slider, 'mousedown', function(e) {
                L.DomEvent.stopPropagation(e);
            });

            $(slider)
                .attr({'type':'range',
                    'max': timestamps.length-2,
                    'min': 0,
                    'step': 1,
                    'value': 0
                 }).on('input', function() {
                   updatePropSymbols($(this).val());
                   $('.temporal-legend').text(timestamps[this.value]);
            });
            return slider;
        }

        sliderControl.addTo(map);
        createTemporalLegend(timestamps[0]);  
    } //end sliderUI

    function createTemporalLegend(startTimestamp) {
        var temporalLegend = L.control({ position: 'bottomleft'});
        temporalLegend.onAdd = function(map) {
            var output = L.DomUtil.create("output", "temporal-legend");
            $(output).text(startTimestamp);
            return output;
        }

        temporalLegend.addTo(map);
    } //end createTemporalLegend
    
    function createMinMax(Min, Max){
        //when clicked, turn on unless it's already on, then you turn off
       $("#minButton").click(function(){
            if (map.hasLayer(citiesMin)){
                map.removeLayer(citiesMin);
            } else {
                map.addLayer(citiesMin);
            }
       });
     $("#maxButton").click(function(){
        if (map.hasLayer(citiesMax)){
            map.removeLayer(citiesMax);
        } else {
            map.addLayer(citiesMax);
        }
     });
    } //end createMinMax
    
    
});//end main.js


