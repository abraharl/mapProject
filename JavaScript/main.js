

var mapSelection = new Array(); //arry to keep track of which maps to display
var searchType = "zip"; //variable keeping track of the search type
var weather = null;  //stores the weather data
var map = null;
var mapnik;

$(document).ready(function(){
  $('.mapBox[value="weather"]').prop('checked',true);
  $('.radioSearch[value="zip"]').prop('checked',true);
  mapSelection[0] = 'weather';
});

function getData(dataPath) {  //get the data when the search is clicked
  try{
  $.ajax({
	url:dataPath,
	async:'false',
	dataType:'json',
    success:function(data){
      weather = data;
	  populateFields();
	  if($('#noBox').prop('checked') == false){
	    addMapLayer();
	  }
	  if($('#errorDiv').is(':visible')){
	    $('#errorDiv').hide();
	  }
    },
	error:function(){
	 if($('#errorDiv').is(':hidden')){
       $('#errorDiv').show();
     }
       $('#errorDiv').text("Error: Could not find the location. Please double check your entry.");  
	}
  });
  }
  catch(e){
  }
}

//handles geoCoding for Zip Codes
function geoCode(val){
  try{
    var geoCoder = new google.maps.Geocoder();
	geoCoder.geocode({address: val},function(geoResults,status){
	  var city = geoResults[0].address_components[1].long_name;
	  var state = geoResults[0].address_components[2].short_name;
	  var url = url='http://api.openweathermap.org/data/2.5/weather?q='+city+','+state+ '&APPID=798fd89defc82f4bb3399b31171e7547'
	  getData(url);
	});
  }
  catch(e){
  }
}

//listener that handles validations for the search box
function validateInput(){
  var value = String($('#searchBox').val()).replace(' ','');
  var errorText = null;
  var url = null;
  
  //validate zip
  if(searchType == 'zip'){
    if(isNaN(parseInt(value)) || value.length != 5){
	  errorText = "Error: invalid zip code. Please make sure that the value you entered contains all numbers and exactly 5 characters. For example: 12345";
    }
	else{
	  geoCode(value);
	  return;
	}
  }
  //validate latitude and longitude
  if(searchType == 'latLong'){
    var latLong = value.split(",");
	if(latLong.length != 2 || isNaN(parseFloat(latLong[0])) || isNaN(parseFloat(latLong[1]))){
	  errorText = "Error: invalid latitude and longitude coordinates. Please make sure it matches the format LAT,LONG where LAT is a valid latitude coordinate and LONG is a valid longitude. For example: 123,456";
	}
	else{
	  url='http://api.openweathermap.org/data/2.5/weather?lat='+latLong[0]+'&lon='+latLong[1]+'&APPID=798fd89defc82f4bb3399b31171e7547';
	}
  }
 
 if(searchType == 'cityName'){
   url='http://api.openweathermap.org/data/2.5/weather?q='+value+ '&APPID=798fd89defc82f4bb3399b31171e7547';
 }
 
 if(errorText != null){
   if($('#errorDiv').is(':hidden')){
     $('#errorDiv').show();
   }
   $('#errorDiv').text(errorText);
   return;
  }
  else{
    getData(url);
	if($('#errorDiv').is(':visible')){
	  $('#errorDiv').hide();
	}
	return;
  }	
}

//shows the advanced search options
function showAdvanced(){
  $('#advancedOptionsDiv').slideDown("fast");
  $('#advSearch').attr('href','javascript: hideAdvanced()');
  $('#advSearch').text('Hide Advanced Options');
}

//hides the advanced search options
function hideAdvanced(){
  $('#advancedOptionsDiv').slideUp("fast");
  $('#advSearch').attr('href','javascript: showAdvanced()');
  $('#advSearch').text('Show Advanced Options');
}

//handles the onClick functionality of the mapBox checkboxes
  function mapCheck(value){
    if($('.mapBox[value="'+value+'"]').prop('checked') == true){
	  var l = mapSelection.length;
      mapSelection[l] = value;
	  
	  if(weather != null){
	    addMapLayer();
	  }
	  
    }
	else{
	  for(var i=0; i<mapSelection.length;i++){
	    if(mapSelection[i] == value){
		  if(map != null){
		    removeMapLayer(value);
		  }
		  mapSelection.splice(i,1);
		  break;
		}
	  }
	}
    if($('#noBox').prop('checked') == true){
      $('#noBox').prop('checked',false);
    }
  }; 

 function noMap(){
   mapSelection = [];
  if($('#map').is(':visible')){
    $('#map').hide();
  }
  $('.mapBox').each(function(){
    if($(this).prop('checked') == true){
	  $(this).prop('checked',false)
	}
  });
  map = null;
  mapnik = null;
}

function setSearchType(handler){
   searchType = handler;
   if(handler == 'zip'){
     $('#searchHeader').text("Get Weather by Zip Code:");
   }
   else if(handler == 'latLong'){
     $('#searchHeader').text("Get Weather by Latitude and Longitude:");
   }
   else if(handler == 'cityName'){
     $('#searchHeader').text("Get Weather by City Name:");
   }
}

//displays the text weather data
function populateFields(){
  
  if(weather == null){ return; }
  
  if($('#textResults').is(':hidden')){
    $('#textResults').show();
  }
  
  var humidity = String(weather.main.humidity) + "%";
  var pressure = String(weather.main.pressure);
  var avgTemp = String(weather.main.temp) + "C";
  var high = String(weather.main.temp_max) + "C";
  var low = String(weather.main.temp_min) + "C";
  var windspeed = String(weather.wind.speed) + "m/s";
  var city = weather.name;
  var lat = String(weather.coord.lat);
  var lon = String(weather.coord.lon);
  var forcast = weather.weather[0].main;
  
  $('#textResults').html('<strong>City: '+city+'<br /> Lat: ' + lat + ' Lon: ' + lon + '<br />Forcast: ' + forcast + '<br /> Average Temperature: ' + avgTemp + '<br /> High: '+ high
                          +'<br /> Low: ' + low + '<br /> Humidity: '+ humidity + '<br /> Wind Speed: ' + windspeed + '<br /> Pressure: ' + pressure);
}

function createMap(){
  map = new OpenLayers.Map({div: "map"});
  mapnik = new OpenLayers.Layer.OSM();
  map.addLayers([mapnik]);
  for(var i = 0; i<mapSelection.length;i++){
   if(mapSelection[i] != 'weather'){
    var layer = new OpenLayers.Layer.XYZ(
              mapSelection[i],
			  "http://${s}.tile.openweathermap.org/map/"+mapSelection[i]+"/${z}/${x}/${y}.png",
			  {
			    isBaseLayer: false,
				opacity:0.7,
				sphericalMercator: true
			  }
             );
    map.addLayers([layer]);
  }
  else if(mapSelection[i] == 'weather'){
     var stations = new OpenLayers.Layer.Vector.OWMStations("Stations");
	 var city = new OpenLayers.Layer.Vector.OWMWeather("Weather");
	 map.addLayers([stations, city]);
   }
  }
  map.setCenter([weather.coord.lon,weather.coord.lat]);
  map.zoomTo(2);
}

//adds maps layers
function addMapLayer(){
  if($('#map').is(':hidden')){
    $('#map').show();
  }
  
  if(map == null){
    createMap();
	return;
  }
   var l = mapSelection.length - 1;
   if(mapSelection[l] != 'weather'){
	var layer = new OpenLayers.Layer.XYZ(
	  mapSelection[l],
	  "http://${s}.tile.openweathermap.org/map/"+mapSelection[l]+"/${z}/${x}/${y}.png",
	  {
	    isBaseLayer: false,
        opacity:0.7,
	    sphericalMercator:true
	  }
     );
    map.addLayers([layer]);
   }
   else{
     var stations = new OpenLayers.Layer.Vector.OWMStations("Stations");
	 var city = new OpenLayers.Layer.Vector.OWMWeather("Weather");
	 map.addLayers([stations,city]);
   }
}

function removeMapLayer(value){
  for(var i = 0; i<map.layers.length; i++){
    if(map.layers[i].name == value && value != 'weather'){
	  map.removeLayer(map.layers[i]);
	  return;
	}
	else if(value == 'weather' && map.layers[i].name == 'Stations'){
	  map.removeLayer(map.layers[i]);
	  map.removeLayer(map.layers[i]);
	  return;
	}
  }
}