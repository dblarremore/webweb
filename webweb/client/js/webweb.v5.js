/*
 * webweb makes pretty interactive network diagrams in your browser
 * version 4
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
    'linkStrength' : 1, // link strength
    'colorPalette' : 'Set1', // ... yaknow
};

var display = {};
var networkNames;
var networks;

var links = [];
var nodes = [];
var node, simulation, link;

var nodePersistence = [];

var scaleSize, scaleColorScalar, scaleColorCategory, scaleLink, scaleLinkOpacity;

var nameToMatch;

var colorData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'labels' : {},
    'categoryNames' : [],
};

var sizeData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'labels' : {},
    'R' : 0,
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
// called when a file is dragged & dropped
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
// - sets up the simulation and `node` d3 magic voodoos
// - scales stuff
//
// Parameters currently passed through:
// - N (if necessary)
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

    // move things into "frames" if they're not
    for (var i in networkNames) {
        if (wwdata.network[networkNames[i]].frames == undefined) {
            wwdata.network[networkNames[i]].frames = [
                {
                    'adjList' : wwdata.network[networkNames[i]].adjList,
                    'labels' : wwdata.network[networkNames[i]].labels,
                }
            ]
        }
    }

    // the default network will be the first one in the list of networks
    displayDefaults['networkName'] = networkNames[0];
    displayDefaults['networkFrame'] = 0;

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

    scaleSize = d3.scaleLinear().range([1, 1]);
    scaleColorScalar = d3.scaleLinear().range([1, 1]);
    scaleColorCategory = d3.scaleOrdinal().range([1, 1]);
    scaleLink = d3.scaleLinear().range([1, 1]);
    scaleLinkOpacity = d3.scaleLinear().range([0.4, 0.9]);

    nameToMatch = "";

    vis = d3.select("#svg_div")
        .append("svg")
        .attr("width", display.w)
        .attr("height", display.h)
        .attr("id", "vis");

    computeNodes();
    drawNodes();

    simulation = d3.forceSimulation(nodes)
        .force("center", d3.forceCenter(display.w / 2, display.h / 2))
        .on('tick', tick);

    updateChargeForce();
    updateGravityForce();
}
////////////////////////////////////////////////////////////////////////////////
// - changes the number of visible nodes
// - computes links
// - draws links
// - defines labels
// - uses the force (luke)
////////////////////////////////////////////////////////////////////////////////
function displayNetwork() {
    setVisibleNodes();

    defineLabels();

    computeLinks();
    drawLinks();

    updateLinkForce();

    toggleFreezeNodes(display.freezeNodeMovement);
    toggleInvertBinary(display[getBinaryInversionAttributeForType('color')], 'color')
    toggleInvertBinary(display[getBinaryInversionAttributeForType('size')], 'size')

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (display.freezeNodeMovement) {
        tick();
    }

    // change the display of the frames widget
    setNetworkFrameMenuVisibility();

    computeColors();
    computeSizes();
    computeLegend();
    redrawNodes();
    redisplayNodeNames();
}
////////////////////////////////////////////////////////////////////////////////
// adds/removes nodes from the visualization
//
// it currently only handles removing from the end.
// however, we would like to be able to do this by name (i.e. id).
////////////////////////////////////////////////////////////////////////////////
function setVisibleNodes() {
    // have to handle 2 things:
    // - named nodes
    // - unnamed nodes
    //
    // how?
    // - after initing, save all nodes in `nodePersistence`, dict:
    //      - key: index or nodeName (in order of display.nodeNames)
    //      - values:
    //          - element: html element
    //          - graphic: svg element to draw
    // - if we have nodes:
    //      - if those nodes are a count:
    //          - take the keys and spit them to the nodes array
    //          - draw them
    //      - if those nodes are a list:
    //          - read from the dict
    if ('nodes' in wwdata.network[display.networkName].frames[display.networkFrame]) {
        var networkNodes = wwdata.network[display.networkName].frames[display.networkFrame].nodes;
        if (networkNodes < nodes.length) {
            while (networkNodes != nodes.length) {
                var toRemove = nodes.pop();
                var drawnNode = document.getElementById("node_" + toRemove.idx)
                document.getElementById("vis").removeChild(drawnNode);
                nodePersistence.push({ 'node' : toRemove, 'toDraw' : drawnNode });
            }
        }
        else if (networkNodes > nodes.length) {
            while (networkNodes != nodes.length) {
                var toAdd = nodePersistence.pop();
                document.getElementById("vis").appendChild(toAdd.toDraw);
                nodes.push(toAdd.node);
            }
        }
    }
    else if (display.N > nodes.length) {
        // otherwise, if we don't have a set number of nodes, reset the number
        // of nodes to the maximum
        while (nodes.length != display.N) {
            var toAdd = nodePersistence.pop();
            document.getElementById("vis").appendChild(toAdd.toDraw);
            nodes.push(toAdd.node);
        }
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
        'degree' : {
            'type' : 'scalar',
        },
    };

    if (display.labels !== undefined) {
        var displayLabels = display.labels;
        for (var label in displayLabels) {
            allLabels[label] = displayLabels[label];

            // assign the property to the node values
            for (var i in nodes) {
                nodes[i][label] = displayLabels[label].value[i];
            }
        }
    }

    var networkData = wwdata.network[display.networkName].frames[display.networkFrame];
    if (networkData !== undefined && networkData.labels !== undefined) {
        var networkLabels = networkData.labels;
        for (var label in networkLabels) {
            allLabels[label] = networkLabels[label];

            // assign the property to the node values
            for (var i in nodes) {
                nodes[i][label] = networkLabels[label].value[i];
            }
        }
    }

    sizeData.labels = {};
    colorData.labels = {};
    for (label in allLabels) {
        if (allLabels[label].type == undefined) {
            allLabels[label].type = getLabelType(allLabels[label])
        }

        if (allLabels[label].type !== "categorical") {
            sizeData.labels[label] = allLabels[label];

        }
        colorData.labels[label] = allLabels[label];
    }

    // these below if statements are only here because of poor design (says
    // hunter, the designer of this bit)
    // really, computeSizes and computeColors should already have this
    // information.
    if (display.colorBy !== undefined && display.colorBy !== 'none') {
        colorData.type = allLabels[display.colorBy].type;
    }

    if (display.sizeBy !== undefined && display.sizeBy !== 'none') {
        sizeData.type = allLabels[display.sizeBy].type;
    }

    // update the menus with these new labels
    updateSizeMenu();
    updateColorMenu();
}
////////////////////////////////////////////////////////////////////////////////
// tries to figure out the label type of a given label.
////////////////////////////////////////////////////////////////////////////////
function getLabelType(label) {
    if (label.categories !== undefined) {
        return 'categorical';
    }

    var q = d3.set(label.value).values().sort();

    // check if this is a binary relation
    if (q.length == 2 && q[0] == 'false' && q[1] == 'true') {
        return 'binary';
    }
    else if (q.length == 1 && (q[0] == 'false' || q[0] == 'true')) {
        return 'binary';
    }
    else if (q.some(isNaN)) {
        return 'categorical';
    }
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
        for (var i in networkNames) {
            var networkNodes = [];
            var networkName = networkNames[i];

            var adj = d3.values(wwdata.network[networkName].frames[display.networkFrame].adjList);
            for (i in adj) {
                var edge = adj[i];
                networkNodes.push(edge[0]);
                networkNodes.push(edge[1]);
            }
            nodeCounts.push(d3.set(networkNodes).values().length);

            var networkFrames = wwdata.network[networkName].frames;
            for (var j in networkFrames) {
                if (networkFrames[j].nodes !== undefined) {
                    nodeCounts.push(networkFrames[j].nodes);
                }
            }
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
            "degree" : 0,
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
    links = [];

    // get the adjacencies
    var adj = d3.values(wwdata.network[display.networkName].frames[display.networkFrame].adjList);

    var nodeIdsMap = {};

    // if we aren't given a number of nodes, make sure they're 0 indexed
    if (wwdata.network[display.networkName].frames[display.networkFrame].nodes == undefined) {
        console.log('sup');
        var nodeIds = [];

        for (var i in adj) {
            nodeIds.push(adj[i][0]);
            nodeIds.push(adj[i][1]);
        }

        nodeIds = d3.set(nodeIds).values().sort();

        for (var i in nodeIds) {
            nodeIdsMap[nodeIds[i]] = i;
        }
    }
    else {
        var numberOfNodes = wwdata.network[display.networkName].frames[display.networkFrame].nodes;
        console.log(numberOfNodes);

        // otherwise just trust the edges
        for (var i = 0; i < numberOfNodes; i++) {
            nodeIdsMap[i] = i;
        }
    }

    // make a matrix so edges between nodes can only occur once
    var matrix = {}
    for (var i in nodeIdsMap) {
        matrix[nodeIdsMap[i]] = {};
    }

    // reset the node degrees
    for (var i in nodes) {
        nodes[i].degree = 0;
    }

    // push all the links to the list: links
    var weights = [];
    for (var i in adj) {
        var edge = adj[i];
        var source = nodeIdsMap[parseInt(edge[0])];
        var target = nodeIdsMap[parseInt(edge[1])];

        // if there's no edge weight, default it to 1
        var weight = edge.length == 3 ? parseFloat(edge[2]) : 1;

        weights.push(weight);
            
        links.push({
            source: source,
            target: target,
            w: weight,
        })

        if (! matrix[source][target]) {
            matrix[source][target] = true;
            matrix[target][source] = true;

            nodes[source].degree += weight;
            nodes[target].degree += weight;
        }
    }
    
    // scale the link weight and opacity by computing the range (extent) of the
    // adj weights.
    scaleLink.domain(d3.extent(weights));
    scaleLinkOpacity.domain(d3.extent(weights));

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

    sizeData.type = display.sizeBy;

    // default to hiding the size binary inversion widget
    changeInvertBinaryWidgetVisibility(false, 'size');

    // set all sizes to 1 if there's no scaling 
    if (display.sizeBy == "none") {
        for (var i in nodes) {
            scaledValues[i] = 1;
        }
    }
    else {
        var label = sizeData.labels[display.sizeBy];
        sizeData.type = label.type;

        if (sizeData.type == 'binary') {
            changeInvertBinaryWidgetVisibility(true, 'size');
        }

        rawValues = getRawNodeValues(display.sizeBy, label.type, 'size');

        for (var i in nodes) {
            scaledValues[i] = rawValues[i];
            // if we're sizing by degree, square root the value
            if (display.sizeBy == "degree") {
                scaledValues[i] = Math.sqrt(scaledValues[i]);
            }
        }

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
    colorData.type = display.colorBy;

    // default to hiding the color palette menu
    changeColorPaletteMenuVisibility(false);

    // default to hiding the color binary inversion widget
    changeInvertBinaryWidgetVisibility(false, 'color');

    // no colors
    if (display.colorBy == "none"){
        // set all nodes to dark grey 100
        for (var i in nodes) { 
            colorData['scaledValues'][i] = d3.rgb(100, 100, 100);
        }
        return
    }

    var label = colorData.labels[display.colorBy];
    colorData.type = label.type;

    var rawValues = getRawNodeValues(display.colorBy, label.type, 'color');

    categoryValues = [];

    if (colorData.type == 'binary') {
        categoryValues = getBinaryValues('color');
        changeInvertBinaryWidgetVisibility(true, 'color');
    }
    else if (colorData.type == "categorical") {
        // get the category names if it's categorical
        colorData['categoryNames'] = [];

        // if we don't have categories, retrieve them as scalars from the
        // values for the label
        if (label.categories == undefined) {
            colorData['categoryNames'] = d3.set(rawValues).values().sort();
            categoryValues = colorData['categoryNames'];
        }
        else {
            colorData['categoryNames'] = label.categories;

            // Check to see if our categories are numeric or labels
            if (isNaN(d3.quantile(rawValues, 0.25))) {
                categoryValues = colorData['categoryNames'].sort();
            }
            else {
                for (var i in colorData['categoryNames']) {
                    categoryValues[i] = i;
                }
            }
        }
    }

    if (categoryValues.length) {
        // if there are fewer than 9 categories, use the colorbrewer
        // TODO:
        // actually check how many colors there are in the user's selected
        // colorbrewer
        // update the list for this...
        if (categoryValues.length <= 9) {
            scaleColorCategory.domain(categoryValues)
                .range(colorbrewer[display.colorPalette][categoryValues.length]);

            changeColorPaletteMenuVisibility(true);
        }
        else {
            // otherwise, treat like scalars
            colorData.type = "scalarCategorical";
        }
    }

    if (colorData.type != 'categorical') {
        scaleColorScalar.domain(d3.extent(rawValues)).range([0,1]);
    }

    var scaledValues = [];

    // get colors by passing scaled value to colorWheel
    for (var i in nodes) {
        scaledValues[i] = colorWheel(rawValues[i]);
    }

    colorData['rawValues'] = rawValues;
    colorData['scaledValues'] = scaledValues;
}
////////////////////////////////////////////////////////////////////////////////
// returns raw values for:
// - a labelName
// - a labelType
// - a displayType (color/size)
////////////////////////////////////////////////////////////////////////////////
function getRawNodeValues(labelName, labelType, displayType) {
    var rawValues = [];
    for (var i in nodes){
        var val = nodes[i][labelName];

        if (labelType == 'binary') {
            val = getBinaryValue(val, displayType);
        }

        rawValues[i] = val;
    }

    return rawValues;
}
// ColorWheel is a function that takes a node label, like a category or scalar
// and just gets the damn color. But it has to take into account what the 
// current colorData.type is. Basically, this is trying to apply our prefs to colors
function colorWheel(x) {
    if (colorData.type == "categorical") {
        return scaleColorCategory(x);
    }
    else if (colorData.type == 'binary') {
        return scaleColorCategory(getBinaryValue(x, 'color'));
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
    var networkSelect = document.getElementById('networkSelect');
    networkSelect.value = networkName;

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
function setColorPalette(colorPalette) {
    display.colorPalette = colorPalette;
    computeColors();
    computeLegend();
    redrawNodes();
}
function changeCharge(c) {
    if (c >= 0) {
        display.c = c;
        updateChargeForce();
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
        updateLinkForce();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeLinkStrength(linkStrength) {
    if (linkStrength >= 0) {
        display.linkStrength = linkStrength;
        updateLinkForce();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeGravity(g) {
    if (g >= 0) {
        display.g = g;
        updateGravityForce();
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}
function toggleFreezeNodes(isFrozen) {
    display.freezeNodeMovement = isFrozen;
    if (isFrozen) {
        simulation.stop();
        for (var i = 0; i < simulation.nodes().length; i++) {
            simulation.nodes()[i].fx = simulation.nodes()[i].x;
            simulation.nodes()[i].fy = simulation.nodes()[i].y;
        }
    }
    else {
        for (var i = 0; i < simulation.nodes().length; i++) {
            simulation.nodes()[i].fx = undefined;
            simulation.nodes()[i].fy = undefined;
        }
        simulation.alpha(1).restart();
    }

    var freezeNodesToggle = document.getElementById('freezeNodesToggle');
    freezeNodesToggle.checked = display.freezeNodeMovement ? true : false;
}
function toggleShowNodeNames(show) {
    display.showNodeNames = show;
    redisplayNodeNames();

    var showNodeNamesWidget = document.getElementById('showNodeNames');
    showNodeNamesWidget.checked = display.showNodeNames;
}
function toggleInvertBinary(setting, type) {
    var widgetId = getBinaryInversionAttributeForType(type);

    var widget = document.getElementById(widgetId);
    widget.checked = setting;
    display[widgetId] = setting;

    if (type == 'color') {
        computeColors();
    }
    else {
        computeSizes();
    }
    computeLegend();
    redrawNodes();
}
function getBinaryValue(value, type) {
    var attribute = getBinaryInversionAttributeForType(type);

    if (display[attribute]) {
        return value ? false : true;
    }
    else {
        return value;
    }
}
function getBinaryValues(type) {
    return [getBinaryValue(false, type), getBinaryValue(true, type)];
}
function redisplayNodeNames() {
    hideNodeText();

    if (display.showNodeNames) {
        showNodeNamesWhenStable();
    }
}
function showNodeNamesWhenStable() {
    window.setTimeout(function() {
        if (simulation.alpha() < .01) {
            for (var i in nodes) {
                showNodeText(nodes[i]);
            }
        }
        else {
            showNodeNamesWhenStable();
        }
    }, 100);
}
function updateChargeForce() {
    simulation.force("charge", d3.forceManyBody().strength(-display.c))
    simulation.alpha(1).restart();
}
function updateGravityForce() {
    simulation.force("x", d3.forceX(display.w / 2).strength(display.g));
    simulation.force("y", d3.forceY(display.h / 2).strength(display.g));
}
function updateLinkForce() {
    simulation.force('link',
        d3.forceLink()
            .links(links)
            .distance(display.l)
            .strength(display.linkStrength)
    )
    simulation.alpha(1).restart();
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

    if (sizeData.type == "none" && colorData.type == "none") {
        return;
    };

    var colorLegend = makeColorLegend();
    var sizeLegend = makeSizeLegend();

    var R = sizeData['R'];

    // if we have a color legend, use it for the size menu (if it's there)
    var legendFillFunction;
    if (display.sizeBy == display.colorBy) {
        legendFillFunction = function(i) {
            return colorWheel(colorLegend['values'][i]);
        }
    }
    else {
        legendFillFunction = function(i) {
            return d3.rgb(100, 100, 100);
        }
    }

    if (display.sizeBy != "none") {
        sizeLegend['values'].forEach(function(d, i){
            vis.append("circle")
                .attr("id", "legend")
                .attr("r", display.r * d)
                .attr("cx", 5 + R)
                .attr("cy", 5 + R + 2.3 * R * i)
                .style("fill", legendFillFunction(i))
                .style("stroke", d3.rgb(255, 255, 255));
        });

        sizeLegend['text'].forEach(function(d, i){
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

    if (colorData.type != "none") {
        // how far down should we "push" the color legend to accomodate for the
        // size legend
        pushDown = sizeLegend == undefined ? 0 : sizeLegend['values'].length;

        colorLegend['values'].forEach(function(d, i){
            vis.append("circle")
                .attr("id", "legend")
                .attr("r", 5)
                .attr("cx", 5 + Math.max(R, 5))
                .attr("cy", 5 + 5 + 2 * R + 2.3 * R * (pushDown - 1) + 5 + 2.3 * 5 * i)
                .style("fill", colorWheel(colorLegend['values'][i]))
                .style("stroke", d3.rgb(255, 255, 255));
        });
        colorLegend['text'].forEach(function(d, i) {
            vis.append("text")
                .attr("id", "legend")
                .text(d)
                .attr("x", 10 + Math.max(R, 5) + 5)
                .attr("y", 5 + 5 + 2 * R + 2.3 * R * (pushDown - 1) + 5 + 2.3 * 5 * i + 4)
                .attr("fill", "black")
                .attr("font-size", 12);
        });
    }
}
function makeColorLegend() {
    var legend = {};

    if (colorData.type == "none") {
        return
    }

    if (colorData.type == "categorical") {
        legend['values'] = scaleColorCategory.domain();
        legend['text'] = d3.values(colorData['categoryNames']);
    }
    else if (colorData.type == "binary") {
        legend['values'] = getBinaryValues('color');
        legend['text'] = [false, true];
    }
    else if (colorData.type == "scalar" || colorData.type == "degree") {
        legend = getScalarLegend(colorData['rawValues']);
    }
    else if (colorData.type == "scalarCategorical") {
        legend['values'] = binnedLegend(colorData['rawValues'], 4);
        legend['text'] = legend.slice(0);
    }

    return legend;
}
function makeSizeLegend() {
    var legend = {};
    sizeData['R'] = 0;
    
    if (sizeData.type == 'none') {
        return
    }

    if (sizeData.type == 'binary') {
        legend['values'] = getBinaryValues('size');
        legend['text'] = ["false", "true"];
    }
    else {
        // otherwise, the size type is either 'degree' or 'scalar'
        legend = getScalarLegend(sizeData['rawValues']);
    }

    var scaleFunction;
    if (display.sizeBy == "degree") {
        scaleFunction = function(x) { return Math.sqrt(x); };
    }
    else {
        scaleFunction = function (x) { return x; };
    }

    for (var i in legend['values']) {
        legend['values'][i] = scaleSize(scaleFunction(legend['values'][i]));
    }

    sizeData['R'] = display.r * d3.max(legend['values']);

    return legend;
}
////////////////////////////////////////////////////////////////////////////////
// returns a legend for scalars, integer or non-integer
////////////////////////////////////////////////////////////////////////////////
function getScalarLegend(rawValues) {
    var values = [];

    // if it is integer scalars:
    if (allInts(rawValues)) {
        var max = d3.max(rawValues);
        var min = d3.min(rawValues);

        if (max - min <= 8) {
            values = d3.range(min, max + 1);
        }
        else {
            values = binnedLegend(rawValues, 4);
        }
    }
    // noninteger scalars
    else {
        values = binnedLegend(rawValues, 4);
    }

    var text = values.slice(0);

    return {
        'values' : values,
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
    vis.selectAll(".node")
        .data(nodes)
        .enter()
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
        .style("fill", d3.rgb(255, 255, 255))
        .style("stroke", d3.rgb(255, 255, 255))
        .exit().remove();

    node = vis.selectAll(".node");

    node.on("mousedown", function(d) {
        if (! display.showNodeNames) {
            hideNodeText(d);
        }
    });

    node.on("mouseover", function (d) {
        highlightNode(d); 

        if (! display.showNodeNames) {
            showNodeText(d);
        }
    });

    node.on("mouseout", function(d) {
        unHighlightNode(d);
        if (! display.showNodeNames) {
            hideNodeText(d);
        }
    });

    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
}
function dragstarted(d) {
    display.storedShowNodeNames = display.showNodeNames;

    // hide node text while we are dragging
    hideNodeText();

    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
}
function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}
function dragended(d) {
    if (!d3.event.active) {
        simulation.alphaTarget(0);
    }

    if (! display.freezeNodeMovement) {
        d.fx = null;
        d.fy = null;
    }

    // evaluate whether we should show highlight text now that we're done
    // dragging
    redisplayNodeNames();
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
    link = vis.selectAll(".link")
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node = vis.selectAll(".node")
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
            .style("stroke", d3.rgb(255, 255, 255));
    }
}
// Highlight a node by showing its name next to it.
// If the node has no name, show its index.  
function showNodeText(d) {
    var nodeName = "node";
    var nodeId = d.idx;
    if (d.name !== undefined) {
        nodeName = d.name;
        nodeId = "(" + nodeId + ")";
    }

    var nodeTextString = nodeName + " " + nodeId;

    vis.append("text").text(nodeTextString)
        .attr("x", d.x + 1.5 * display.r)
        .attr("y", d.y - 1.5 * display.r)
        .attr("fill", "black")
        .attr("font-size", 12)
        .attr("id", "nodeText");
}
// guess!
// (Removes a node's text)
function hideNodeText() {
    vis.selectAll("#nodeText").remove();
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
function writeNetworkMenu(parent) {
    var networkMenu = parent.append("div")
        .attr("id", "networkMenu");

    var networkSelectMenu = networkMenu.append("span")
        .attr("id", "networkSelectMenu")
        .text("Display data from ");

    networkSelectMenu.append("select")
        .attr("id", "networkSelect")
        .attr("onchange", "updateNetwork(this.value)")

    writeNetworkFrameMenu(networkMenu);
}
function updateNetworkSelectMenu() {
    var networkSelect = d3.select("#networkSelect");

    networkSelect.selectAll("option").remove();

    networkSelect.selectAll("option")
        .data(networkNames)
        .enter()
        .append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});

    networkSelect = document.getElementById('networkSelect');
    networkSelect.value = display.networkName;
    updateNetworkFrameSelect();
}
function writeSizeMenu(parent) {
    var sizeMenu = parent.append("div")
        .attr("id", "sizeMenu")
        .text("Compute node size from ");

    sizeMenu.append("select")
        .attr("id", "sizeSelect")
        .attr("onchange", "changeSizes(this.value)");

    writeBinaryInversionWidget(sizeMenu, 'size');
}
function setNetworkFrameMenuVisibility() {
    var visible;
    if (wwdata.network[display.networkName].frames.length == 1) {
        visible = false;
    }
    else {
        visible = true;
    }

    var visibility = visible ? 'inline' : 'none';
    var networkFrameMenu = d3.select('#networkFrameMenu')
        .style('display', visibility);
}
function writeNetworkFrameMenu(parent) {
    var networkFrameMenu = parent.append("span")
        .attr("id", "networkFrameMenu")
        .text(" frame: ");

    var frames = [];
    for (var i in wwdata.network[display.networkName].frames) {
        frames.push(i);
    }

    networkFrameMenu.append("select")
        .attr("id", "networkFrameMenuSelect")
        .attr("onchange", "displayNetworkFrame(this.value)")
        .selectAll("option")
        .data(frames)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    updateNetworkFrameSelect();
}
function updateNetworkFrameSelect() {
    networkFrameMenuSelect = document.getElementById('networkFrameMenuSelect');
    networkFrameMenuSelect.value = display.networkFrame;
}
function displayNetworkFrame(frame) {
    display.networkFrame = frame;
    displayNetwork();
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
        .attr("id", "colorMenu");

    var colorByMenu = colorMenu.append("span")
        .attr('id', 'colorByMenu')
        .text("Compute node color from ");

    colorByMenu.append("select")
        .attr("id", "colorSelect")
        .attr("onchange","changeColors(this.value)");

    writeColorPaletteMenu(colorMenu);
    writeBinaryInversionWidget(colorMenu, 'color');
}
function writeBinaryInversionWidget(parent, type) {
    var widgetId = getBinaryInversionAttributeForType(type);
    var widgetContainerId = widgetId + "Widget";

    var binaryInversionWidget = parent.append("span")
        .attr("id", widgetContainerId)
        .text(" invert ");

    var checked = 'unchecked';
    if (display[widgetId]) {
        checked = 'checked';
    }

    binaryInversionWidget.append("input")
        .attr("id", widgetId)
        .attr("type", "checkbox")
        .attr(checked, "")
        .attr("onchange", "toggleInvertBinary(this.checked, '" + type + "')")
        .attr("size", 3);
}
function changeInvertBinaryWidgetVisibility(visible, type) {
    var visibility = visible ? 'inline' : 'none';
    var widgetId = getBinaryInversionAttributeForType(type) + "Widget";
    var colorBinaryInversionMenu = d3.select('#' + widgetId)
        .style('display', visibility);
}
function getBinaryInversionAttributeForType(type) {
    if (type == 'color') {
        return 'invertBinaryColors';
    }
    else if (type == 'size') {
        return 'invertBinarySizes';
    }
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
function changeColorPaletteMenuVisibility(visible) {
    var visibility = visible ? 'inline' : 'none';
    var colorPaletteMenu = d3.select('#colorPaletteMenu')
        .style('display', visibility);
}
function writeColorPaletteMenu(parent) {
    var colorPaletteMenu = parent.append("span")
        .attr("id", "colorPaletteMenu")
        .text(" with color palette ");

    var colorNames = [];
    for (colorName in colorbrewer) {
        colorNames.push(colorName);
    }

    colorPaletteMenu.append("select")
        .attr("id", "colorPaletteMenuSelect")
        .attr("onchange", "setColorPalette(this.value)")
        .selectAll("option")
        .data(colorNames)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    colorPaletteMenuSelect = document.getElementById('colorPaletteMenuSelect');
    if (display.colorPalette !== undefined) {
        if (colorbrewer[display.colorPalette] !== undefined) {
            colorPaletteMenuSelect.value = display.colorPalette;
        }
    }
    else {
        colorPaletteMenuSelect.value = 'Set1';
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
        .attr("value", display.c)
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
        .attr("value", display.l)
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
        .attr("value", display.linkStrength)
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
        .attr("value", display.g)
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
function writeShowNodeNamesWidget(parent) {
    var showNodeNamesWidget = parent.append("div")
        .attr("id", "showNodeNamesWidget")
        .text("show node names ");

    var checked = 'unchecked';
    if (display.showNodeNames) {
        checked = 'checked';
        toggleShowNodeNames(true);
    }

    showNodeNamesWidget.append("input")
        .attr("id","showNodeNames")
        .attr("type", "checkbox")
        .attr(checked, "")
        .attr("onchange", "toggleShowNodeNames(this.checked)")
        .attr("size", 3);
}
function writeMenus(menu) {
    var leftMenu = menu.append("div")
        .attr("id", "leftMenu")
        .attr("class", "left");

    var rightMenu = menu.append("div")
        .attr("id", "rightMenu")
        .attr("class", "right");

    writeNetworkMenu(leftMenu);
    writeSizeMenu(leftMenu);
    writeColorMenu(leftMenu);
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
    writeShowNodeNamesWidget(rightMenu);

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
// Event Listeners
//
//
//
////////////////////////////////////////////////////////////////////////////////
// binds the up/down arrow keys to change networks
function changeNetworkListener(event) {
    var currentNetworkIndex = networkNames.indexOf(display.networkName);
    var changeToNetworkIndex;

    if (event.keyCode == 38) {
        // up arrow
        changeToNetworkIndex = currentNetworkIndex - 1;
    }
    else if (event.keyCode == 40) {
        // down arrow
        changeToNetworkIndex = currentNetworkIndex + 1;
    }

    if (changeToNetworkIndex !== undefined) {
        if (0 <= changeToNetworkIndex && changeToNetworkIndex < networkNames.length) {
            var changeToNetworkName = networkNames[changeToNetworkIndex];
            updateNetwork(changeToNetworkName);
        }
    }
}
// binds the left/right arrow keys to change frames
function changeNetworkFrameListener(event) {
    var currentFrame = display.networkFrame;
    var changeToFrame;

    if (event.keyCode == 39) {
        // right arrow
        changeToFrame = currentFrame + 1;
    }
    else if (event.keyCode == 37) {
        // left arrow
        changeToFrame = currentFrame - 1;
    }

    if (changeToFrame !== undefined) {
        if (0 <= changeToFrame && changeToFrame < wwdata.network[display.networkName].frames.length) {
            displayNetworkFrame(changeToFrame);
            updateNetworkFrameSelect();
        }
    }
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
window.addEventListener("keydown", function (event) {
    listeners = {
        37 : changeNetworkFrameListener,
        38 : changeNetworkListener,
        39 : changeNetworkFrameListener,
        40 : changeNetworkListener,
    };

    if (event.keyCode in listeners) {
        listeners[event.keyCode](event);
    }
});
