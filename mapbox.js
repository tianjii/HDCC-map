mapboxgl.accessToken = 'pk.eyJ1Ijoic3NhbmciLCJhIjoiY2podGpqN2w2MGVlMzNxcnZzZjNncDB6bSJ9.a36ESdEXW0dRnEg2TTX64Q';

//Assign front-end objects
var nav = new mapboxgl.NavigationControl();
var yrMax = 2018;
var yrMin = 1900;
var outMax = document.getElementById('maxOut');
var outMin = document.getElementById('minOut');
var searchtext = document.getElementById('searchtext');
var searchbtn = document.getElementById('searchbtn');
var clearbtn = document.getElementById('clearbtn');
var details = document.getElementById("details");
var checkciv = document.getElementById("check-civic");
var checkres = document.getElementById("check-residential");
var checkcomm = document.getElementById("check-commercial");
var checkretail = document.getElementById("check-retail");
var checkhotel = document.getElementById("check-hotel");
var checkboxes = [checkciv, checkcomm, checkhotel, checkretail, checkres];

//Access Dataset on Mapbox via AJAX Get Request
var datasetURL = "https://api.mapbox.com/datasets/v1/ssang/cjinsj2pl02re32mu1kafb1ei/features?access_token=pk.eyJ1Ijoic3NhbmciLCJhIjoiY2podGpqN2w2MGVlMzNxcnZzZjNncDB6bSJ9.a36ESdEXW0dRnEg2TTX64Q";
var dataset = null;

httpRequest = new XMLHttpRequest();
httpRequest.onreadystatechange = readDataset;
httpRequest.open('GET', datasetURL, true);
httpRequest.send();

//Load a new mapbox map
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/dark-v9', // stylesheet location
    center: [-157.849, 21.292], // starting position [lng, lat]
    zoom: 15, // starting zoom
    minZoom: 8,
    maxZoom: 22,
    hash: false
});

//Load data JSON object into dataset variable
function readDataset(){
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
            var response = httpRequest.responseText;
            dataset = JSON.parse(response);
            console.log(dataset);
        }
        else {
            alert('There was a problem gathering data, please refresh page');
        }
    }
}



//Alphabetic sorting function
function alpha_feature(a, b){
    let out = 0;
    if (a['properties']['name'] > b['properties']['name']){
        out= 1;
    } else if (a['properties']['name'] < b['properties']['name']){
        out=-1;
    }
    return out;
}

//Filter visible buildings by year using slider
$( function() {
        $( "#slider-range" ).slider({
          range: true,
          min: 1900,
          max: 2018,
          values: [ 1900, 2018 ],
          slide: function( event, ui ) {
            $( "#amount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
            yrMin = ui.values[0];
            yrMax = ui.values[1];
            changeVisibleBldg();
          }
        });
        $( "#amount" ).val( $( "#slider-range" ).slider( "values", 0 ) +
          " - " + $( "#slider-range" ).slider( "values", 1 ) );
} );

//Search button handler
$('#searchbtn').on('click', function(e) {
    //Split search text into a key-value array
    var filtertext = searchtext.value.split(":");
    console.log(filtertext);

    //Do nothing if there are too many colons - format is incorrect
    if (filtertext.length > 2) {
        if (filtertext[0] === "building" && filtertext.length === 3) {
            filtertext = [filtertext[0]+':'+filtertext[1], filtertext[2]]
        }
        else {
            alert("Too many ':', filter not defined");
        }
    }

    //Filter by parameter if format is correct
    if (filtertext.length === 2) {
        filterVisible(filtertext[0], filtertext[1]);
    }

    //Filter by Name if there is no parameter defined
    else{
        filterVisible(null, filtertext);
    }

    //Make clear 'X' button visible
    clearbtn.style.display="inline";


});

//Clear button handler
$('#clearbtn').on('click', function(e) {
    //Fill list with all map features (no filters), hide 'X' button, clear search form
    buildLocationList(dataset['features']);
    clearbtn.style.display="none";
    searchtext.value = '';
});

//Enter button handler for searching (identical to Search button handler)
$('body').keypress(function(e){
    if(e.which == 13) {
        var filtertext = searchtext.value.split(":");
        console.log(filtertext);
        if (filtertext.length > 2) {
            if (filtertext[0] === "building" && filtertext.length === 3) {
              filtertext = [filtertext[0]+':'+filtertext[1], filtertext[2]]
            }
            else {
              alert("Too many ':', filter not defined");
            }
        }
        if (filtertext.length === 2) {
            filterVisible(filtertext[0], filtertext[1]);
        }

        else{
            filterVisible(null, filtertext);
        }
        clearbtn.style.display="inline";
    }
});

//Other-buildings opacity toggle button handler
$('#btn-other').on('click', function(e) {
    if (this.classList.contains('active')){
        map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.1);
        this.classList.remove('active');
        this.setAttribute("aria-pressed", "false");
    }
    //If the button is not active, turn off opacity and change button state
    else {
        map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0);
        this.classList.add('active');
        this.setAttribute("aria-pressed", "true");
    }
});

//Other-buildings opacity toggle button handler
$('#btn-hdcc').on('click', function(e) {
    //If the button is active, turn on opacity and change button state
    if (this.classList.contains('active')){
        map.setPaintProperty('3d-HDCC-buildings', 'fill-extrusion-opacity', 1);
        this.classList.remove('active');
        this.setAttribute("aria-pressed", "false");
    }
    //If the button is not active, turn off opacity and change button state
    else {
        map.setPaintProperty('3d-HDCC-buildings', 'fill-extrusion-opacity', 0);
        this.classList.add('active');
        this.setAttribute("aria-pressed", "true");
    }
});

//Filter visible features based on search terms
function filterVisible(filter, query) {
    var features = dataset['features'];
    var filtered_features = [];
    var q = String(query);
    if (!filter){
        //If there are no filters, iterate through map features and check if substring is in feature name
        for (i=0; i < features.length; i++) {
            var feature = features[i];
            var name = feature['properties']['name'] || '-';
            if ((name.toLowerCase().includes(q.toLowerCase()))){
                filtered_features.push(feature);
            }
        }
    }

    else {
        //Shortcut  keyword for year built parameter
        if (filter === 'year') {
            filter = 'building:year_built'
        }
        //If there is a parameter filter, attempt to pull it from feature parameters
        for (i=0; i < features.length; i++) {
            var feature = features[i];
            var prop = String(feature['properties'][filter]) || '-';
            if (prop.toLowerCase().includes(query.toLowerCase())){
                filtered_features.push(feature);
            }
        }
    }

    //Sort by alphabetical function
    var sorted_features = filtered_features.sort(alpha_feature);
    console.log(sorted_features);
    buildLocationList(sorted_features);
}

//Add default mapbox control
map.addControl(nav, 'top-left')

//Execute when map is loaded
map.on('load', function(){
    var layers = map.getStyle().layers;
    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    //Add source for HDCC OpenStreetMaps geojson (dataset stored on Mapbox.com)
    map.addSource('hdcc-buildings', {
        'type': 'vector',
        'url': 'mapbox://ssang.0l59b1sf' //Copy tileset url from mapbox after uploading
    });

    //Load default Mapbox layer for 3d Buildings
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'type': 'fill-extrusion',
        'source-layer': 'building',
        'minzoom': 6,
        'paint': {
                //Set fill extrusion height to geojson height parameter value
                'fill-extrusion-height' :
                    ['get', 'height'],
                'fill-extrusion-base' : 0,
                'fill-extrusion-opacity': 0.1,
                'fill-extrusion-color': "#AAA"

        }
    }, labelLayerId);

    //Load custom later for HDCC buildings
    map.addLayer({
        'id': '3d-HDCC-buildings',
        'source': 'hdcc-buildings',
        'type': 'fill-extrusion',
        'source-layer': 'HDCC-Buildings-New-4sel1h', //Must be set to name of tileset layer
        'minzoom': 6,
        'paint': {
            //Set fill extrusion height to geojson height parameter value+1 to prevent 3D model tearing
            'fill-extrusion-height' :
            ['+', ['get', 'height'],  1],
            'fill-extrusion-base' : 0,
            'fill-extrusion-opacity': 1,
            'fill-extrusion-color': '#0087ff'
        }
    }, labelLayerId);

    buildLocationList(dataset['features'].sort(alpha_feature));
});

//Changes cursor pointer when map feature can be clicked
map.on('mousemove', function(event) {
    if (map.loaded()){
        var features = map.queryRenderedFeatures(event.point, {
        layers: ['3d-HDCC-buildings']})
        map.getCanvas().style.cursor = (features.length)?'pointer':'';
    }
});


//Build list of features based on features and
function buildLocationList(features) {
    var listings = document.getElementById('listings');
    listings.innerHTML = ''
    //Build set of feature names in feature list
    var listSet = new Set();
    for (i=0; i < features.length; i++) {
        var current = features[i];
        var prop = current.properties;
        var name = current['properties']['name'];
        if (current['properties'].hasOwnProperty('amenity')) {
            continue;
        }
        if (listSet.has(name)){
            continue;
        }
        listSet.add(name);

        //Create box for listing and add to list
        var listings = document.getElementById('listings');
        var listing = listings.appendChild(document.createElement('div'));
        listing.className = 'item';
        listing.id = 'listing-'+i;

        //Add link to listing
        var link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.dataPosition = i;
        link.innerHTML= name;

        //Event Listener for listing click
        link.addEventListener('click', function(e) {
            var clickedListing = features[this.dataPosition];
            flyToBldg(clickedListing);
            createPopUp(clickedListing);
        });
    }
}

//Change building visibility with map filters
function changeVisibleBldg() {
    var bldg_list = [
        ['civic', 'hospital', 'school', 'train_station', 'transportation', 'university', 'public', 'grandstand'],
        ['commercial', ' office', 'industrial', 'warehouse', 'kiosk', 'cabin'],
        ['hotel'],
        ['retail'],
        ['apartments', 'farm', 'hotel', 'house', 'residential', 'dormitory', 'terrace']
    ];
    map.setFilter('3d-HDCC-buildings', null);

    //Set visibility with year inputs from year slider
    var yrFilter = ['all', ['<=', yrMin, ['to-number', ['get', 'building:year_built']]], ['>=', yrMax, ['to-number', ['get', 'building:year_built']]]];
    var bldgFilters = ['any'];
    //Iterate through checkboxes in document and filter by building type
    for (var i = 0; i < 5; i++){
        var checkbox = checkboxes[i];
        if (checkbox.checked) {
            var category = bldg_list[i];
            for (var j = 0; j < category.length; j++) {
                var newFilter = ['==', ['get', 'building']];
                newFilter.push(category[j]);
                bldgFilters.push(newFilter);
            }
        }
    }

    //Union all filters (intersect non-included)
    filters = ['all', yrFilter];
    if (bldgFilters.length > 1){
       filters.push(bldgFilters);
    }

    console.log(filters);
    map.setFilter('3d-HDCC-buildings', filters);
}

//Move map focus to latitude and longitude of list selected feature
function flyToBldg(feature) {
    address = { 'lng' :feature.geometry.coordinates[0][0][0], 'lat': feature.geometry.coordinates[0][0][1]};
     map.flyTo({
    center: address,
    zoom: 16
  });
}

//Create
function createPopUp(feature) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    //Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();
    //Take data from feature parameters
    var name = feature['properties']['name'] || '-';
    var year = feature['properties']['building:year_built'] || '-';
    var height = feature['properties']['height'] || '-';
    var type = feature['properties']['building'] || '-';
    type = (type === 'yes')?'-':type;

    //Format Popup HTML text
    var result = '<dt>Name:</dt>'+
                '<dd>'+name+'</dd>'+
                '<dt>Year Built:</dt>'+
                '<dd>'+year+'</dd>'+
                '<dt>Height(m):</dt>'+
                '<dd>'+height+'</dd>'+
                '<dt>Building Type:</dt>'+
                '<dd>'+type+'</dd>';
    var popup = new mapboxgl.Popup({closeOnClick: true}).setLngLat(feature.geometry.coordinates[0][0]).setHTML(result);
    popup.addTo(map);
    //details.innerHTML = result;
}

//Pull popup if an HDCC-building base is clicked
map.on('click', function(event) {
    var geometry = event.point;
    var parameters = {
        layers: ['3d-HDCC-buildings']
    };

    //Pull feature info at click location
    var features = map.queryRenderedFeatures(geometry, parameters);
    console.log(features);
    console.log(features.length +' features');
    //Create popup of first feature if any are located at click location
    if (features.length) {
        createPopUp(features[0]);
    }

});
