Process for adding buildings to the
Hawaiian Dredging Construction Company Project Locations Map

MAP USE INSTRUCTIONS:

    *UPDATE 8/22/2018 - Most Dredging buildings that exist on the map do not have their "building" type tag updated on OpenStreetMap
    Searching - filtering out buildings in the map works with any tag that was entered into OpenStreetMap. The format for a search takes the form of parameter:value.

    Since the parameter text must be very explicit in order to grab the right value from the feature data, the parameter for the year built was simplified.
    Officially, the parameter name is "building:year_built" because it is an official OSM parameter, but searching for year (e.g. if the search is "year:2008"), then the program knows to search for the official parameter, building:year_built:2008


    The way it works:
      1.  Split text into an array by using ":" as dividers (ex. "building:commercial" would turn into ["building", "commercial"]).
      2.  If the length of the new array is 2, then the program searches through each feature in the dataset checking if "commercial" is a substring of the "building" parameter of the feature.
          If the length of the new array is 1, then it means there are no parameters being searched and it just checks if the text is a substring of the feature name
          If the length of the array is greater than 3, nothing happens because the formatting was incorrect.
      3.  If the search term is a substring the program will add the feature to the list of links
      4.  The list is sorted in alphabetical order and posted

      Looking to see if the search term is a substring means that the search term can appear anywhere in that feature's searched parameter
      Example: Typing "year:00" in the search box will query buildings built from 2000, 2001, 2002, etc. because they all have "00" as a substring for the year built.

      Once searched, an "X" button will appear to clear the search and restore all features in the sidebar


1. Entering Data in OpenStreetMap

Once the project site has been located in OpenStreetMap and the building shape(s) have been drawn in:
    If the building is a single shape (called "ways" in OpenStreetMap), then it can be left as such.
    If the building consists of multiple ways, a relation must be made by going down to relation section of the
    feature property and assigning the relation to the feature. If no appropriate relation exists, create a new one under the relation drop down.

    Note: If the different shapes in a building are named make sure they are named exactly how you would want them to be,
          otherwise leave the name field blank because it will inherit the name of its parent relation.

          For example, Moana Pacific Towers exists as a relation, but the two towers are labeled as Moana Pacific East Tower and
          Moana Pacific West Tower specifically. If the towers were left unnamed then they would both just be called Moana Pacific Towers due to the properties of the relation.
          On the other hand, if one part of a hotel was named "Prince Waikiki" and the other was "prince waikiki" they would show up as separate
          buildings on the dropdown, which would not be ideal.


If building is made up of a single shape, then the following data can be entered into the properties of that feature. If it is made
of multiple shapes then the data can be entered into the parent relation so that it does not need to be done for each shape.
Add the appropriate info under the following OpenStreetMap categories:

    building - give building the appropriate label based on type (residential, commercial, retail, hotel, civic). Refer to wiki (https://wiki.openstreetmap.org/wiki/Key:building) for more info.
    building:year_built - the year the project was finished
    contractor - must explicitly be "Hawaiian Dredging Construction Company" in order to query the data
    height* - Building height in meters (if building:levels categories exists, that number can be multiplied by 3)

    *Height determines how tall a building shows up on a map, even if a group of ways have all their other information stored in a relation, each way should have its own height in order to for them to show up at the proper height


2. Querying the data from OpenStreetMap using Overpass Turbo

    Go to: https://overpass-turbo.eu/
    Overpass uses a unique syntax to create query requests, as seen here: https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
    In the left-side editor of Overpass Turbo, use the following script:

        //query all relations and ways that fit the contractor condition
        (relation["contractor" = "Hawaiian Dredging Construction Company"];
        way["contractor" = "Hawaiian Dredging Construction Company"];);

        //Auto-repair segment for retrieving geometries
        (._;>;);

        //output
        out body;

    Each way in OpenStreetMap has a single parameter for height, so a relation is used when a building has multiple sections of varying elevations.
    The script above queries for all ways and relations that have Dredging as the general contractor. Once the query script has been entered, press run to begin the query.
    The overpass API should start working and the queried geometry will soon render on the right side map.
    Once the query is complete, verify that the data is correct by reading the XML via the Data tab in the top right corner of OverPass Turbo.
    Export the data and download as GeoJSON.

3. Fixing the GeoData (Python Script)
    The GeoJSON data needs to be altered for two reasons:

    1. All OpenStreetMap key-value pairs are stored as strings. Some of the values such as year and height should be converted
    to integers in order to have the most flexibility when using the data either programmatically..

    2. To essentially pass down the data from the relation to each shape (like a parent-child relationship).
    Each shape in a relation holds the relation data in a property called "@relations". A parsing script can be used to take the data (building, year, name, etc) from the relation, and assign it to the way's properties.
    Example:

    {
      "type": "Feature",
      "properties": {
        "@id": "way/495467852",
        "building": "yes",
        "height": "84",
        "@relations": [
          {
            "role": "part",
            "rel": "7302032",
            "reltags": {
              "building:year_built": "1993",
              "contractor": "Hawaiian Dredging Construction Company",
              "name": "Kauhale Kaka'ako",
              "type": "building"
            }
          }
        ]
        },
      "geometry": { ...


    After Running Conversion Script relation tags are distributed to the shape's tags
    {
      "type": "Feature",
      "properties": {
        "@id": "way/495467852",
        "building": "yes",
        "height": 84,
        "building:year_built": 1993,                            //Building year, contractor, and name
        "contractor": "Hawaiian Dredging Construction Company",   //have all been added to feature properties
        "name": "Kauhale Kaka'ako",
        "@relations": [
          {
            "role": "part",
            "rel": "7302032",
            "reltags": {
              "building:year_built": "1993",
              "contractor": "Hawaiian Dredging Construction Company",
              "name": "Kauhale Kaka'ako",
              "type": "building"
            }
          }
        ]
        },
    "geometry": { ...

    Once the script has completed, the GeoJSON will not have the same formatting as the original file.
    This is because it was loaded from a text file into a JSON object, altered appropriately, and then converted back into a text file. The data is preserved because JSON files do not rely on blank spaces



4. Turning the GeoJSON into vector tilesets and datasets.

    The map style that is currently being used is the standard dark one created by mapbox. Style URL: mapbox://styles/mapbox/dark-v9
    The default MapboxGL access token is being used.

    A new map style does not have to be made to add the building features, but the GeoJSON must be turned into vector tilesets so that mapbox can render the data
    In Mapbox Studio, upload the GeoJSON as both a Dataset and Tileset. Uploading the GeoJSON as a dataset allows it to be stored and accessed on Mapbox Servers instead of being stored locally.

    Dataset:
        Once the dataset has finished loading, copy its ID and modify the variable datasetURL accordingly.
        Ex: var datasetURL = "https://api.mapbox.com/datasets/v1/{username}/{dataset_ID}/features?access_token={insert_token_here}";

        The program will access the Mapbox Datasets API in order to retrieve the entire list of GeoJSON features.

    Tileset:
        The reason that a custom style is not needed for this map is because the 3d buildings will be rendered programmatically, only using the tileset as a source
        Once the tileset has finished loading, assign the tileset to the source 'hdcc-buildings' by copying the ID into the url key of the source.

        Ex:
        map.addSource('hdcc-buildings', {
        'type': 'vector',
        'url': 'mapbox://ssang.0l59b1sf'  //url Key is found on mapbox (ssang.0l59b1sf in this case)
        });

        Once the source has been established, the MapboxGL will automatically access this tileset trying to pull from the source.
        When the program creates the layer of 3d-HDCC-buildings using the map.add() method, the source must be set to 'hdcc-buildings' and the source
        layer must be set to the name of the tileset.

        Ex:
        map.addLayer({
            'id': '3d-HDCC-buildings',
            'source': 'hdcc-buildings', //set source to hdcc-buildings
            'type': 'fill-extrusion',
            'source-layer': 'HDCC-Buildings-New-4sel1h', //set source-layer to name of tileset
            'minzoom': 6,
            'paint': {
                'fill-extrusion-height' :
                ['+', ['get', 'height'],
                'fill-extrusion-base' : 0,
                'fill-extrusion-opacity': 1,
                'fill-extrusion-color': '#0087ff'
            }
        }, labelLayerId);

    Once both the Tileset and Dataset are properly assigned, the map program should be able to pull in the data
    from the Mapbox GL js API. Note that since the data is being hosted by Mapbox, it make take a few minutes for
    data to update before it is online.

    Troubleshooting:
    The accuracy of the building data input process is solely reliant on user input from OpenStreetMaps, meaning that if mistakes are made during the data input process they will show up and cause discrepancies.
    With the use of open data, it is difficult to lock down user input from both Dredging sources and outside sources.

    Data not showing up?:
      1. Make sure that the mapbox source url for the tileset is correct
      2. Make sure that the 3d-HDCC-buildings' source layer is the name of the tileset
      3. Check if it was properly entered into OpenStreetMap
