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
    'c' : 60, // charge
    'g' : 0.1, // gravity
    'l' : 20, // edge length
    'r' : 5, // node radius
    'linkStrength' : 1,
    'colorPalette' : 'Set1',
    'networkLayer' : 0,
    'metadata' : {},
    'nameToMatch' : "",
    'freezeNodeMovement' : false,
    'hideMenu' : false,
    'invertBinaryColors' : false,
    'invertBinarySizes' : false,
    'scaleLinkOpacity' : false,
};

var displayParameterSynonyms = [
    ['c', 'charge'],
    ['g', 'gravity'],
    ['h', 'height'],
    ['l', 'linkLength'],
    ['r', 'radius'],
    ['w', 'width'],
];

var display = {};
var networkNames;

var links = [];
var nodes = [];
var scales = {};
var node, simulation, link;

var nodePersistence = [];

var colorData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'metadata' : {},
    'categoryNames' : [],
};

var sizeData = {
    'type' : 'none',
    'scaledValues' : [],
    'rawValues' : [],
    'metadata' : {},
    'R' : 0,
};

////////////////////////////////////////////////////////////////////////////////
// initializeWebweb
//
// run once on startup
//
// - loads webweb data
// - standardizes its representation
// - sets up the scales
// - initializes the webweb html
// - computes and draws nodes
////////////////////////////////////////////////////////////////////////////////
function initializeWebweb() {
    networkNames = Object.keys(wwdata.networks);

    // default the network to display to the first in networks list
    displayDefaults['networkName'] = networkNames[0];

    display = wwdata.display == undefined ? {} : wwdata.display;
    display = standardizeDisplayParameterSynonyms(display);
    for (var key in displayDefaults) {
        if (display[key] == undefined) {
            display[key] = displayDefaults[key];
        }
    }

    standardizeRepresentation();

    scales = {
        'nodeSize' : d3.scaleLinear().range([1, 1]),
        'colors' : {
            'scalar' : d3.scaleLinear().range([1, 1]),
            'categorical' : d3.scaleOrdinal().range([1, 1]),
        },
        'links' : {
            'width' : d3.scaleLinear().range([1, 1]),
            'opacity' : d3.scaleLinear().range([0.4, 0.9]),
        },
    }

    initializeHTML();

    computeNodes();
    drawNodes();

    simulation = d3.forceSimulation(nodes)
        .force("center", d3.forceCenter(display.w / 2, display.h / 2))
        .on('tick', tick);

    simulation.alphaDecay = 0.001

    displayNetwork();
}
function standardizeDisplayParameterSynonyms(display) {
    for (var i in displayParameterSynonyms) {
        var key1 = displayParameterSynonyms[i][0];
        var key2 = displayParameterSynonyms[i][1];

        if (display[key1] == undefined && display[key2] !== undefined) {
            display[key1] = display[key2];
        }

        delete display[key2];
    }
    return display;
}
function initializeHTML() {
    var container;

    if (display.attachWebwebToElementWithId == undefined) {
        var container = document.createElement('div')
        container.setAttribute('id', 'webweb-center');

        document.getElementsByTagName("body")[0].appendChild(container);

        if (wwdata.title !== undefined) {
            document.title = wwdata.title;
        }
    }
    else {
        container = document.getElementById(display.attachWebwebToElementWithId);
    }

    writeMenus(container);
    writeVisualization(container);
}
function writeVisualization(container) {
    var visualizationContainer = document.createElement("div");
    visualizationContainer.setAttribute('id', 'webweb-visualization-container');

    container.appendChild(visualizationContainer);

    if (display.w == undefined) {
        var heuristic = container.clientWidth - 3 * 20;

        if (heuristic <= 0) {
            heuristic = 1000;
        }
        display.w = Math.min.apply(null, [heuristic, 1000]);
    }

    if (display.h == undefined) {
        display.h = Math.min.apply(null, [display.w, 600]);
    }

    vis = d3.select("#webweb-visualization-container")
        .append("svg")
        .attr("width", display.w)
        .attr("height", display.h)
        .attr("id", "webweb-vis");

    d3.select("#webweb-visualization-container")
        .append("br");
}
function standardizeRepresentation() {
    for (var i in networkNames) {
        standardizeNetworkRepresentation(networkNames[i]);
    }
}
function standardizeNetworkRepresentation(networkName) {
    var network = wwdata.networks[networkName];

    if (network.layers == undefined) {
        network.layers = [
            {
                'edgeList' : network.edgeList,
                'nodes' : network.nodes,
                'metadata' : network.metadata,
            }
        ];
    }

    for (var i in network.layers) {
        network.layers[i] = standardizeLayerRepresentation(network.layers[i]);
    }

    wwdata.networks[networkName] = network;
}
function standardizeLayerRepresentation(layer) {
    if (layer.metadata !== undefined) {
        for (var metadatum in layer.metadata) {
            if (display.metadata[metadatum] == undefined) {
                display.metadata[metadatum] = {};
            }

            if (layer.metadata[metadatum].categories !== undefined) {
                display.metadata[metadatum]['categories'] = layer.metadata[metadatum].categories;
            }

            if (layer.metadata[metadatum].type !== undefined) {
                display.metadata[metadatum]['type'] = layer.metadata[metadatum].type;

            }

        }
    }

    return layer;
}
function addMetadataVectorsToNodes(metadata) {
    for (var metadatum in metadata) {
        for (var i in metadata[metadatum].values) {
            nodes[i][metadatum] = metadata[metadatum].values[i];
        }
    }
}
////////////////////////////////////////////////////////////////////////////////
// - changes the number of visible nodes
// - adds metadata to nodes
// - computes links
// - draws links
// - uses the force (luke)
////////////////////////////////////////////////////////////////////////////////
function displayNetwork() {
    setVisibleNodes();
    setNodeMetadata();

    computeLinks();
    drawLinks();

    updateChargeForce();
    updateLinkForce();
    updateGravityForce();

    toggleFreezeNodes(display.freezeNodeMovement);
    toggleShowNodeNames(display.showNodeNames);
    toggleInvertBinaryColors(display.invertBinaryColors);
    toggleInvertBinarySizes(display.invertBinarySizes);
    toggleLinkWidthScaling(display.scaleLinkWidth);
    toggleLinkOpacityScaling(display.scaleLinkOpacity);

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (display.freezeNodeMovement) {
        tick();
    }

    // change the display of the layers widget
    setNetworkLayerMenuVisibility();

    redrawLinks();
    redraw();

}

////////////////////////////////////////////////////////////////////////////////
// adds/removes nodes from the visualization
//
// it currently only handles removing from the end.
// however, we would like to be able to do this by name (i.e. id).
////////////////////////////////////////////////////////////////////////////////
function setVisibleNodes() {
    var nodeIdMap = getNodeIdMap(display.networkName, display.networkLayer);
    var nodeCount = getObjetPropertyCount(nodeIdMap);

    if (nodeCount) {
        if (nodeCount < nodes.length) {
            while (nodeCount != nodes.length) {
                var toRemove = nodes.pop();
                var drawnNode = document.getElementById("node_" + toRemove.idx)
                document.getElementById("webweb-vis").removeChild(drawnNode);
                nodePersistence.push({ 'node' : toRemove, 'toDraw' : drawnNode });
            }
        }
        else if (nodeCount > nodes.length) {
            while (nodeCount != nodes.length) {
                var toAdd = nodePersistence.pop();
                document.getElementById("webweb-vis").appendChild(toAdd.toDraw);
                nodes.push(toAdd.node);
            }
        }
    }
    else if (display.N > nodes.length) {
        // otherwise, if we don't have a set number of nodes, reset the number
        // of nodes to the maximum
        while (nodes.length != display.N) {
            var toAdd = nodePersistence.pop();
            document.getElementById("webweb-vis").appendChild(toAdd.toDraw);
            nodes.push(toAdd.node);
        }
    }
}
function addNodeMetadata(source, nodeIdMap) {
    addMetadataVectorsToNodes(source.metadata);

    if (getObjetPropertyCount(source.nodes) == 0) {
        return;
    }

    for (var i in source.nodes) {
        for (var metadatum in source.nodes[i]) {
            nodes[nodeIdMap[i]][metadatum] = source.nodes[i][metadatum];
        }
    }
}
function getNetworkData(networkName, networkLayer) {
    return wwdata.networks[networkName].layers[networkLayer];
}
////////////////////////////////////////////////////////////////////////////////
// creates a map from observed nodes (nodes in the edge list, display.nodes, and
// the current layer's nodes) to an internal "id"
////////////////////////////////////////////////////////////////////////////////
function getNodeIdMap(networkName, networkLayer) {
    var networkData = getNetworkData(networkName, networkLayer);

    var nodeNames = [];

    for (var i in networkData.edgeList) {
        nodeNames.push(networkData.edgeList[i][0]);
        nodeNames.push(networkData.edgeList[i][1]);
    }

    if (getObjetPropertyCount(display.nodes) > 0) {
        for (var i in display.nodes) {
            var _id = isNaN(i) ? i : +i;
            nodeNames.push(_id);
        }
    }

    if (getObjetPropertyCount(networkData.nodes) > 0) {
        for (var i in networkData.nodes) {
            var _id = isNaN(i) ? i : +i;
            nodeNames.push(_id);
        }
    }

    if (allInts(nodeNames)) {
        nodeNames.sort();
    }

    var unusedId = 0;
    var nodeIdMap = {};
    for (var i in nodeNames) {
        var name = nodeNames[i];
        if (nodeIdMap[name] == undefined) {
            nodeIdMap[name] = unusedId;
            unusedId += 1;
        }
    }

    var displayMetadataValuesCount = metadataValuesCount(display.metadata);

    var unusedName = 0;
    for(var key in nodeIdMap){
        if (isInt(key) && key >= unusedName) {
            unusedName = key + 1;
        }
    }

    if (displayMetadataValuesCount > unusedId) {
        while (displayMetadataValuesCount > unusedId) {
            nodeIdMap[unusedName] = unusedId;
            unusedName += 1;
            unusedId += 1;
        }
    }

    var networkMetadataValuesCount = metadataValuesCount(networkData.metadata);

    if (networkMetadataValuesCount > unusedId) {
        while (networkMetadataValuesCount > unusedId) {
            nodeIdMap[unusedName] = unusedId;
            unusedName += 1;
            unusedId += 1;
        }
    }

    return nodeIdMap;
}
function metadataValuesCount(metadata) {
    var maxValuesCount = 0;
    if (metadata !== undefined) {
        for (var metadatum in metadata) {
            var values = metadata[metadatum].values;
            if (values !== undefined) {
                var valuesCount = values.length;
                if (valuesCount > maxValuesCount) {
                    maxValuesCount = valuesCount;
                }
            }
        }
    }
    return maxValuesCount;
}
////////////////////////////////////////////////////////////////////////////////
// loads the metadata up from the places they could come from:
// 1. the defaults (none, degree)
// 2. the display parameters
// 3. the network itself
//
// Priority is given to the network's metadata, then display, then defaults
////////////////////////////////////////////////////////////////////////////////
function setNodeMetadata() {
    var allMetadata = {
        'none' : {
            'type' : 'none',
        },
        'degree' : {
            'type' : 'degree',
        },
    };

    var nonMetadataKeys = [ 'idx', 'fx', 'fy', 'x', 'y', 'vx', 'vy', 'index', 'degree' ];

    // reset node data
    for (var i in nodes) {
        for (var key in nodes[i]) {
            if (nonMetadataKeys.indexOf(key) < 0) {
                delete nodes[i][key];
            }
            else if (key == 'degree' || key == 'strength') {
                // reset the degree and strength (strength not yet supported)
                nodes[i][key] = 0;
            }
        }
    }

    var nodeIdMap = getNodeIdMap(display.networkName, display.networkLayer);

    addNodeMetadata(display, nodeIdMap);

    var networkData = wwdata.networks[display.networkName].layers[display.networkLayer];
    addNodeMetadata(networkData, nodeIdMap);

    var nodeNameMap = {};
    for(var key in nodeIdMap){
        nodeNameMap[nodeIdMap[key]] = key;
    }

    // now we need to define the set of metadata
    for (var i in nodes) {
        var node = nodes[i];
        for (var key in node) {
            if (nonMetadataKeys.indexOf(key) < 0) {
                allMetadata[key] = {};

                if (display.metadata !== undefined && display.metadata[key] !== undefined) {
                    var metadatumInfo = display.metadata[key];

                    // if we have categories, change the node values here
                    if (metadatumInfo.categories !== undefined) {
                        var nodeCategoryNumber = nodes[i][key];
                        nodes[i][key] = metadatumInfo.categories[nodeCategoryNumber];
                    }
                    else if (metadatumInfo.type !== undefined && metadatumInfo.type == 'binary') {
                        nodes[i][key] = nodes[i][key] ? true : false;
                    }
                }
            }
        }

        // if we don't already have node names, use the mapping to assign them
        if (nodes[i]['name'] == undefined && nodeNameMap !== undefined) {
            nodes[i]['name'] = nodeNameMap[nodes[i].idx]
        }
    }

    sizeData.metadata = {};
    colorData.metadata = {};
    for (metadatum in allMetadata) {
        if (metadatum == 'name') {
            continue;
        }

        if (allMetadata[metadatum].type == undefined) {
            allMetadata[metadatum].type = getMetadatumType(metadatum);
        }

        if (allMetadata[metadatum].type !== "categorical") {
            sizeData.metadata[metadatum] = allMetadata[metadatum];

        }
        colorData.metadata[metadatum] = allMetadata[metadatum];
    }

    // these below if statements are only here because of poor design (says
    // hunter, the designer of this bit)
    // really, computeSizes and computeColors should already have this
    // information.
    if (display.colorBy !== undefined && display.colorBy !== 'none') {
        if (allMetadata !== undefined && allMetadata[display.colorBy] == undefined) {
            display.colorBy = 'none';
        }

        colorData.type = allMetadata[display.colorBy].type;
    }

    if (display.sizeBy !== undefined && display.sizeBy !== 'none') {
        if (allMetadata !== undefined && allMetadata[display.sizeBy] == undefined) {
            display.sizeBy = 'none';
        }

        sizeData.type = allMetadata[display.sizeBy].type;
    }

    // update the menus with these new metadata
    updateSizeMenu();
    updateColorMenu();
}
////////////////////////////////////////////////////////////////////////////////
// tries to figure out the metadatum type of a given metadatum.
////////////////////////////////////////////////////////////////////////////////
function getMetadatumType(metadatum) {
    if (metadatum == 'none') {
        return;
    }

    var metadatumValues = [];
    for (var i in nodes) {
        metadatumValues.push(nodes[i][metadatum]);
    }
    
    var q = d3.set(metadatumValues).values().sort();

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

    return 'scalar';
}
////////////////////////////////////////////////////////////////////////////////
// initialize the nodes (attempting to be smart about the number of them)
////////////////////////////////////////////////////////////////////////////////
function computeNodes() {
    // iterate through the networks and get their node counts
    var nodeCounts = [];
    for (var i in networkNames) {
        var networkName = networkNames[i];
        var network = wwdata.networks[networkName];
        for (var layer in network.layers) {
            var nodeIdMap = getNodeIdMap(networkName, layer);
            var count = getObjetPropertyCount(nodeIdMap);
            nodeCounts.push(count);
        }
    }

    var maxObservedNodeCount = d3.max(nodeCounts);

    // if display.N is undefined, or if it is less than the max number of nodes
    // we've observed, set it to the max observed
    if (display.N == undefined || display.N < maxObservedNodeCount) {
        display.N = maxObservedNodeCount;
    }

    // Define nodes
    nodes = [];
    for (var i = 0; i < display.N; i++) {
        nodes.push({
            "idx" : i,
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
    var nodeIdMap = getNodeIdMap(display.networkName, display.networkLayer);

    var linkMatrix = {}

    // reset the node degrees
    for (var i in nodes) {
        nodes[i].degree = 0;

        linkMatrix[i] = {};
        for (var j in nodes) {
            linkMatrix[i][j] = 0;
        }
    }

    var networkData = getNetworkData(display.networkName, display.networkLayer);

    // push all the links to the list: links
    var weights = [];
    for (var i in networkData.edgeList) {
        var edge = networkData.edgeList[i];
        var source = nodeIdMap[edge[0]];
        var target = nodeIdMap[edge[1]];

        // if there's no edge weight, default it to 1
        var weight = edge.length == 3 ? parseFloat(edge[2]) : 1;

        weights.push(weight);

        if (source <= target) {
            linkMatrix[source][target] += weight;
        }
        else {
            linkMatrix[target][source] += weight;
        }
            
        nodes[source].degree += weight;
        nodes[target].degree += weight;
    }

    links = [];
    for (var source in linkMatrix) {
        for (var target in linkMatrix[source]) {
            if (linkMatrix[source][target]) {
                links.push({
                    source: source,
                    target: target,
                    w: linkMatrix[source][target],
                })
            }
        }
    }

    // scale the link weight and opacity by computing the range (extent) of the
    // edgeList weights.
    scales.links.width.domain(d3.extent(weights));
    scales.links.opacity.domain(d3.extent(weights));
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
        var metadatum = sizeData.metadata[display.sizeBy];
        sizeData.type = metadatum.type;

        rawValues = getRawNodeValues(display.sizeBy, metadatum.type, 'size');
        for (var i in nodes) {
            scaledValues[i] = rawValues[i];
            // if we're sizing by degree, square root the value
            if (display.sizeBy == "degree") {
                scaledValues[i] = Math.sqrt(scaledValues[i]);
            }
        }

        if (sizeData.type == 'binary') {
            changeInvertBinaryWidgetVisibility(true, 'size');

            // scale between true and false even if we only have one of
            // the two values
            scales.nodeSize.domain(d3.extent([true, false])).range([0.5, 1.5]);
        }
        else {
            scales.nodeSize.domain(d3.extent(scaledValues), d3.max(scaledValues)).range([0.5, 1.5]);
        }

        for (var i in scaledValues) {
            scaledValues[i] = scales.nodeSize(scaledValues[i]);
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

    var metadatum = colorData.metadata[display.colorBy];
    colorData.type = metadatum.type;

    var rawValues = getRawNodeValues(display.colorBy, metadatum.type, 'color');

    categoryValues = [];

    if (colorData.type == 'binary') {
        categoryValues = getBinaryValues('color');
        changeInvertBinaryWidgetVisibility(true, 'color');
    }
    else if (colorData.type == "categorical") {
        // get the category names if it's categorical
        colorData['categoryNames'] = [];

        // if we don't have categories, retrieve them as scalars from the
        // values for the metadatum
        if (metadatum.categories == undefined) {
            colorData['categoryNames'] = d3.set(rawValues).values().sort();

            categoryValues = colorData['categoryNames'];
        }
        else {
            colorData['categoryNames'] = metadatum.categories;

            // Check to see if our categories are numeric or not
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
        var categoryValuesCount = categoryValues.length;
        if (categoryValuesCount <= 9) {
            // make sure there's enough categories even if there aren't
            if (categoryValuesCount == 1) {
                categoryValuesCount += 1;
            }

            scales.colors.categorical.domain(categoryValues)
                .range(colorbrewer[display.colorPalette][categoryValuesCount]);

            changeColorPaletteMenuVisibility(true);
        }
        else {
            // otherwise, treat like scalars
            colorData.type = "scalarCategorical";

            var unusedNumber = 1;
            var categoriesMap = {};
            for (var i in categoryValues) {
                categoriesMap[categoryValues[i]] = i;
                unusedNumber += 1;
            }

            for (var i in rawValues) {
                rawValues[i] = categoriesMap[rawValues[i]];
            }
        }
    }

    if (colorData.type != 'categorical') {
        scales.colors.scalar.domain(d3.extent(rawValues)).range([0,1]);
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
// - a metadatumName
// - a metadatumType
// - a displayType (color/size)
////////////////////////////////////////////////////////////////////////////////
function getRawNodeValues(metadatumName, metadatumType, displayType) {
    var rawValues = [];
    for (var i in nodes){
        var val = nodes[i][metadatumName];

        if (metadatumType == 'binary') {
            val = getBinaryValue(val, displayType);
        }

        rawValues[i] = val;
    }

    return rawValues;
}
// ColorWheel is a function that takes a node metadatum, like a category or scalar
// and just gets the damn color. But it has to take into account what the 
// current colorData.type is. Basically, this is trying to apply our prefs to colors
function colorWheel(x) {
    if (colorData.type == "categorical") {
        return scales.colors.categorical(x);
    }
    else if (colorData.type == 'binary') {
        return scales.colors.categorical(getBinaryValue(x, 'color'));
    }
    else {
        // Rainbow HSL
        return d3.hsl(210 * (1 - scales.colors.scalar(x)), 0.7, 0.5);
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
function changeNetwork(networkName) {
    var networkSelect = document.getElementById('networkSelect-widget');
    networkSelect.value = networkName;

    display.networkName = networkName;
    displayNetwork();
}
function changeSizes(sizeBy) {
    display.sizeBy = sizeBy;
    computeSizes();
    computeLegend();
    redrawNodes();
    if (display.nameToMatch != "") {
        matchNodesNamed(display.nameToMatch);
    };
}
function changeColors(colorBy) {
    display.colorBy = colorBy;
    computeColors();
    computeLegend();
    redrawNodes();
    if (display.nameToMatch != "") {
        matchNodesNamed(display.nameToMatch);
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
function changeR(r) {
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
    if (parseFloat(g) >= 0) {
        display.g = parseFloat(g);
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

    var freezeNodesToggle = document.getElementById('freezeNodes-widget');
    freezeNodesToggle.checked = display.freezeNodeMovement ? true : false;

    redisplayNodeNames();
}
function toggleShowNodeNames(show) {
    display.showNodeNames = show;
    redisplayNodeNames();

    var showNodeNamesWidget = document.getElementById('showNodeNames-widget');
    showNodeNamesWidget.checked = display.showNodeNames;
}
function toggleInvertBinaryColors(setting) {
    var widget = document.getElementById('invertBinaryColors-widget');
    widget.checked = setting;
    display.invertBinaryColors = setting;

    computeColors();
    computeSizes();
    computeLegend();
    redrawNodes();
}
function toggleInvertBinarySizes(setting) {
    var widget = document.getElementById('invertBinarySizes-widget');
    widget.checked = setting;
    display.invertBinarySizes = setting;

    computeColors();
    computeSizes();
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
    hideAllNodeText();

    if (display.showNodeNames || display.nameToMatch) {
        showNodeNamesWhenStable();
    }
}
function showNodeNamesWhenStable() {
    window.setTimeout(function() {
        if (simulation.alpha() < .01) {
            showAppropriateNodeText();
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
    simulation.alpha(1).restart();
}
function updateLinkForce() {
    simulation.force(
        'link',
        d3.forceLink()
            .links(links)
            .distance(display.l)
            .strength(display.linkStrength)
    )
    simulation.alpha(1).restart();
}
function toggleLinkWidthScaling(checked) {
    if (checked) {
        scales.links.width.range([0.5, 4]);
    }
    else {
        scales.links.width.range([1, 1]);
    }
    redrawLinks();
}
function toggleLinkOpacityScaling(checked) {
    if (checked) {
        scales.links.opacity.range([0.4, 0.9])
    }
    else {
        scales.links.opacity.range([1, 1]);
    }
    redrawLinks();
}
function matchNodesNamed(x) {
    display.nameToMatch = x;

    nodes.forEach(function(d) {
        unHighlightNode(d);

        if (nodeNameMatches(d)) {
            highlightNode(d);
        }
    });

    showAppropriateNodeText();
}
function nodeNameMatches(node) {
    var name = node.name;
    var nameToMatch = display.nameToMatch;
    if (nameToMatch !== undefined && nameToMatch.length > 0) {
        if (name !== undefined && name.indexOf(nameToMatch) >= 0) {
            return true;
        }
    }
    else {
        return false;
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

    var sizeLegend = new Legend('size', sizeData.type, sizeData.rawValues);
    var colorLegend = new Legend('color', colorData.type, colorData.rawValues);

    var R = 0;

    if (sizeLegend.values.length > 0) {
        var R = display.r * d3.max(sizeLegend.values);;
    }

    // if we have a color legend, use it for the size menu (if it's there)
    var fillFunction = function(i) {
        return d3.rgb(100, 100, 100);
    };

    if (display.sizeBy == display.colorBy) {
        fillFunction = function(i) {
            return colorWheel(colorLegend.values[i]);
        }
    }

    var datatypeTextPushdown = 15;

    var textPushRight = 2 * (Math.max(R, 5) + 5);
    var nodePushRight = 5 + Math.max(R, 5);
    var pushdown = function(i) { return 0 };

    if (display.sizeBy != "none") {
        pushdown = function (i) {
            if (i !== undefined) {
                return 5 + R + 2.3 * R * i + datatypeTextPushdown;
            }
            return datatypeTextPushdown;
        };

        sizeLegend.drawLegendLabel(display.sizeBy, pushdown);
        sizeLegend.drawLegendText(pushdown, textPushRight);
        sizeLegend.drawLegendValues(
            pushdown,
            nodePushRight,
            function (d) { return display.r * d },
            fillFunction
        );
    }

    // if we've drawn the size legend and the color legend shows the same value,
    // return
    if (display.sizeBy == display.colorBy) {
        return;
    }

    if (colorData.type != "none") {
        var initialPushdown = datatypeTextPushdown;

        if (display.sizeBy != "none") {
            initialPushdown += pushdown(sizeLegend.values.length);
            pushdown = function (i) {
                if (i !== undefined) {
                    return 2.3 * R * i + initialPushdown + datatypeTextPushdown;
                }
                return initialPushdown;
            }
        }
        else {
            pushdown = function (i) {
                if (i !== undefined) {
                    return 2.3 * display.r * i + initialPushdown + (3 + i) * display.r;
                }
                return initialPushdown;
            }
        }

        // show the variable being displayed
        colorLegend.drawLegendLabel(display.colorBy, pushdown);
        colorLegend.drawLegendText(pushdown, textPushRight);
        colorLegend.drawLegendValues(
            pushdown,
            nodePushRight,
            function (i) { return display.r },
            function (i) { return colorWheel(colorLegend.values[i]); }
        );
    }
}
function Legend(legendType, dataType, rawValues) {
    this.legendType = legendType;
    this.dataType = dataType;
    this.rawValues = rawValues;
    this.values = [];

    legendTypeToLegendMaker = {
        'size' : {
            'binary' : 'makeBinaryLegend',
            'scalar' : 'makeScalarLegend',
            'degree' : 'makeDegreeLegend',
        },
        'color' : {
            'binary' : 'makeBinaryLegend',
            'scalar' : 'makeScalarLegend',
            'degree' : 'makeDegreeLegend',
            'categorical' : 'makeCategoricalLegend',
            'scalarCategorical' : 'makeBinnedLegend',
        },
    }

    var legendFunction = legendTypeToLegendMaker[this.legendType][this.dataType];

    if (legendFunction !== undefined) {
        this[legendFunction]();

        if (this.legendType == 'size') {
            for (var i in this.values) {
                this.values[i] = scales.nodeSize(this.values[i]);
            }
        }
    }
}

Legend.prototype.drawLegendLabel = function(label, pushDown) {
    vis.append("text")
        .attr("id", "legend")
        .text(label)
        .attr("x", 5)
        .attr("y", pushDown())
        .attr("fill", "black")
        .attr("font-size", 12);
}

Legend.prototype.drawLegendText = function(pushDown, pushRight) {
    this.text.forEach(function(d, i) {
        vis.append("text")
            .attr("id", "legend")
            .text(d)
            .attr("x", pushRight)
            .attr("y", pushDown(i) + 3.5)
            .attr("fill", "black")
            .attr("font-size", 12);
    });
}

Legend.prototype.drawLegendValues = function(pushDown, pushRight, sizeFunction, colorFunction) {
    this.values.forEach(function(d, i){
        vis.append("circle")
            .attr("id", "legend")
            .attr("r", sizeFunction(d))
            .attr("cx", pushRight)
            .attr("cy", pushDown(i))
            .style("fill", colorFunction(i))
            .style("stroke", d3.rgb(255, 255, 255));
    });
}
Legend.prototype.makeBinaryLegend = function() {
    this.values = getBinaryValues(this.legendType);
    this.text = ["false", "true"];
}
Legend.prototype.makeDegreeLegend = function () {
    this.makeScalarLegend();
    if (this.legendType == 'size') {
        for (var i in this.values) {
            this.values[i] = Math.sqrt(this.values[i]);
        }
    }
}
Legend.prototype.makeCategoricalLegend = function() {
    this.values = scales.colors.categorical.domain();
    this.text = d3.values(colorData['categoryNames']);
}
Legend.prototype.makeScalarLegend = function() {
    // if it is integer scalars:
    if (allInts(this.rawValues)) {
        var max = d3.max(this.rawValues);
        var min = d3.min(this.rawValues);

        if (max - min <= 8) {
            this.values = d3.range(min, max + 1);
        }
    }

    if (this.values.length == 0) {
        this.makeBinnedLegend(4);
    }

    this.text = this.values.slice(0);
}
// 'bins' a set of values so that we can display a finite legend.
Legend.prototype.makeBinnedLegend = function(bins) {
    if (bins == undefined) {
        bins = 4;
    }
    var min_val = d3.min(this.rawValues);
    var max_val = d3.max(this.rawValues);
    var step = (max_val - min_val) / bins;

    this.values.push(rounddown(min_val, 10));

    for (var i = 1; i < bins; i++) {
        this.values.push(round(min_val + i * step, 10));
    }

    this.values.push(roundup(max_val, 10));

    this.text = this.values.slice(0);
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
    link = vis.selectAll(".webweb-link")
        .data(links);

    link.enter()
        .insert("line", ".webweb-node")
        .attr("class", "webweb-link")
        .attr("id", function(d, i) { 
            return "link_" + i; 
        })
        .style("stroke", d3.rgb(150, 150, 150))
        .style("stroke-width", function(d) {
            if (d.w == 0) {
                return 0;
            }
            else {
                return scales.links.width(d.w)
            }
        })
        .style("stroke-opacity", function(d) {
            return scales.links.opacity(d.w)
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
                    return scales.links.width(d.w);
                }
            })
            .style("stroke-opacity", function(d) {
                return scales.links.opacity(d.w)
            });
    })
}
function drawNodes() {
    vis.selectAll(".webweb-node")
        .data(nodes)
        .enter()
        .insert("circle")
        .attr("class", "webweb-node")
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

    node = vis.selectAll(".webweb-node");

    node.on("mousedown", function(d) {
        if (! display.showNodeNames) {
            hideOneNodeText(d);
        }
    });

    node.on("mouseover", function (d) {
        highlightNode(d); 

        if (! display.showNodeNames) {
            showOneNodeText(d);
        }
    });

    node.on("mouseout", function(d) {
        unHighlightNode(d);
        if (! display.showNodeNames && ! nodeNameMatches(d)) {
            hideOneNodeText(d);
        }
    });

    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
}
function dragstarted(d) {
    // hide node text while we are dragging
    hideAllNodeText();

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

function redraw() {
    computeColors();
    computeSizes();
    computeLegend();
    redrawNodes();
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
    link = vis.selectAll(".webweb-link")
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node = vis.selectAll(".webweb-node")
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
    if (display.nameToMatch == "" || d.name.indexOf(display.nameToMatch) < 0) {
        d3.select("#node_" + d.idx)
            .transition()
            .attr("r", sizeData['scaledValues'][d.idx] * display.r)
            .style("stroke", d3.rgb(255, 255, 255));
    }
}
////////////////////////////////////////////////////////////////////////////////
// shows node text which should be shown (because it matches the current match
// string or because we're showing all nodes)
// hides 'em when they should be hidden
////////////////////////////////////////////////////////////////////////////////
function showAppropriateNodeText() {
    for (var i in nodes) {
        var node = nodes[i];
        var text = node.name == undefined ? node.idx : node.name;

        if (nodeNameMatches(node) || getTruthinessSafely(display.showNodeNames)) {
            showOneNodeText(node);
        }
        else {
            hideOneNodeText(node);
        }
    }
}
function showOneNodeText(node) {
    var name = node.name;
    var text = name == undefined ? node.idx : name;

    var classes;

    var nodeTextElement = document.getElementById("nodeTextId-" + node.idx);

    if (nodeTextElement == undefined) {
        vis.append("text").text(text)
            .attr("x", node.x + 1.5 * display.r)
            .attr("y", node.y - 1.5 * display.r)
            .attr("fill", "black")
            .attr("font-size", 12)
            .attr("class", "nodeText")
            .attr("id",  "nodeTextId-" + node.idx);
    }

}
function hideOneNodeText(node) {
    vis.selectAll("#nodeTextId-" + node.idx).remove();
}
function hideAllNodeText() {
    vis.selectAll(".nodeText").remove();
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
function updateSizeMenu() {
    var sizeSelect = document.getElementById('sizeSelect-widget');

    var options = [];
    for (var metadatum in sizeData.metadata) {
        options.push(metadatum);
    }

    resetSelectOptionsTo(sizeSelect, options);

    if (display.sizeBy == undefined || sizeData.metadata[display.sizeBy] == undefined) {
        display.sizeBy = "none";
    }

    sizeSelect = document.getElementById('sizeSelect-widget');
    sizeSelect.value = display.sizeBy;
    changeSizes(display.sizeBy);
}
function updateColorMenu() {
    var colorSelect = document.getElementById('colorSelect-widget');

    var options = [];
    for (var metadatum in colorData.metadata) {
        options.push(metadatum);
    }

    resetSelectOptionsTo(colorSelect, options);

    if (display.colorBy == undefined || colorData.metadata[display.colorBy] == undefined) {
        display.colorBy = "none";
    }

    colorSelect.value = display.colorBy;
    changeColors(display.colorBy);
}
function setNetworkLayerMenuVisibility() {
    var visibility = 'inline';

    if (wwdata.networks[display.networkName].layers.length == 1) {
        visibility = 'none';
    }

    document.getElementById('layerSelect-widget').parentElement.style.display = visibility;
}
function changeLayer(layer) {
    display.networkLayer = layer;

    var layerSelect = document.getElementById('layerSelect-widget');
    layerSelect.value = display.networkLayer;

    displayNetwork();
}
function changeInvertBinaryWidgetVisibility(visible, type) {
    var visibility = visible ? 'inline' : 'none';
    var widgetId = getBinaryInversionAttributeForType(type) + "-widget";

    var widgetParent = document.getElementById(widgetId).parentElement;
    widgetParent.style.display = visibility;
}
function getBinaryInversionAttributeForType(type) {
    if (type == 'color') {
        return 'invertBinaryColors';
    }
    else if (type == 'size') {
        return 'invertBinarySizes';
    }
}
function changeColorPaletteMenuVisibility(visible) {
    var visibility = visible ? 'inline' : 'none';
    document.getElementById('colorPaletteSelect-widget').parentElement.style.display = visibility;
}
function resetSelectOptionsTo(select, options) {
    if (select.options !== undefined) {
        select.options.length = 0;
    }

    for (var i in options) {
        var option = document.createElement('option');
        option.innerHTML = options[i];

        select.add(option);
    }

    return select;
}
function writeSimpleWidget(name, _widget) {
    var widget;

    if (_widget.type !== undefined && _widget.type == 'select') {
        widget = document.createElement('select');
        widget = resetSelectOptionsTo(widget, _widget.options);
    }
    else {
        widget = document.createElement('input');
        widget.type = _widget.type || 'text';
        widget.size = _widget.size || 3;
    }

    for (var eventName in _widget.functions) {
        widget.addEventListener(eventName, function (event) {
            var value = event.target.value;
            if (_widget.type !== undefined && _widget.type == 'checkbox') {
                value = event.target.checked;
            }
            _widget.functions[eventName](value);
        });
    }

    widget.id = name + "-widget";

    if (_widget.type !== undefined) {
        if (_widget.type == 'checkbox') {
            widget.checked = _widget.value ? true : false;
        }
        else if (_widget.type == 'select' && _widget.value !== undefined) {
            for (var i in widget.options) {
                if (widget.options[i].innerHTML == _widget.value) {
                    widget.options[i].selected = true;
                }
            }
        }
        else if (_widget.type == 'button') {
            widget.value = _widget.value;
        }
    }
    else {
        widget.value = _widget.value;
    }

    var widgetContainerType = _widget.inline ? 'span' : 'div';
    var widgetContainer = document.createElement(widgetContainerType);

    if (_widget.text !== undefined) {
        widgetContainer.innerHTML = _widget.text;
    }

    widgetContainer.appendChild(widget);

    return widgetContainer;
}
function writeMenus(container) {
    var menu = document.createElement('div')
    menu.id = 'webweb-menu';
    menu.style.display = display.hideMenu == true ? 'none' : 'flex';
    container.appendChild(menu);

    var layers = [];
    for (var i in wwdata.networks[display.networkName].layers) {
        layers.push(i);
    }

    var colorNames = [];
    for (colorName in colorbrewer) {
        colorNames.push(colorName);
    }

    var colorPaletteSelectValue = 'Set1';
    if (display.colorPalette !== undefined) {
        if (colorbrewer[display.colorPalette] !== undefined) {
            colorPaletteSelectValue = display.colorPalette;
        }
    }

    var widgetContainers = {
        'webweb-menu-left' : {
            'network' : {
                'subWidgets' :{
                    'networkSelect' : {
                        'text' : "Display data from ",
                        'type' : 'select',
                        'functions' : {
                            'change' : changeNetwork,
                        },
                        'options' : networkNames,
                        'value' : display.networkName,
                        'inline' : true,
                    },
                    'layerSelect' : {
                        'text' : " layer ",
                        'type' : 'select',
                        'functions' : {
                            'change' : changeLayer,
                        },
                        'options' : layers,
                        'value' : display.networkLayer,
                        'inline' : true,
                    },
                },
            },
            'size' : {
                'subWidgets' : {
                    'sizeSelect' : {
                        'text' : "Scale node sizes by ",
                        'type' : 'select',
                        'functions' : {
                            'change' : changeSizes,
                        },
                        'inline' : true,
                    },
                    'invertBinarySizes' : {
                        'text' : 'invert ',
                        'type' : 'checkbox',
                        'functions' : {
                            'change' : toggleInvertBinarySizes,
                        },
                        'value' : display.invertBinarySizes,
                        'inline' : true,
                    },
                },
            },
            'colors' : {
                'subWidgets' : {
                    'colorSelect' : {
                        'text' : "Color nodes by ",
                        'type' : 'select',
                        'functions' : {
                            'change' : changeColors,
                        },
                        'inline' : true,
                    },
                    'colorPaletteSelect' : {
                        'text' : " with color palette ",
                        'type' : 'select',
                        'functions' : {
                            'change' : setColorPalette,
                        },
                        'options' : colorNames,
                        'value' : colorPaletteSelectValue,
                        'inline' : true,
                    },
                    'invertBinaryColors' : {
                        'text' : 'invert ',
                        'type' : 'checkbox',
                        'functions' : {
                            'change' : toggleInvertBinaryColors,
                        },
                        'value' : display.invertBinaryColors,
                        'inline' : true,
                    }
                },
            },
            'scaleLinkWidth' : {
                'text' : 'Scale link width ',
                'type' : 'checkbox',
                'functions' : {
                    'change' : toggleLinkWidthScaling,
                },
                'value' : display.scaleLinkWidth,
                'size' : 10,
            },
            'scaleLinkOpacity' : {
                'text' : 'Scale link opacity ',
                'type' : 'checkbox',
                'functions' : {
                    'change' : toggleLinkOpacityScaling,
                },
                'value' : display.scaleLinkOpacity,
                'size' : 10,
            },
            'freezeNodes' : {
                'text' : 'Freeze nodes ',
                'type' : 'checkbox',
                'functions' : {
                    'change' : toggleFreezeNodes,
                },
                'value' : display.freezeNodes,
                'size' : 10,
            },
            'saveSVG' : {
                'type' : 'button',
                'functions' : {
                    'click' : writeSVGDownloadLink,
                },
                'value' : 'Save SVG',
                'size' : 10,
            },
        },
        'webweb-menu-right' : {
            'charge' : {
                'text' : 'Node charge: ',
                'functions' : {
                    'change' : changeCharge,
                },
                'value' : display.c,
            },
            'linkLength' : {
                'text' : 'Link length: ',
                'functions' : {
                    'change' : changeDistance,
                },
                'value' : display.l,
            },
            'linkStrength' : {
                'text' : 'Link strength: ',
                'functions' : {
                    'change' : changeLinkStrength,
                },
                'value' : display.linkStrength,
            },
            'gravity' : {
                'text' : 'Gravity: ',
                'functions' : {
                    'change' : changeGravity,
                },
                'value' : display.g,
            },
            'radius' : {
                'text' : 'Node radius: ',
                'functions' : {
                    'change' : changeR,
                },
                'value' : display.r,
            },
            'nameToMatch' : {
                'text' : 'Highlight nodes named: ',
                'functions' : {
                    'input' : matchNodesNamed,
                },
                'value' : display.nameToMatch,
                'size' : 10,
            },
            'showNodeNames' : {
                'text' : 'Show node names ',
                'type' : 'checkbox',
                'functions' : {
                    'input' : toggleShowNodeNames,
                },
                'value' : display.showNodeNames,
                'size' : 10,
            },
        }
    };

    for (var side in widgetContainers) {
        var sideWidgets = widgetContainers[side];

        var sideMenu = document.createElement('div');
        sideMenu.id = side;

        for (var widgetName in sideWidgets) {
            var widget;
            var subWidgets = sideWidgets[widgetName].subWidgets;
            if (subWidgets !== undefined) {
                widget = document.createElement('div');
                for (var subWidgetName in subWidgets) {
                    widget.append(writeSimpleWidget(subWidgetName, subWidgets[subWidgetName]));
                }
            }
            else {
                widget = writeSimpleWidget(widgetName, sideWidgets[widgetName]);
            }

            sideMenu.appendChild(widget);
        }

        menu.appendChild(sideMenu);
    }
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
    var svg = document.getElementById('webweb-vis');
    svg.setAttribute("title", display.networkName);
    svg.setAttribute("version", 1.1)
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    saveIt(display.networkName, "image/svg+xml", svg.outerHTML);
};
////////////////////////////////////////////////////////////////////////////////
//
//
//
// Helpers
//
//
//
////////////////////////////////////////////////////////////////////////////////
function isInt(n){
    return Number(n) === n && n % 1 === 0;
}
function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
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
function getObjetPropertyCount(_object) {
    var count = 0;
    for(var property in _object) {
        if (_object.hasOwnProperty(property)) {
            count += 1;
        }
    }
    return count;
}
function getTruthinessSafely(variable) {
    if (variable !== undefined && variable == true) {
        return true;
    }

    return false;
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
            changeNetwork(changeToNetworkName);
        }
    }
}
// binds the left/right arrow keys to change layers
function changeNetworkLayerListener(event) {
    var currentLayer = display.networkLayer;
    var changeToLayer;

    if (event.keyCode == 39) {
        // right arrow
        changeToLayer = currentLayer + 1;
    }
    else if (event.keyCode == 37) {
        // left arrow
        changeToLayer = currentLayer - 1;
    }

    if (changeToLayer !== undefined) {
        if (0 <= changeToLayer && changeToLayer < wwdata.networks[display.networkName].layers.length) {
            changeLayer(changeToLayer);
        }
    }
}
function playNetworkLayers() {
    window.setTimeout(function() {
        changeNetworkLayerListener({'keyCode' : 39});
        playNetworkLayers();
    }, 1000);
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
    initializeWebweb();
};
window.addEventListener("keydown", function (event) {
    listeners = {
        37 : changeNetworkLayerListener,
        38 : changeNetworkListener,
        39 : changeNetworkLayerListener,
        40 : changeNetworkListener,
    };

    if (event.keyCode in listeners) {
        listeners[event.keyCode](event);
    }
});
