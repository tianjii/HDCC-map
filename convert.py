#!/usr/bin/env python
#Script for adjusting OpenStreetMaps JSON features for use in MapboxGL JS
import json
import sys

#input converted json file
filename = sys.argv[1]

#output converted json file
outfile = sys.argv[2]
file = open(filename, "r", encoding='utf-8')
data = json.load(file)
print(data)

#cycle through OpenStreetMaps features
for feature in data["features"]: 
	#If OSM feature is made of multiple footprints connected by a "relation", separate footprints into multiple features
    if (feature["properties"].get("@relations", "") != ""):
        if feature["properties"]["@relations"][0]["reltags"].get("building:year_built", "") != "":
            feature["properties"]["building:year_built"] = int(feature["properties"]["@relations"][0]["reltags"]["building:year_built"])
        elif (feature["properties"].get("building:year_built", "") != ""):
            feature["properties"]["building:year_built"] = int(feature["properties"]["building:year_built"])
        if (feature["properties"].get("name", "") == ""):
            feature["properties"]["name"] = feature["properties"]["@relations"][0]["reltags"]["name"]
        if (feature["properties"].get("building", "") == ""):
            if (feature["properties"]["@relations"][0]["reltags"].get("building", "") != ""):
                feature["properties"]["building"] = feature["properties"]["@relations"][0]["reltags"]["building"]
    else:
        if feature["properties"].get("building:year_built", "") != "":
            feature["properties"]["building:year_built"] = int(feature["properties"]["building:year_built"])
    
    height = feature["properties"].get("height", "")
    if (height != ""):
        if height[-1] == 'm':
            height = height.replace(' m','')
        feature["properties"]["height"] = int(height)

with open(outfile, 'w') as outfile:
    json.dump(data, outfile)

print(data)