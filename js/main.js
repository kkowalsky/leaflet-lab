$(document).ready(function(){

        var cities;
        var map = L.map('map', {
                    center: [38, -96],
                    zoom: 4,
                    minZoom: 4
            });

            L.tileLayer(
            'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png', {
                        attribution: '<a href="http://">Stamen tileset</a>'
            }).addTo(map);

        $.getJSON("data/leafletmapdata.geojson")
            .done(function(data) {
                var info = processData(data);
                createPropSymbols(info.timestamps, data);
                createLegend(info.min, info.max);
            })
        .fail(function() { alert("There has been a problem loading the data")});

        function processData(data){
            var timestamps = [];
            var min = Infinity;
            var max = -Infinity;

                        for (var feature in data.features) {
                                var properties = data.features[feature].properties;

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
                                }
                        }
            };

            return {
                timestamps : timestamps,
                min : min,
                max : max
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

                $(legendContainer).append("<h2 id='legendTitle'># of Assaults</h2>");

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
                                            weight: 1,
                                            fillOpacity: 0.6

                                            }).on({
                                                mouseover: function(e) {
                                                    this.openPopup();
                                                    this.setStyle({color: '#330000', weight: 2});
                                                },

                                                mouseout: function(e) {
                                                    this.closePopup();
                                                    this.setStyle({color: '#330000'});
                                                }
                                        });
                                }
                    }).addTo(map);

                    updatePropSymbols(timestamps[0]);
        } //end createPropSymbols()

        function updatePropSymbols(timestamp){
            cities.eachLayer(function(layer){
                var props = layer.feature.properties;
                var radius = calcPropRadius(props[timestamp]);
                console.log(props.City);
                var popupContent = "<b>" + String(props[timestamp]) +
                    " assaults</b><br>" + "<i>" + props.City + "</i> in <i>" + timestamp + "</i>";

                    layer.setRadius(radius);
                    layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
            });
        }//end updatePropSymbols


        function calcPropRadius(attributeValue){
            var scaleFactor = .85;
            var area = attributeValue * scaleFactor;
            return Math.sqrt(area/Math.PI) * 2;
        }//end calcPropRadius


    });//end main.js
