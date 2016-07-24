
  require([
    "esri/map", 
    "dojo/_base/json",
    "dojo/json",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "esri/config", 
    "esri/units",
    "esri/layers/FeatureLayer",
    "esri/renderers/ClassBreaksRenderer",
    "esri/InfoTemplate",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/tasks/ServiceAreaTask", 
    "esri/tasks/ServiceAreaParameters", 
    "esri/tasks/FeatureSet",
    "esri/symbols/CartographicLineSymbol",
    "esri/symbols/SimpleMarkerSymbol", 
    "esri/symbols/SimpleLineSymbol", 
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Point", 
    "esri/geometry/Polyline",
    "esri/geometry/webMercatorUtils",
    "esri/graphic",
    "esri/request",
    "esri/dijit/Search",
    "esri/dijit/LocateButton",
    "esri/tasks/locator",
    "esri/dijit/ElevationProfile",
    "esri/dijit/Scalebar",
    "esri/geometry/Extent",
    "dojo/parser", 
    "dojo/dom", 
    "dojo/dom-construct",
    "dijit/registry", 
    "esri/Color", 
    "dojo/_base/array",
    "esri/toolbars/draw",
    "esri/tasks/Geoprocessor",
    "esri/tasks/RouteTask",
    "esri/tasks/RouteParameters",
    "esri/tasks/DataFile",
    "dijit/layout/BorderContainer", 
    "dijit/layout/ContentPane", 
    "dijit/form/HorizontalRule", 
    "dijit/form/HorizontalRuleLabels", 
    "dijit/form/HorizontalSlider",
    "dojo/domReady!"
  ], function(
    Map, dojoJson, json, domClass, domStyle, on, esriConfig, Units, FeatureLayer, ClassBreaksRenderer, InfoTemplate, ArcGISTiledMapServiceLayer, ServiceAreaTask, ServiceAreaParameters, FeatureSet, CartographicLineSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Point, Polyline, webMercatorUtils, Graphic, esriRequest, Search, LocateButton, locator, ElevationsProfileWidget, Scalebar, Extent,
    parser, dom, domConstruct, registry, Color, arrayUtils, Draw, Geoprocessor, RouteTask, RouteParameters, DataFile
  ) {
    parser.parse();
    var map, streetColorCount = 0, searchNav, geoLocate, scalebar, myPoint, userRoutesWidgetsID = [], serviceAreaTask, serviceAreaParams, clickpoint, pointSymbol, stopSymbol, blackStreetSymbol, polygonSymbol, hSlider;

    //This sample requires a proxy page to handle communications with the ArcGIS Server services. You will need to  
    //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic 
    //for details on setting up a proxy page.
    esriConfig.defaults.io.proxyUrl = "/my-app/sproxy/";
    getLocation();
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }
    function showPosition(location) {
        var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude,
        location.coords.latitude)),
        myPoint = new Graphic(pt, pointSymbol);
        map.graphics.add(myPoint);
        map.centerAndZoom(pt, 13);
    }

    map = new Map("map", { 
      basemap: "streets",
      center: [-117.19520870000001, 34.0567513],
      zoom: 10
    });
    console.log(map)
    searchNav = new Search({
      map: map,
    }, dom.byId("search"));

    searchNav.startup();

    geoLocate = new LocateButton({
      map: map,
      highlightLocation: true,
      }, "LocateButton"
    );
    geoLocate.startup();

    scalebar = new Scalebar({
      map: map,
      scalebarUnit: "english"
    });

    pointSymbol = new SimpleMarkerSymbol(
      "circle",
      20,
      new SimpleLineSymbol(
        "solid",
        new Color([88,116,152]), 2
      ),
      new Color([88,116,152,0.45])
    );

    polygonSymbol = new SimpleFillSymbol(
      "solid",  
      null,
      new Color([0,0,0,0.0])
    );

    stopSymbol = new SimpleMarkerSymbol({
      style: "circle",
      size: 10,
      outline: { // autocasts as new SimpleLineSymbol()
        width: 2
      }
    });
    
    blackStreetSymbol = new CartographicLineSymbol(
      "solid",
      new Color([0, 0, 0]), 2,
      "round",
      "miter", 2
    );
    
    pinkStreetSymbol = new CartographicLineSymbol(
      "solid",
      new Color([255, 0, 255]), 2,
      "round",
      "miter", 2
    );
    
    blueStreetSymbol = new CartographicLineSymbol(
      "solid",
      new Color([0, 128, 125]), 2,
      "round",
      "miter", 2
    );
    
    greenStreetSymbol = new CartographicLineSymbol(
      "solid",
      new Color([102, 204, 0]), 2,
      "round",
      "miter", 2
    );

    var colorsPaletteArr = ["blueColor", "greenColor", "blackColor", "pinkColor"];
    var streetColorsArr = [ blueStreetSymbol, greenStreetSymbol, blackStreetSymbol, pinkStreetSymbol ];

    var chartOptions = {
      elevationMarkerSymbol: "m-3,-3 l3,6 3,-6 z",
      mapIndicatorSymbol: stopSymbol,
      chartTitleFontSize: 14,
      axisTitleFontSize: 11,
      axisLabelFontSize: 9,
      indicatorFontColor: '#eee',
      indicatorFillColor: '#666',
      titleFontColor: '#eee',
      axisFontColor: '#ccc',
      axisMajorTickColor: '#333',
      skyTopColor: "#B0E0E6",
      skyBottomColor: "#4682B4",
      waterLineColor: "#eee",
      waterTopColor: "#ADD8E6",
      waterBottomColor: "#0000FF",
      elevationLineColor: "#D2B48C",
      elevationTopColor: "#8B4513",
      elevationBottomColor: "#CD853F",
      elevationMarkerStrokeColor: "#FF0000"
    };
    map.on("load", mapLoadedCallback);
    map.on("click", mapClickHandler);

    hSlider = registry.byId("hslider");
    registry.byId("hslider").on("change", updateHorizontalLabel);
    updateHorizontalLabel();

    function mapLoadedCallback(){
      
    }

    // Create function that updates label when changed
    function updateHorizontalLabel() {
      // Get access to nodes/widgets we need to get/set values
      var label = dom.byId("decValue");
      // Update label
      label.innerHTML = hSlider.get("value").toFixed(2);
      // serviceAreaParams.defaultBreaks = [ hSlider.value / 60 ];
      if (clickpoint) {
        mapClickHandler(clickpoint);
      }
    }
    
    serviceAreaTask = new ServiceAreaTask("https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Service Area");
    serviceAreaParams = new ServiceAreaParameters();

    on(dom.byId("StreetLights"), "click", function(){
      console.log("lights camera action");
      if(domClass.contains(dom.byId("StreetLights"), "active")){
        map.setBasemap("streets");
      }else{
        map.setBasemap("streets-night-vector");
      }
      domClass.toggle(dom.byId("StreetLights"), "active");
    });
    on(dom.byId("options"), "click", function(evt){
      if(evt.srcElement.childNodes[1].nodeValue === " Content"){
        domClass.remove(dom.byId("content"), "hide");
        domClass.add(dom.byId("about"), "hide");
        domClass.remove(dom.byId("about-nav"), "active");
        domClass.add(dom.byId("content-nav"), "active");
      }else if(evt.srcElement.childNodes[1].nodeValue === " About"){
        domClass.add(dom.byId("content"), "hide");
        domClass.remove(dom.byId("about"), "hide");
        domClass.add(dom.byId("about-nav"), "active");
        domClass.remove(dom.byId("content-nav"), "active");
      }
    });
    //solve 
    // var serviceAreaTaskPromise = serviceAreaTask.getServiceDescription();

    // serviceAreaTaskPromise.then(function(response) {
    //   console.log("success: ", response);
    // });

    // serviceAreaTaskPromise.otherwise(function(error) {
    //   console.log("failed: ", error);
    // });
          
    function mapClickHandler(evt) {
      clickpoint = evt;
      streetColorCount = 0;
      map.disableMapNavigation();
      map.graphics.clear(); //clear existing graphics
      //define the symbology used to display the results and input point
      
      // showPosition();
      var inPoint = new Point(evt.mapPoint.x, evt.mapPoint.y, map.spatialReference),
        location = new Graphic(inPoint, pointSymbol);
        if(userRoutesWidgetsID.length > 0){
          arrayUtils.forEach(userRoutesWidgetsID, function(id, index){
            dojo.destroy(id);
          })
          dojo.query(".blackColor").forEach(dojo.destroy);
          dojo.query(".pinkColor").forEach(dojo.destroy);
          dojo.query(".greenColor").forEach(dojo.destroy);
          dojo.query(".blueColor").forEach(dojo.destroy);
        }
        userRoutesWidgetsID = [];

      map.graphics.add(location);

      var facilities = new FeatureSet();
      facilities.features = [location];

      serviceAreaParams.facilities = facilities;
      serviceAreaParams.returnPointBarriers = true;
      serviceAreaParams.returnFacilities = true;
      serviceAreaParams.outSpatialReference = map.spatialReference;
      serviceAreaParams.defaultBreaks = [ hSlider.value * 1.6 ];

      // Solve the Service Area Task
      serviceAreaTask.solve(serviceAreaParams,function(solveResult){
        // console.log("Rings Array: ", ringPointsArr);
        arrayUtils.forEach(solveResult.serviceAreaPolygons, function(serviceArea){
          serviceArea.setSymbol(polygonSymbol);
          map.graphics.add(serviceArea);
        });
        
        // Place graphic at each Ring Point
        var ringPointsArr = solveResult.serviceAreaPolygons[0].geometry.rings[0],
          numberOfRoutes = 4,
          ringPointsInterval = parseInt(ringPointsArr.length / numberOfRoutes);
          endPoints = [],
          i = 0;

        arrayUtils.forEach(ringPointsArr, function(ringPoint, index){
          if(index % ringPointsInterval === 0 && i < numberOfRoutes){
            i++;
            var pt = new Point(ringPoint[0], ringPoint[1], map.spatialReference),
              pointOnBoundary = new Graphic(pt, pointSymbol);
            endPoints.push(pt);
            map.graphics.add(pointOnBoundary);
          }
        });

        runRouteTask(inPoint, endPoints);

      }, function(err){
        console.log(err.message);
      });
    }

    function reverseGeocode(evt){
      console.log("RG: ", evt);1
    }

    function runRouteTask(startPoint, endPoints){
      // console.log("end Points", endPoints);
      
      var routeTask = new RouteTask("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"),
          routeTaskPromise = routeTask.getServiceDescription(),
          i = 0;
      arrayUtils.forEach(endPoints, function(endPoint){

        var routeParams = new RouteParameters();

        routeParams.returnRoutes = true;
        routeParams.returnStops = true;
        // routeParams.directionsLengthUnits = Units.MILES;
        routeParams.outSpatialReference = map.spatialReference;
        routeParams.supportedTravelMode = {}
        //Add stops as a FeatureSet
        routeParams.stops = new FeatureSet();
        var startingGraphic = new Graphic(startPoint, stopSymbol);
        var endingGraphic = new Graphic(endPoint, stopSymbol);

        routeParams.stops.features.push(startingGraphic);
        routeParams.stops.features.push(endingGraphic);

        // Route Task Promises (CallBack for when promise resolves)
        // routeTaskPromise.then(function(response) {
        //   console.log("success: ", i++, response);
        //   // respone.supportedTravelModes
        // });

        // routeTaskPromise.otherwise(function(error) {
        //   console.log("failed: ", error);
        // });

        routeTask.solve(routeParams, function(solveResult){
          var routePolyLine;
          // console.log("route result: ", solveResult)
          routePolyLine = solveResult.routeResults[0].route.geometry
          
          // routeTask.on("onSolveComplete", displayRoute(routePolyLine, blackStreetSymbol));
          routeTask.on("onSolveComplete", analyzeRoute(routePolyLine));
        });
      });

    }  

    function displayRoute(route, symbol){
      var routeGraphic = new Graphic(route, symbol);
      map.graphics.add(routeGraphic);
    }     

    function analyzeRoute(route){
      displayRoute(route, streetColorsArr[streetColorCount]);
      var profileParams = {
        map: map,
        profileTaskUrl: "https://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer",
        chartOptions: chartOptions,
        scalebarUnits: Units.MILES
      }

      var routeContainer = domConstruct.create("div", {style: {width:"100%", padding:"15px"}} , dom.byId("profileChartNode"), "last");
      domClass.add(routeContainer, colorsPaletteArr[streetColorCount]);

      var routeEndLocation = domConstruct.create("h2", {style: {width:"100%", padding:"15px"}} , routeContainer, "last");

      routeEndLocation.innerHTML = "<span class='dijitReset dijitInline dijitIcon esriDetailsRouteIcon'></span> Route " + (streetColorCount + 1);

      domClass.add(routeEndLocation, "endDestination");
      var newRouteGraph = domConstruct.create("div", {style: {width:"100%", padding:"15px"}} , routeContainer, "last");
      var epWidget = new ElevationsProfileWidget(profileParams, newRouteGraph);

      // Update color scheme
      streetColorCount += 1;

      epWidget.on('update-profile', function(e) {
        // console.log ('update profile', e);
      });

      epWidget.on('load', function(evt){
        epWidget.set("profileGeometry", route);
        epWidget.set("measureUnits", "esriMiles");
        // epWidget.set("profileGeometry", route);
      });


      epWidget.on('click', chooseRoute(epWidget));
      userRoutesWidgetsID.push(epWidget.id);
      epWidget.startup();

      map.enableMapNavigation();
    }

    function chooseRoute(evt){
      // console.log(evt);
    }
  });