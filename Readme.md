# Pure JS Google Static Map Maker
A js version for developer to easily build Google Static Map url.

# install
just include the `dist/JSGoogleStaticMapMaker.min.js` file into your project. 
This lib can be directly used in both any webpage as a lib and any js project like `nodejs`.

# developing
`./webpackWatch.sh -dev` to compile a readable `JSGoogleStaticMapMaker.js` file.
`./webpackWatch.sh` to compile a minified `JSGoogleStaticMapMaker.min.js` file.

# Usage Example

## Basic Usage
Note: all functions are all wrapped under `GSMMaker` object.

### Major Objects:

#### MapMaker

```
var mapMaker = new GSMMaker.MapMaker(options, key, signature);
```

`options` are basic [google static map options](https://developers.google.com/maps/documentation/static-maps/intro) valid options.
`key` is your google app key.
`signature` is your google app signature. (optional)

*options table*
      
| option | data type | validation | description |  
|---|---|---|---|
| center | Location | required_without:markers | defines the center of the map, equidistant from all edges of the map. |
| zoom | Int | required_without:markers & min:0 & max:21 | defines the [zoom level](https://developers.google.com/maps/documentation/static-maps/intro#Zoomlevels) of the map, which determines the magnification level of the map.  |
| size | Object | required & MUST be `size: {width: integer, height integer}` | defines the rectangular dimensions of the map image. For example, `size: {width: 500, height 400}` defines a map 500 pixels wide by 400 pixels high.|
| scale | Int | in:1,2,4 | affects the number of pixels that are returned. scale=2 returns twice as many pixels as scale=1 while retaining the same coverage area and level of detail (i.e. the contents of the map don't change). This is useful when developing for high-resolution displays, or when generating a map for printing. The default value is 1. Accepted values are 2 and 4 (4 is only available to Google Maps APIs Premium Plan customers.)  |
| format | String | in:png8,png,png32,gif,jpg,jpg-baseline | defines the format of the resulting image. By default, the Google Static Maps API creates PNG images. |
| maptype | String | in:roadmap,satellite,hybrid,terrain | defines the type of map to construct. There are several possible maptype values, including roadmap, satellite, hybrid, and terrain. For more information, see [Google Static Maps API Maptypes](https://developers.google.com/maps/documentation/static-maps/intro#MapTypes). |
| language | String | | [google locale codes](https://developers.google.com/maps/faq#languagesupport) defines the language to use for display of labels on map tiles. Note that this parameter is only supported for some country tiles; if the specific language requested is not supported for the tile set, then the default language for that tileset will be used. |
| region | String | | [Unicode region subtag identifiers](http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers) defines the appropriate borders to display, based on geo-political sensitivities. Accepts a region code specified as a two-character ccTLD ('top-level domain') value. |
| paths | Array | Must be [GPath,GCirclePath,GRectangePath] objects | defines a single path of two or more connected points to overlay on the image at specified locations.  |
| visible | Array | array of string | specifies one or more locations that should remain visible on the map, though no markers or other indicators will be displayed. Use this parameter to ensure that certain features or map locations are shown on the Google Static Maps API. |
| style | String | | TODO: not implemented yet |
| markers | Array | required_without:center & Must be GMarker objects |  define one or more markers to attach to the image at specified locations.  |

*Available functions*

| function | params | return | description |  
|---|---|---|---|
| toString() | | String | Generate encoded google static map url |
| getOptions() | | Object | Get current options |
| setOptions() | Object | | Set current options |
| addGMarker() | Object of GMarker | | Add 1 GMarker to markers array |
| clearGMarker() | | | Clear all markers |
| addGPath() | Object of [GPath,GCirclePath,GRectangePath] | | Add 1 [GPath,GCirclePath,GRectangePath] to paths array |
| clearGPath() | | | clear all paths |

#### Location
Usage: `new GSMMaker.Location(location)`
The param `location` can either be a string of geo address like `Vancouver BC` or an object of geo locations like `{lat: 40.718217, lng: -73.998284}`
eg:
```
var myLocationA = new GSMMaker.Location('Vancouver BC');
// or
var myLocationB = new GSMMaker.Location({lat: 40.718217, lng: -73.998284});
```

*Note*: When using `GCirclePath` and `GRectangePath` objects, the location *MUST* be fed with GEO LOCATION (latlng).

#### GMarker
Usage: `new GSMMaker.GMarker(options)`
The `GMarker` parameter defines a set of one or more `GMarker` (map pins) at a set of locations. Each marker defined within a single `GMarker` declaration must exhibit the same visual style; if you wish to display `GMarker` with different styles, you will need to supply multiple `GMarker` object within `locations` array.

*options table*

| option | data type | validation | description |  
|---|---|---|---|
| icon | String | required_with:anchor | Rather than use Google's marker icons, you are free to use your own custom icons instead. Specify the icon using a URL (which should be URL-encoded). You can use URLs created by URL-shortening services such as https://goo.gl. Most URL-shortening services have the advantage of automatically encoding URLs. |
| anchor | String | in:top,bottom,left,right,center, topleft,topright,bottomleft,bottomright | The anchor point sets how the icon is placed in relation to the specified markers locations. By default, the anchor point of a custom icon is the bottom center of the icon image. You can specify a different anchor point using the anchor descriptor in conjunction with your icon.  |
| color | String |  | specifies a 24-bit color (example: color=0xFFFFCC) or a predefined color from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}. Note that transparencies (specified using 32-bit hex color values) are not supported in markers, though they are supported for paths. |
| label | String | {A-Z, 0-9} | specifies a single uppercase alphanumeric character from the set {A-Z, 0-9}. (The requirement for uppercase characters is new to this version of the API.) Note that default and mid sized markers are the only markers capable of displaying an alphanumeric-character parameter. tiny and small markers are not capable of displaying an alphanumeric-character. |
| size | String | in:normal,tiny,mid,small | specifies the size of marker from the set {tiny, mid, small}. If no size parameter is set, the marker will appear in its default (normal) size. |
| locations | required & Array | Must be Location objects | Each marker descriptor must contain a set of one or more locations defining where to place the marker on the map.  |

*Available functions*

| function | params | return | description |  
|---|---|---|---|
| toString() | | String | Generate marker string only |
| getOptions() | | Object | Get current options |
| setOptions() | Object | | Set current options |
| addLocations() | Object of Location | | add 1 location to locations |
| clearLocations() | | | Clear all locations |

#### GPath
Usage: `new GSMMaker.GPath(options)`
The `GPath` parameter defines a set of one or more locations connected by a path to overlay on the map image. You can offer multiple `GPath` withing `locations` array in order to draw multiple `GPath`.

*options table*

| option | data type | validation | description |  
|---|---|---|---|
| weight | Int | |  specifies the thickness of the path in pixels. If no weight parameter is set, the path will appear in its default thickness (5 pixels). |
| color | String | | specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF), or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}. When a 32-bit hex value is specified, the last two characters specify the 8-bit alpha transparency value. This value varies between 00 (completely transparent) and FF (completely opaque). Note that transparencies are supported in paths, though they are not supported for markers. |
| fillcolor | String | | indicates both that the path marks off a polygonal area and specifies the fill color to use as an overlay within that area. The set of locations following need not be a "closed" loop; the Google Static Maps API server will automatically join the first and last points. Note, however, that any stroke on the exterior of the filled area will not be closed unless you specifically provide the same beginning and end location. |
| geodesic | Boolean | | indicates that the requested path should be interpreted as a geodesic line that follows the curvature of the earth. When false, the path is rendered as a straight line in screen space. Defaults to false. |
| locations | Array | required & Must be Location objects | In order to draw a path, the path parameter must also be passed two or more ``locations. The Google Static Maps API will then connect the path along those points, in the specified order.  |

*Available functions*

| function | params | return | description |  
|---|---|---|---|
| toString() | | String | Generate marker string only |
| getOptions() | | Object | Get current options |
| setOptions() | Object | | Set current options |
| addLocations() | Object of Location | | add 1 location to locations |
| clearLocations() | | | Clear all locations |

#### GCirclePath
Usage: `new GSMMaker.GCirclePath(options)`
This is a special `GPath`, witch draw a *circle* based on the center `location` (*NOT locations*) and `radius` (in meter) you offer.

*options table*

| option | data type | validation | description |  
|---|---|---|---|
| weight | Int | |  specifies the thickness of the path in pixels. If no weight parameter is set, the path will appear in its default thickness (5 pixels). |
| color | String | | specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF), or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}. When a 32-bit hex value is specified, the last two characters specify the 8-bit alpha transparency value. This value varies between 00 (completely transparent) and FF (completely opaque). Note that transparencies are supported in paths, though they are not supported for markers. |
| fillcolor | String | | indicates both that the path marks off a polygonal area and specifies the fill color to use as an overlay within that area. The set of locations following need not be a "closed" loop; the Google Static Maps API server will automatically join the first and last points. Note, however, that any stroke on the exterior of the filled area will not be closed unless you specifically provide the same beginning and end location. |
| geodesic | Boolean | | indicates that the requested path should be interpreted as a geodesic line that follows the curvature of the earth. When false, the path is rendered as a straight line in screen space. Defaults to false. |
| location | Location | required & *NOT* locations array | center of the circle |
| radius | numeric | required | The radius of your circle, unit of meters |
| detail | Int | min:8 & max:20' | To specify how detailed the circle will be drawn. Default detail will be `8` |

*Available functions*

| function | params | return | description |  
|---|---|---|---|
| toString() | | String | Generate marker string only |
| getOptions() | | Object | Get current options |
| setOptions() | Object | | Set current options |

#### GRectangePath
Usage: `new GSMMaker.GRectangePath(options)`
This is a special `GPath`, witch draw a *rectangle* based on the center `location` (*NOT locations*) and `width`&`height` pair (in meter) you offer.

*options table*

| option | data type | validation | description |  
|---|---|---|---|
| weight | Int | |  specifies the thickness of the path in pixels. If no weight parameter is set, the path will appear in its default thickness (5 pixels). |
| color | String | | specifies a color either as a 24-bit (example: color=0xFFFFCC) or 32-bit hexadecimal value (example: color=0xFFFFCCFF), or from the set {black, brown, green, purple, yellow, blue, gray, orange, red, white}. When a 32-bit hex value is specified, the last two characters specify the 8-bit alpha transparency value. This value varies between 00 (completely transparent) and FF (completely opaque). Note that transparencies are supported in paths, though they are not supported for markers. |
| fillcolor | String | | indicates both that the path marks off a polygonal area and specifies the fill color to use as an overlay within that area. The set of locations following need not be a "closed" loop; the Google Static Maps API server will automatically join the first and last points. Note, however, that any stroke on the exterior of the filled area will not be closed unless you specifically provide the same beginning and end location. |
| geodesic | Boolean | | indicates that the requested path should be interpreted as a geodesic line that follows the curvature of the earth. When false, the path is rendered as a straight line in screen space. Defaults to false. |
| location | Location | required & *NOT* locations array | center of the Rectangle |
| width | numeric | required | The width of your rectangle, unit of meters |
| height | numeric | required | The height of your rectangle, unit of meters |

*Available functions*

| function | params | return | description |  
|---|---|---|---|
| toString() | | String | Generate marker string only |
| getOptions() | | Object | Get current options |
| setOptions() | Object | | Set current options |
