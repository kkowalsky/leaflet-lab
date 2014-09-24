$(document).ready(function() {

		var cities;
		var map = L.map('map', {
					center: [38, -96],
					zoom: 4,
					minZoom: 4
			});

			L.tileLayer(
			'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png', {
						attribution: 'GeoIQ tileset'
			}).addTo(map);

		$.getJSON("data/kowalskymap.geojson")
			.done(function(data) {
				var info = processData(data);
				createPropSymbols(info.timestamps, data);
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
													attribute != 'name' &&
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
			}

			return {
				timestamps : timestamps,
				min : min,
				max : max
			}

		} //end processData()

		function createPropSymbols(timestamps, data){

					cities= L.geoJson(data, {

								pointToLayer: function(feature, latlng) {

										return L.circleMarker(latlng, {
											fillColor: "#708598",
											color: '#537898',
											weight: 1,
											fillOpacity: 0.6

											}).on({


														mouseover: function(e) {
																	this.openPopup();
																	this.setStyle({color: '#808080 ', weight: 2});
														},

														mouseout: function(e) {
																	this.closePopup();
																	this.setStyle({color: '#537898'});
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
				var popupContent = "<b>" + String(props[timestamp]) +
					" assaults</b><br>" + "<i>" + props.name + "</i> in <i>" + timestamp + "</i>";

					layer.setRadius(radius);
					layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
			});
		}//end updatePropSymbols

		function calcPropRadius(attributeValue){
			var scaleFactor = .85;
			var area = attributeValue * scaleFactor;
			return Math.sqrt(area/Math.PI) * 2;
		}//end calcPropRadius
	});
