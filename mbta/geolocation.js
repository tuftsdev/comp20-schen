
var myLat = 0;
var myLng = 0;
var me = new google.maps.LatLng(myLat, myLng);
var request = new XMLHttpRequest();

var mapOptions = {
	center: me,
	zoom: 15
};
var map;
var marker_me;
var infowindow = new google.maps.InfoWindow();

var redline_station = [
{lat: 42.395428, lng: -71.142483},
{lat: 42.39674, lng: -71.121815},
{lat: 42.3884, lng:-71.11914899999999},
{lat:42.373362, lng: -71.118956},
{lat: 42.365486,lng: -71.103802},
{lat:42.36249079, lng: -71.08617653},
{lat: 42.361166, lng:-71.070628},
{lat: 42.35639457, lng:-71.0624242},
{lat: 42.355518,lng: -71.060225},
{lat: 42.352271, lng:-71.05524200000001},
{lat: 42.342622, lng:-71.056967},
{lat: 42.330154, lng:-71.057655},
{lat: 42.320685, lng:-71.052391},
{lat:42.275275, lng:-71.029583},
{lat:42.2665139,lng:-71.0203369},
{lat:42.251809,lng:-71.005409},
{lat:42.233391,lng:-71.007153},
{lat:42.2078543, lng:-71.0011385},
{lat:42.31129, lng:-71.053331},
{lat:42.300093,lng:-71.061667},
{lat:42.29312583, lng:-71.06573796000001},
{lat:42.284652,lng:-71.06448899999999},
];

var redline_name = [
"Alewife", 
"Davis", 
"Porter Square",
"Harvard Square",
"Central Square",
"Kendall/MIT",
"Charles/MGH",
"Park Street",
"Downtown Crossing",
"South Station",
"Broadway",
"Andrew",
"JFK/UMass",
"North Quincy",
"Wollaston",
"Quincy Center",
"Quincy Adams",
"Braintree",
"Savin Hill",
"Fields Corner",
"Shawmut",
"Ashmont"
];

/* Part 1:
	Set up the map in genreal
	including init map, get my location, rendermap on web
*/
//initiate google map 
function init(){
	map = new google.maps.Map(document.getElementById('map_onscreen'),mapOptions);
	getMyLocation();
	poly_line(); //set marker only for all train statio 
	request_info();
}

//get location for map
function getMyLocation(){
	if(navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function(position){
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
			renderMap();
		});
	}
	else {
		alert("Geolocation is not supported by your web browser.");
	}
}

//center the map to current position and set up marker info window
function renderMap(){
	me = new google.maps.LatLng(myLat, myLng);

	map.panTo(me);
	GoogleMapMarker();
	distance(); //find nearest and set info window
	
}


/* Part 2:
   Render polyline for redline
*/

function poly_line(){

//render first polyline on map
var firstline = new Array();
for (var i = 0; i < 18; i++){
	firstline[i] = redline_station[i];
}

var redline_path = new google.maps.Polyline({
	path: firstline,
	geodesic: true,
	strokeColor: '#FF0000',
	strokeOpacity: 1.0,
	strokeWeight: 3
});

//render the second polyline on the map
var secondline = new Array();
secondline[0] = {lat: 42.320685, lng:-71.052391};
for (var j = 18; j < 22; j++){
	secondline[j-17] = redline_station[j];
}

var redline_pathtwo = new google.maps.Polyline({
	path : secondline,
	geodesic: true,
	strokeColor: '#FF0000',
	strokeOpacity: 1.0,
	strokeWeight: 3
});

redline_path.setMap(map);
redline_pathtwo.setMap(map);

}


/*	Part 3: calculate the distance
	calculate distance of the closest station, render info in infowindow, 
	render polyline from current position to nearest station
*/

function distance(){
	var R = 6371e3;
	var distance = 0;

	if (typeof(Number.prototype.toRad) == "undefined"){
		Number.prototype.toRad = function(){
			return this * Math.PI / 180;
		}
	}
//calculate distance
	var counter = 0;
	for (i = 0; i < 22; i++){

		var lat1 = redline_station[i].lat;
		var lng1 = redline_station[i].lng;
		var lat2 = myLat;
		var lng2 = myLng;
		var dLAT = (lat2 - lat1).toRad();
		var dLNG = (lng2 - lng1).toRad();

		var a = Math.sin(dLAT/2) * Math.sin(dLAT/2) + 
			Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
			Math.sin(dLNG/2) * Math.sin(dLNG/2);

		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

		var d = R * c;

		if (i == 0){
			distance = d;
		}else if (d < distance){
			distance = d;
			counter = i;
		}

	}

//render a polyline from me to nearest station
	var nearest_distance = [
		{lat: myLat, lng: myLng},
		redline_station[counter]
	];

	var blueline = new google.maps.Polyline({
		path : nearest_distance,
		geodesic: true,
		strokeColor: '#00008B',
		strokeOpacity: 1.0,
		strokeWeight: 3
	});
	
	blueline.setMap(map);

	return {counter, distance};

}


/*  Part 4: Request data from MBTA
	sort train info into each station

*/
var schedulelist = new Array(redline_station.length);
function request_info(){

	request.open("get", "http://peaceful-sands-84893.herokuapp.com/redline.json", true);
	request.onreadystatechange = metroinfo;
	request.send();

}

function metroinfo(){
	if (request.readyState == 4 && request.status == 200){

		//metroData = request.responseText;
		metroData = JSON.parse (request.responseText);

		//resort the mbta data based on station
		for (var i = 0; i < metroData["TripList"]["Trips"].length; i++){
			var Des = metroData["TripList"]["Trips"][i]["Destination"];
			for (var j = 0; j < metroData["TripList"]["Trips"][i]["Predictions"].length; j++){
				for (var k = 0; k < redline_name.length; k++){
					if (metroData["TripList"]["Trips"][i]["Predictions"][j]["Stop"] == redline_name[k]){
						time = (metroData["TripList"]["Trips"][i]["Predictions"][j]["Seconds"]);
						des = (metroData["TripList"]["Trips"][i]["Destination"]);

						schedule = {time, des};

						if (schedulelist[k] == null){
							schedulelist[k] = new Array();
							schedulelist[k].push(schedule);
						} else schedulelist[k].push(schedule);

					}
				}
			}
		}
		//sorting time into order
		for (var m = 0; m < schedulelist.length; m++){
			for (var n = 0; n < (schedulelist[m].length -1); n++){
				var min = n;
				for (var l = n + 1; l < schedulelist[m].length; l++){
					if (schedulelist[m][l].time < schedulelist[m][min].time){
						min = l;
					}
				}
				if (min != n){
					var temp = schedulelist[m][n];
					schedulelist[m][n] = schedulelist[m][min];
					schedulelist[m][min] = temp;
				}
			}
		}

	} else if (request.status != 200){
		message_warning = '<b>'+"Can't get info from MBTA, please refresh the website" + '</b>';

		var warning_window = new google.maps.InfoWindow({
			content: message_warning
		});
		warning_window.open(map);

	}
}


/* Part 5: Set markers for each station,
	render info window for markers
	set content for each marker 
   	
*/
function GoogleMapMarker(string, lat1, long1){

	for (var i = 0; i < 22; i++){
		var marker_station = install_window(redline_station[i], redline_name[i], i);
	}
	marker_station = install_window(me, "Here", 22);

}	

function install_window(position, station_name, number){
	if (number == 22){
		marker = new google.maps.Marker({
			position: position,
			title: "here"
		});
		marker.setMap(map);
	}
	else{

		var image = "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png";
		var marker = new google.maps.Marker({
			map: map,
			position: position,
			title: station_name,
			icon: image,
		});
	}

		google.maps.event.addListener(marker, 'click', function(){
			if (!this.getMap()._infoWindow){
				this.getMap()._infoWindow = new google.maps.InfoWindow();
			}
			content = get_content(number);
			this.getMap()._infoWindow.close();
			this.getMap()._infoWindow.setContent(content);
			this.getMap()._infoWindow.open(this.getMap(), this);
		});
	return marker;
}

function get_content(a){

	var content_s;
	if (a == 22){
		content_s = 'Nearest RedLine Station: ' + redline_name[distance().counter] +"<br>" + 
		'Distance: ' + Math.round(distance().distance * 0.00062137 * 100)/100 + ' miles';
	}else {

		content_s = '<h3>' + 'Station: ' + redline_name[a] + '</h3>' ;
		for (var i = 0; i < schedulelist[a].length; i++){
			var content_s = content_s + '<ul>' + '<li>' + 'To: ' + schedulelist[a][i]['des'] + ', Arrive in: '
			+ Math.round(schedulelist[a][i]["time"]/60) + 'min' + '</li>' + '</ul>';
		}
	}	

	return content_s;	

}



