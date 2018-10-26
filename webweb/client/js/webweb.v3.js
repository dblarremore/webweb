/*
 * webweb makes pretty interactive network diagrams in your browser
 * version 3.4
 *
 * Daniel Larremore + Contributors
 * August 29, 2018
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

// Here are default values. 
// If you don't put anything different in the JSON file, this is what you get!
var displayDefaults = {
    'w' : 800, // width
    'h' : 800, // height
    'c' : 60, // charge
    'g' : 0.1, // gravity
    'l' : 20, // edge length
    'r' : 5, // node radius
    'colorPalate' : 'Set1', // ... yaknow
};

var display = {};
var networkNames;
var networks;

var N;
var links = [];
var nodes = [];
var node, force, link;

var scaleSize, scaleColorScalar, scaleColorCategory, scaleLink, scaleLinkOpacity;

var nameToMatch, isHighlightText;

var colorData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'labels' : {},
    'legend' : [],
    'legendText' : [],
    'labels' : {},
    'categoryNames' : [],
};

var sizeData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'labels' : {},
    'legend' : [],
    'legendText' : [],
    'R' : 0,
    'labels' : {},
};

// Initialize the actual viz
function initializeVis() {
    // set up the DOM
    var center = d3.select("body")
        .append("div")
        .attr("id", "center");

    var menu = center.append("div")
        .attr("id", "menu");

    center.append("div")
        .attr("id", "chart")
        .append("div")
        .attr("id", "svg_div");

    initWebweb();
    writeMenus(menu);
    displayNetwork();
}
// updateVis: the update version of initializeVis
// called when a file is dragged&dropped
function updateVis(wwdata) {
    // remove the old SVG
    d3.select("#vis").remove();

    initWebweb();
    updateNetworkSelectMenu();
    displayNetwork();
}
////////////////////////////////////////////////////////////////////////////////
// - makes the svg
// - loads params from `display` (or defaults them)
// - sets the page title
// - sets up the `force` and `node` d3 magic voodoos
// - scales stuff
//
// Parameters currently passed through:
// - N (if it has to)
// - w, h, c, l, r, g
// - colorBy
// - sizeBy
// - scaleLinkOpacity
// - scaleLinkWidth
// - freezeNodeMovement
// - networkName
// - nodeCoordinates
////////////////////////////////////////////////////////////////////////////////
function initWebweb() {
    networkNames = Object.keys(wwdata.network);

    displayDefaults['networkName'] = networkNames[0];

    display = wwdata.display;
    for (var key in displayDefaults) {
        if (display[key] == undefined) {
            display[key] = displayDefaults[key];
        }
    }

    // don't allow freezeNodeMovement to be true unless we have node coordinates
    if (display.nodeCoordinates == undefined) {
        display.freezeNodeMovement = false;
    }

    var title = "webweb";
    if (display.name !== undefined) {
        title = title + " - " + display.name;
    }

    d3.select("title").text(title);

    links = [];
    nameToMatch = "";
    isHighlightText = true;

    vis = d3.select("#svg_div")
        .append("svg")
        .attr("width", display.w)
        .attr("height", display.h)
        .attr("id", "vis");

    computeNodes();

    force = d3.layout.force()
        .links(links)
        .nodes(nodes)
        .charge(-display.c)
        .gravity(display.g)
        .linkDistance(display.l)
        .size([display.w, display.h])
        .on("tick", tick);

    drawNodes();

    scaleSize = d3.scale.linear().range([1, 1]);
    scaleColorScalar = d3.scale.linear().range([1, 1]);
    scaleColorCategory = d3.scale.ordinal().range([1, 1]);
    scaleLink = d3.scale.linear().range([1, 1]);
    scaleLinkOpacity = d3.scale.linear().range([0.4, 0.9]);
}
////////////////////////////////////////////////////////////////////////////////
// - removes links
// - computes new ones
// - defines labels
// - draws links
// - uses the force (luke)
////////////////////////////////////////////////////////////////////////////////
function displayNetwork() {
    // remove old links
    links.splice(0, links.length);

    // make new links
    computeLinks();
    drawLinks();

    // figure out the available labels
    defineLabels();

    force.start();
    toggleFreezeNodes(display.freezeNodeMovement);

    // if we've frozen node movement, manually tick so that the new edges are
    // evaluated.
    if (display.freezeNodeMovement) {
        tick();
    }
}
////////////////////////////////////////////////////////////////////////////////
// loads the labels up from the places they could come from:
// 1. the defaults (none, degree)
// 2. the display parameters
// 3. the network itself
//
// Priority is given to the network's labels, then display, then defaults
////////////////////////////////////////////////////////////////////////////////
function defineLabels() {
    var allLabels = {
        'none' : {},
        'degree' : {},
    };

    if (display.labels !== undefined) {
        var displayLabels = display.labels;
        for (var label in displayLabels) {
            allLabels[label] = displayLabels[label];
        }
    }

    var networkData = wwdata.network[display.networkName];
    if (networkData !== undefined && networkData.labels !== undefined) {
        var networkLabels = networkData.labels;
        for (var label in networkLabels) {
            allLabels[label] = networkLabels[label];
        }
    }
    sizeData.labels = {};
    colorData.labels = {};
    for (label in allLabels) {
        if (allLabels[label].type !== "categorical") {
            sizeData.labels[label] = allLabels[label];
        }
        colorData.labels[label] = allLabels[label];
    }

    // update the menus with these new labels
    updateSizeMenu();
    updateColorMenu();
}
////////////////////////////////////////////////////////////////////////////////
// initialize the nodes (attempting to be smart about the number of them)
////////////////////////////////////////////////////////////////////////////////
function computeNodes() {
    if (display.N == undefined) {
        var nodeCounts = [];


        // if we don't have a node count, try to find one;
        // - make sets of each network's adjacency list and take the length
        // - take the length of nodeNames, if present
        for (i in networkNames) {
            var networkNodes = [];
            var networkName = networkNames[i];

            var adj = d3.values(wwdata.network[networkName].adjList);
            for (i in adj) {
                var edge = adj[i];
                networkNodes.push(edge[0]);
                networkNodes.push(edge[1]);
            }
            nodeCounts.push(d3.set(networkNodes).values().length);
        }

        if (display.nodeNames !== undefined) {
            nodeCounts.push(display.nodeNames.length);
        }

        display.N = d3.max(nodeCounts);
    }

    // Define nodes
    nodes = [];
    for (var i = 0; i < display.N; i++) {
        nodes.push({
            "idx" : i,
            "weight" : 0,
            "name" : display.nodeNames !== undefined ? display.nodeNames[i] : undefined,
            "x" : display.nodeCoordinates !== undefined ? display.nodeCoordinates[i].x : undefined,
            "y" : display.nodeCoordinates !== undefined ? display.nodeCoordinates[i].y : undefined,
        });
    }
}
////////////////////////////////////////////////////////////////////////////////
// initialize links/edges
//
// - scale link width/opacity
// - calculate node weights/degrees
////////////////////////////////////////////////////////////////////////////////
function computeLinks() {
    // get the adjacencies
    var adj = d3.values(wwdata["network"][display.networkName]["adjList"]);

    // scale the link weight and opacity by computing the range (extent) of the
    // adj weights.
    scaleLink.domain(d3.extent(d3.transpose(adj)[2]));
    scaleLinkOpacity.domain(d3.extent(d3.transpose(adj)[2]));

    // make a matrix so edges between nodes can only occur once
    var matrix = {}
    for (var i in nodes) {
        matrix[i] = {};
    }

    // push all the links to the list: links
    for (var i in adj) {
        var edge = adj[i];
        var source = edge[0];
        var target = edge[1];
        var weight = edge[2];

        links.push({
            source: source,
            target: target,
            w: weight,
        })

        if (! matrix[source][target]) {
            matrix[source][target] = true;
            matrix[target][source] = true;

            nodes[source].weight += weight;
            nodes[target].weight += weight;
        }
    }
}
////////////////////////////////////////////////////////////////////////////////
// Compute the radius multipliers of the nodes, given the data and chosen parameters
// 
// the 'sizeBy' display parameter determines how we will scale this.
// For example, if sizeBy is None, then the multiplier is 1 (the identity)
// Otherwise, the multiplier can be something else!
////////////////////////////////////////////////////////////////////////////////
function computeSizes() {
    rawValues = [];
    scaledValues = [];

    sizeData['type'] = display.sizeBy;

    // set all sizes to 1 if there's no scaling 
    if (display.sizeBy == "none") {
        for (var i in nodes) {
            scaledValues[i] = 1;
        }
    }
    else {
        if (display.sizeBy == "degree") {
            for (var i in nodes){
                var val = nodes[i].weight;
                rawValues[i] = val;
                scaledValues[i] = Math.sqrt(val);
            }
        }
        else {
            var label = sizeData.labels[display.sizeBy];

            sizeData['type'] = label.type;
            for (var i in nodes) {
                scaledValues[i] = label.value[i];
            }

            rawValues = scaledValues.slice(0);
        }

        // If we're scaling by degrees, linearly scale the range of SQRT(degrees) between 0.5 and 1.5
        scaleSize.domain(d3.extent(scaledValues), d3.max(scaledValues)).range([0.5, 1.5]);
        for (var i in scaledValues) {
            scaledValues[i] = scaleSize(scaledValues[i]);
        }
    }

    sizeData['scaledValues'] = scaledValues;
    sizeData['rawValues'] = rawValues;
}
////////////////////////////////////////////////////////////////////////////////
// computes the colors for the nodes based on the preferences of the user chosen
// in the dropdown menus.
////////////////////////////////////////////////////////////////////////////////
function computeColors() {
    var rawValues = [];
    var scaledValues = [];

    colorData['type'] = display.colorBy;

    // no colors
    if (display.colorBy == "none"){
        // set all nodes to dark grey 100
        for (var i in nodes) { 
            colorData['scaledValues'][i] = d3.rgb(100, 100, 100);
        }
        return
    }

    // treat degree as a scalar
    if (display.colorBy == "degree"){
        // raw values are weights
        for (var i in nodes) {
            rawValues[i] = nodes[i].weight;
        }
    }
    else {
        var label = colorData.labels[display.colorBy];
        colorData['type'] = label.type;

        for (var i in nodes){
            rawValues[i] = label.value[i];
        }

        // get the category names if it's categorical
        if (colorData['type'] == "categorical") {
            colorData['categoryNames'] = [];
            var categories = [];

            // if we don't have categories, retrieve them as scalars from the
            // values for the label
            if (label.categories == undefined) {
                var q = d3.set(rawValues).values().sort();
                for (i in q) {
                    categories[i] = q[i];
                    colorData['categoryNames'][i] = q[i];
                };
            }
            else {
                colorData['categoryNames'] = label.categories;

                // Check to see if our categories are numeric or labels
                if (isNaN(d3.quantile(rawValues, 0.25))) {
                    categories = colorData['categoryNames'].sort();
                }
                else {
                    for (var i in colorData['categoryNames']) {
                        categories[i] = i;
                    }
                }
            }

            // if there are fewer than 9 categories, use the colorbrewer
            if (categories.length <= 9) {
                scaleColorCategory.domain(categories)
                    .range(colorbrewer[display.colorPalate][categories.length]);
            }
            else {
                // otherwise, treat like scalars
                colorData['type'] = "scalarCategorical";
            }
        }
    }

    if (colorData['type'] != 'categorical') {
        scaleColorScalar.domain(d3.extent(rawValues)).range([0,1]);
    }

    // get colors by passing scaled value to colorWheel
    for (var i in nodes) {
        scaledValues[i] = colorWheel(rawValues[i]);
    }

    colorData['rawValues'] = rawValues;
    colorData['scaledValues'] = scaledValues;
}
// ColorWheel is a function that takes a node label, like a category or scalar
// and just gets the damn color. But it has to take into account what the 
// current colorData['type'] is. Basically, this is trying to apply our prefs to colors
function colorWheel(x) {
    if (isNaN(x)) {
        if (colorData['type'] == "categorical" && typeof(x) == "string"){
            return scaleColorCategory(x);
        }
        else {
            return d3.rgb(180, 180, 180)};
    }

    if (colorData['type'] == "categorical") {
        return scaleColorCategory(x);
    }
    else if (colorData['type'] == "binary") {
        if (!x) {
            return d3.rgb(30, 100, 180)
        }
        else {
            return d3.rgb(102, 186, 30)
        };
    }
    else {
        // Rainbow HSL
        return d3.hsl(210 * (1 - scaleColorScalar(x)), 0.7, 0.5);
        // Greyscale
        // return [0.8*255*x,0.8*255*x,0.8*255*x];
        // Copper
        // return [255*Math.min(x/0.75,1),0.78*255*x,0.5*255*x];
    }
}
////////////////////////////////////////////////////////////////////////////////
//
//
// Menu Interaction
//
//
// These functions are bound to the various menus that we create in the GUI.
// On menu change, one of these will be called. 
////////////////////////////////////////////////////////////////////////////////
function updateNetwork(networkName) {
    display.networkName = networkName;
    displayNetwork();
}
function changeSizes(sizeBy) {
    display.sizeBy = sizeBy;
    computeSizes();
    computeLegend();
    redrawNodes();
    if (nameToMatch != "") {
        matchNodes(nameToMatch);
    };
}
function changeColors(colorBy) {
    display.colorBy = colorBy;
    computeColors();
    computeLegend();
    redrawNodes();
    if (nameToMatch != "") {
        matchNodes(nameToMatch);
    };
}
function setColorPalate(colorPalate) {
    display.colorPalate = colorPalate;
    computeColors();
}
function changeCharge(c) {
    if (c >= 0) {
        display.c = c;
        force.charge(-c);
        force.start();
    }
    else {
        alert("Repulsion must be nonnegative.");
    }
}
function changer(r) {
    display.r = r;
    computeLegend();
    redrawNodes();
}
function changeDistance(l) {
    if (l >= 0) {
        display.l = l;
        force.linkDistance(l);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeLinkStrength(x) {
    if (x >= 0) {
        force.linkStrength(x);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeGravity(g) {
    if (g >= 0) {
        display.g = g;
        force.gravity(g);
        force.start();
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}
function toggleFreezeNodes(isFrozen) {
    display.freezeNodeMovement = isFrozen;
    if (isFrozen) {
        force.stop();
        for (var i = 0; i < force.nodes().length; i++) {
            force.nodes()[i].fixed = true;
        }
    }
    else {
        for (var i = 0; i < force.nodes().length; i++) {
            force.nodes()[i].fixed = false;
        }
        node.call(force.drag)
        force.resume();
    }

    var freezeNodesToggle = document.getElementById('freezeNodesToggle');
    if (display.freezeNodeMovement) {
        freezeNodesToggle.checked = true;
    } else {
        freezeNodesToggle.checked = false;
    }
}
function toggleLinkWidthScaling(checked) {
    if (checked) {
        scaleLink.range([0.5, 4]);
    }
    else {
        scaleLink.range([1, 1]);
    }
    redrawLinks();
}
function toggleLinkOpacity(checked) {
    if (checked) {
        scaleLinkOpacity.range([0.4, 0.9])
    }
    else {
        scaleLinkOpacity.range([1, 1]);
    }
    redrawLinks();
}
function matchNodes(x) {
    nameToMatch = x;
    if (x.length == 0){
        nodes.forEach(function(d) {
            unHighlightNode(d);
        });
    }
    else {
        nodes.forEach(function(d) {
            if (d.name.indexOf(nameToMatch) < 0) {
                unHighlightNode(d);
            }
            else {
                highlightNode(d);
            }
        })
    }
}
////////////////////////////////////////////////////////////////////////////////
//
//
//
//
// Legends
//
//
//
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// draw legend(s) for size and color
// 
// If size and color are tied to the same attribute, make one legend
// Otherwise, keep em separate
//
// prefer integer boundaries in our legends... but only if the values that are
// getting passed in are integers... etc. (etc... etc...)
//
// steps through what we think of as standard human preference.
////////////////////////////////////////////////////////////////////////////////
function computeLegend() {
    vis.selectAll("#legend").remove();

    if (sizeData['type'] == "none" && colorData['type'] == "none") {
        return;
    };

    makeColorLegend();
    makeSizeLegend();

    var R = sizeData['R'];

    // if we have a color legend, use it for the size menu (if it's there)
    var legendFillFunction;
    if (display.sizeBy == display.colorBy) {
        legendFillFunction = function(i) {
            return colorWheel(colorData['legend'][i]);
        }
    }
    else {
        legendFillFunction = function(i) {
            return d3.rgb(100, 100, 100);
        }
    }

    if (display.sizeBy != "none") {
        sizeData['legend'].forEach(function(d, i){
            vis.append("circle")
                .attr("id", "legend")
                .attr("r", display.r * d)
                .attr("cx", 5 + R)
                .attr("cy", 5 + R + 2.3 * R * i)
                .style("fill", legendFillFunction(i))
                .style("stroke", d3.rgb(255, 255, 255));
        });

        sizeData['legendText'].forEach(function(d, i){
            vis.append("text")
                .attr("id", "legend")
                .text(d)
                .attr("x", 10 + 2 * R)
                .attr("y", 5 + R + 2.3 * R * i + 4)
                .attr("fill", "black")
                .attr("font-size", 12);
        });
    }

    // if we've drawn the size legend and the color legend shows the same value,
    // return
    if (display.sizeBy == display.colorBy) {
        return;
    }

    if (colorData['type'] != "none") {
        colorData['legend'].forEach(function(d, i){
            vis.append("circle")
                .attr("id", "legend")
                .attr("r", 5)
                .attr("cx", 5 + Math.max(R, 5))
                .attr("cy", 5 + 5 + 2 * R + 2.3 * R * (sizeData['legend'].length - 1) + 5 + 2.3 * 5 * i)
                .style("fill", colorWheel(colorData['legend'][i]))
                .style("stroke", d3.rgb(255, 255, 255));
        });
        colorData['legendText'].forEach(function(d, i) {
            vis.append("text")
                .attr("id", "legend")
                .text(d)
                .attr("x", 10 + Math.max(R, 5) + 5)
                .attr("y", 5 + 5 + 2 * R + 2.3 * R * (sizeData['legend'].length - 1) + 5 + 2.3 * 5 * i + 4)
                .attr("fill", "black")
                .attr("font-size", 12);
        });
    }
}
function makeColorLegend() {
    var legend = [];
    var text = [];

    if (colorData['type'] == "none") {
        return
    }

    if (colorData['type'] == "categorical") {
        legend = scaleColorCategory.domain();
        text = d3.values(colorData['categoryNames']);
    }
    else if (colorData['type'] == "binary") {
        legend = [0, 1];
        text = ["false", "true"];
    }
    else if (colorData['type'] == "scalar" || colorData['type'] == "degree") {
        var legendData = getScalarLegend(colorData['rawValues']);

        legend = legendData['legend'];
        text = legendData['text'];
    }
    else if (colorData['type'] == "scalarCategorical") {
        legend = binnedLegend(colorData['rawValues'], 4);
        text = legend.slice(0);
    }

    colorData['legend'] = legend;
    colorData['legendText'] = text;
}
function makeSizeLegend() {
    var legend = [];
    var text = [];
    sizeData['R'] = 0;
    
    // there's no legend if:
    // - the sizeData['type'] is "none"
    // - the radius is undefined
    if (sizeData['type'] == 'none' || display.r == 0 || display.r == "") {
        return
    }

    if (sizeData['type'] == 'binary') {
        legend = [0, 1];
        text = ["false", "true"];
    }
    else {
        // otherwise, the size type is either 'degree' or 'scalar'
        var legendData = getScalarLegend(sizeData['rawValues']);

        legend = legendData['legend'];
        text = legendData['text'];
    }

    if (sizeData['type'] == "degree"){
        for (var i in legend){
            legend[i] = scaleSize(Math.sqrt(legend[i]));
        }
    }
    else {
        for (var i in legend){
            legend[i] = scaleSize(legend[i]);
        }
    }

    sizeData['R'] = display.r * d3.max(legend);
    sizeData['legend'] = legend;
    sizeData['legendText'] = text;
}
////////////////////////////////////////////////////////////////////////////////
// returns a legend for scalars, integer or non-integer
////////////////////////////////////////////////////////////////////////////////
function getScalarLegend(rawValues) {
    var legend = [];

    // if it is integer scalars:
    if (allInts(rawValues)) {
        var max = d3.max(rawValues);
        var min = d3.min(rawValues);

        if (max - min <= 8) {
            legend = d3.range(min, max + 1);
        }
        else {
            text = binnedLegend(rawValues, 4);
        }
    }
    // noninteger scalars
    else {
        legend = binnedLegend(rawValues, 4);
    }

    var text = legend.slice(0);

    return {
        'legend' : legend,
        'text' : text,
    }
}

// 'bins' a set of values so that we can display a finite legend.
function binnedLegend(vals, bins) {
    var legend = [];
    var min_val = d3.min(vals);
    var max_val = d3.max(vals);
    var step = (max_val - min_val) / bins;

    legend.push(rounddown(min_val, 10));

    for (var i = 1; i < bins; i++) {
        legend.push(round(min_val + i * step, 10));
    }

    legend.push(roundup(max_val, 10));

    return legend;
}

////////////////////////////////////////////////////////////////////////////////
//
//
//
//
// Drawing
//
//
//
//
////////////////////////////////////////////////////////////////////////////////
function drawLinks() {
    link = vis.selectAll(".link")
        .data(links);

    link.enter()
        .insert("line", ".node")
        .attr("class", "link")
        .attr("id", function(d, i) { 
            return "link_" + i; 
        })
        .style("stroke", d3.rgb(150, 150, 150))
        .style("stroke-width", function(d) {
            if (d.w == 0) {
                return 0;
            }
            else {
                return scaleLink(d.w)
            }
        })
        .style("stroke-opacity", function(d) {
            return scaleLinkOpacity(d.w)
        });

    link.exit().remove();
}
function redrawLinks() {
    links.forEach(function(d, i) {
        d3.select("#link_" + i)
            .transition()
            .style("stroke-width", function(d){
                if (d.w == 0) {
                    return 0;
                }
                else {
                    return scaleLink(d.w);
                }
            })
            .style("stroke-opacity", function(d) {
                return scaleLinkOpacity(d.w)
            });
    })
}
function drawNodes() {
    node = vis.selectAll(".node")
        .data(nodes);

    node.enter()
        .insert("circle")
        .attr("class", "node")
        .attr("r", display.r)
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("id", function(d) {
            return ("node_" + d.idx);
        })
        .style("fill", d3.rgb(255,255,255))
        .style("stroke", d3.rgb(255,255,255));

    node.exit().remove();
    node.on("mousedown", function(d) {
        unHighlightText();
        highlightText("stop");
    });

    d3.select(window).on("mouseup", function() {
        highlightText("start");
    });

    node.on("mouseover", function (d) {
        highlightNode(d); 
        highlightText(d);
    });

    node.on("mouseout", function(d) {
        unHighlightNode(d);
        unHighlightText();
    });

    node.call(force.drag);
}
function redrawNodes() {
    nodes.forEach(function(d, i) {
        d3.select("#node_" + d.idx)
            .attr("r", sizeData['scaledValues'][i] * display.r)
            .style("fill", d3.rgb(colorData['scaledValues'][i]));
    });
}
// tick attributes for links and nodes
function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
}
// Highlight a node by making it bigger and outlining it
function highlightNode(d) {
    d3.select("#node_" + d.idx)
        .transition().duration(100)
        .attr("r", sizeData['scaledValues'][d.idx] * display.r * 1.3)
        .style("stroke", d3.rgb(0,0,0));
}
// Returns a node's highlighted size and stroke to normal
function unHighlightNode(d) {
    if (nameToMatch == "" || d.name.indexOf(nameToMatch) < 0) {
        d3.select("#node_" + d.idx)
            .transition()
            .attr("r", sizeData['scaledValues'][d.idx] * display.r)
            .style("stroke",d3.rgb(255,255,255));
    }
}
// Highlight a node by showing its name next to it.
// If the node has no name, show its index.  
function highlightText(d) {
    if (d == "stop") {
        isHighlightText = false; 
        return
    }
    else if (d == "start") {
        isHighlightText = true; 
        return
    }
    if (isHighlightText){
        var nodeName = "node";
        var nodeId = d.idx;
        if (d.name !== undefined) {
            nodeName = d.name;
            nodeId = "(" + nodeId + ")";
        }

        var highlightTextString = nodeName + " " + nodeId;

        vis.append("text").text(highlightTextString)
            .attr("x", d.x + 1.5 * display.r)
            .attr("y", d.y - 1.5 * display.r)
            .attr("fill", "black")
            .attr("font-size", 12)
            .attr("id", "highlightText");
    }
}
// guess!
// (Removes a node's highlighted name) 
function unHighlightText() {
    vis.selectAll("#highlightText").remove();
}
////////////////////////////////////////////////////////////////////////////////
//
//
//
//
// MENUS
//
//
//
//
////////////////////////////////////////////////////////////////////////////////
function writeScaleLinkWidthToggle(parent) {
    var scaleLinkWidthToggle = parent.append("div")
        .attr("id", "scaleLinkWidthToggle")
        .text("Scale link width ");

    var isChecked = "unchecked";
    if (display.scaleLinkWidth) {
        isChecked = "checked";
        toggleLinkWidthScaling(true);
    }

    scaleLinkWidthToggle.append("input")
        .attr("id", "linkWidthCheck")
        .attr("type", "checkbox")
        .attr(isChecked, "")
        .attr("onchange", "toggleLinkWidthScaling(this.checked)");
}
function writeScaleLinkOpacityToggle(parent) {
    var scaleLinkOpacityToggle = parent.append("div")
        .attr("id", "scaleLinkOpacityToggle")
        .text("Scale link opacity ");

    var isChecked = "unchecked";
    if (display.scaleLinkOpacity) {
        isChecked = "checked";
        toggleLinkOpacity(true);
    }


    scaleLinkOpacityToggle.append("input")
        .attr("id", "linkOpacityCheck")
        .attr("type", "checkbox")
        .attr(isChecked, "")
        .attr("onchange", "toggleLinkOpacity(this.checked)");
}
function writeFreezeNodesToggle(parent) {
    var freezeNodesToggle = parent.append("div")
        .attr("id", "nodesMoveToggle")
        .text("Freeze Nodes ");

    freezeNodesToggle.append("input")
        .attr("id", "freezeNodesToggle")
        .attr("type", "checkbox")
        .attr("onchange", "toggleFreezeNodes(this.checked)");

}
function writeSaveButtons(parent) {
    var saveButtons = parent.append("div")
        .attr("id", "saveButtons");

    saveButtons.append("input")
        .attr("id", "saveSVGButton")
        .attr("type", "button")
        .attr("value", "Save SVG")
        .on("click", writeSVGDownloadLink);

    saveButtons.append("input")
        .attr("id", "saveJSONButton")
        .attr("type", "button")
        .attr("value", "Save webweb")
        .on("click", writeWebwebDownloadLink);
}
function writeDropJSONArea() {
    var dropJSONArea = d3.select("#chart")
        .append("div")
        .attr("id","dropJSONArea")
        .html("drop webweb json here");

    // Setup the dnd listeners.
    var dropZone = document.getElementById('chart');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', readJSONDrop, false);
}
function writeLoadJSONButton(parent) {
    var loadJSONButton = parent.append("div")
        .attr("id","loadJSONButton")
        .text("Load JSON");

    loadJSONButton.append("input")
        .attr("type", "file")
        .attr("id", "json_files")
        .attr("name", "uploadJSON")
        .attr("accept", ".json")
        .on("change", function(evt) {
            var evt = d3.event;
            readJSON();
        });
}
function writeNetworkSelectMenu(parent) {
    var networkSelectMenu = parent.append("div")
        .attr("id", "networkSelectMenu")
        .text("Display data from ");

    networkSelectMenu.append("select")
        .attr("id", "netSelect")
        .attr("onchange", "updateNetwork(this.value)")
}
function updateNetworkSelectMenu() {
    var netSelect = d3.select("#netSelect");

    netSelect.selectAll("option").remove();

    netSelect.selectAll("option")
        .data(networkNames)
        .enter()
        .append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});

    netSelect = document.getElementById('netSelect');
    netSelect.value = display.networkName;
}
function writeSizeMenu(parent) {
    var sizeMenu = parent.append("div")
        .attr("id", "sizeMenu")
        .text("Compute node size from ");

    sizeMenu.append("select")
        .attr("id", "sizeSelect")
        .attr("onchange", "changeSizes(this.value)");
}
function updateSizeMenu() {
    var sizeSelect = d3.select("#sizeSelect");

    sizeSelect.selectAll("option").remove();

    var sizeLabelStrings = [];
    for (var label in sizeData.labels) {
        sizeLabelStrings.push(label);
    }

    sizeSelect.selectAll("option")
        .data(sizeLabelStrings)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    if (display.sizeBy == undefined || sizeData.labels[display.sizeBy] == undefined) {
        display.sizeBy = "none";
    }

    sizeSelect = document.getElementById('sizeSelect');
    sizeSelect.value = display.sizeBy;
    changeSizes(display.sizeBy);
}
function writeColorMenu(parent) {
    var colorMenu = parent.append("div")
        .attr("id", "colorMenu")
        .text("Compute node color from ");

    colorMenu.append("select")
        .attr("id", "colorSelect")
        .attr("onchange","changeColors(this.value)");
}
function updateColorMenu() {
    var colorSelect = d3.select("#colorSelect");

    colorSelect.selectAll("option").remove();

    var colorLabelStrings = [];
    for (var label in colorData.labels) {
        colorLabelStrings.push(label);
    }

    colorSelect.selectAll("option")
        .data(colorLabelStrings)
        .enter()
        .append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});

    if (display.colorBy == undefined || colorData.labels[display.colorBy] == undefined) {
        display.colorBy = "none";
    }

    colorSelect = document.getElementById('colorSelect');
    colorSelect.value = display.colorBy;
    changeColors(display.colorBy);
}
function writeColorPalateMenu(parent) {
    var colorPalateMenu = parent.append("div")
        .attr("id", "colorPalateMenu")
        .text("Color Palate ");

    var colorNames = [];
    for (colorName in colorbrewer) {
        colorNames.push(colorName);
    }

    colorPalateMenu.append("select")
        .attr("id", "colorPalateMenuSelect")
        .attr("onchange", "setColorPalate(this.value)")
        .selectAll("option")
        .data(colorNames)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    colorPalateMenuSelect = document.getElementById('colorPalateMenuSelect');
    if (display.colorPalate !== undefined) {
        if (colorbrewer[display.colorPalate] !== undefined) {
            colorPalateMenuSelect.value = display.colorPalate;
        }
    }
    else {
        colorPalateMenuSelect.value = 'Set1';
    }
}
function writeChargeWidget(parent) {
    var chargeWidget = parent.append("div")
        .attr("id", "chargeWidget")
        .text("Node charge: ");

    chargeWidget.append("input")
        .attr("id", "chargeText")
        .attr("type", "text")
        .attr("onchange", "changeCharge(this.value)")
        .attr("value", -force.charge())
        .attr("size", 3);
}
function writeLinkLengthWidget(parent) {
    var linkLengthWidget = parent.append("div")
        .attr("id", "linkLengthWidget")
        .text("Link length: ");

    linkLengthWidget.append("input")
        .attr("id", "distanceText")
        .attr("type", "text")
        .attr("onchange", "changeDistance(this.value)")
        .attr("value", force.distance())
        .attr("size", 3);
}
function writeLinkStrengthWidget(parent) {
    var linkStrengthWidget = parent.append("div")
        .attr("id", "linkStrengthWidget")
        .text("Link strength: ");

    linkStrengthWidget.append("input")
        .attr("id","linkStrengthText")
        .attr("type","text")
        .attr("onchange","changeLinkStrength(this.value)")
        .attr("value", force.linkStrength())
        .attr("size", 3);
}
function writeGravityWidget(parent) {
    var gravityWidget = parent.append("div")
        .attr("id", "gravityWidget")
        .text("Gravity: ");

    gravityWidget.append("input")
        .attr("id", "gravityText")
        .attr("type", "text")
        .attr("onchange", "changeGravity(this.value)")
        .attr("value", force.gravity())
        .attr("size", 3);
}
function writeRadiusWidget(parent) {
    var radiusWidget = parent.append("div")
        .attr("id", "radiusWidget")
        .text("Node r: ");

    radiusWidget.append("input")
        .attr("id","rText")
        .attr("type", "text")
        .attr("onchange","changer(this.value)")
        .attr("value", display.r)
        .attr("size", 3);
}
function writeMatchWidget(parent) {
    var matchWidget = parent.append("div")
        .attr("id", "matchWidget")
        .text("Highlight nodes whose name matches ");

    matchWidget.append("input")
        .attr("id","matchText")
        .attr("type", "text")
        .attr("onchange", "matchNodes(this.value)")
        .attr("size", 3);
}
function writeMenus(menu) {
    var leftMenu = menu.append("div")
        .attr("id", "leftMenu")
        .attr("class", "left");

    var rightMenu = menu.append("div")
        .attr("id", "rightMenu")
        .attr("class", "right");

    writeNetworkSelectMenu(leftMenu);
    writeSizeMenu(leftMenu);
    writeColorMenu(leftMenu);
    writeColorPalateMenu(leftMenu);
    writeScaleLinkWidthToggle(leftMenu);
    writeScaleLinkOpacityToggle(leftMenu);
    writeFreezeNodesToggle(leftMenu);
    writeSaveButtons(leftMenu);
    writeDropJSONArea(leftMenu);
    // Implemented by Mike Iuzzolino, disabled by DBL for cleanliness
    // writeLoadJSONButton();

    writeChargeWidget(rightMenu);
    writeLinkLengthWidget(rightMenu);
    writeLinkStrengthWidget(rightMenu);
    writeGravityWidget(rightMenu);
    writeRadiusWidget(rightMenu);
    writeMatchWidget(rightMenu);

    updateNetworkSelectMenu();
}
////////////////////////////////////////////////////////////////////////////////
//
//
//
// Files
//
//
//
////////////////////////////////////////////////////////////////////////////////
function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.

    // Make the border pop when something is dragged over. 
    d3.select("#chart")
        .style("border", "2.5px dashed")
        .style("border-radius", "10px")
        .style("color", "#888")
        .transition().duration(400)
        .style("border", "1.5px dashed")
        .style("border-radius", "5px")
        .style("color", "#bbb");
}
// This prepares to read in a json file if you drop it. 
// It calls readJSON, which is below.
function readJSONDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    // FileList object.
    var files = evt.dataTransfer.files;

    readJSON(files);
}
// Theoretically, multiple files could have been dropped above.
// Those files are passed into readJSON
// Only the first file is used. 
function readJSON(files) {
    var file;

    if (files === undefined) {
        files = document.getElementById('json_files').files;
    }
    file = files[0];

    var start = 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) {
            var json_string = evt.target.result;
            json_string = json_string.replace("var wwdata = ", "");
            wwdata = JSON.parse(json_string);
            updateVis(wwdata);
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}
// it's crazy, this function right here, it saves: it
function saveIt(fileName, fileType, content) {
    try {
        var isFileSaverSupported = !!new Blob();
        var blob = new Blob([content], {type: fileType});
        saveAs(blob, fileName);
    } catch (e) {
        alert("can't save :(");
    }
}
function writeSVGDownloadLink() {
    var html = d3.select("svg")
        .attr("title", display.networkName)
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    saveIt(display.networkName, "image/svg+xml", html);
};
function writeWebwebDownloadLink() {
    var webwebJSON = wwdata;
    webwebJSON.display = display;

    // save node coordinates
    var nodeCoordinates = [];
    node.attr("cx", function(d) {
        nodeCoordinates.push({'x' : d.x, 'y' : d.y });
        return d.x;
    })

    webwebJSON.display.nodeCoordinates = nodeCoordinates;

    saveIt('webweb.json', 'json', JSON.stringify(webwebJSON));
}

////////////////////////////////////////////////////////////////////////////////
//
//
//
// Helpers
//
//
//
////////////////////////////////////////////////////////////////////////////////
function isInt(n) {
    return n % 1 === 0;
}
function round(x, dec) {
    return (Math.round(x * dec) / dec);
}
function roundup(x, dec) {
    return (Math.ceil(x * dec) / dec);
}
function rounddown(x, dec) {
    return (Math.floor(x * dec) / dec);
}
function allInts(vals) {
    for (i in vals) {
        if (!isInt(vals[i])) {
            return false;
        }
    }

    return true;
}

////////////////////////////////////////////////////////////////////////////////
//
//
//
// Imperial Death March
//
//
//
////////////////////////////////////////////////////////////////////////////////
window.onload = function() {
    initializeVis();
};
