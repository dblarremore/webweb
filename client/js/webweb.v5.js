/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */
var webweb;

function Webweb(wwdata) {
    this.networkNames = Object.keys(wwdata.networks);

    this.scales = {
        'nodeSize' : d3.scaleLinear().range([1, 1]),
        'colors' : {
            'scalar' : d3.scaleLinear().range([1, 1]),
            'categorical' : d3.scaleOrdinal().range([1, 1]),
        },
        'links' : {
            'width' : d3.scaleLinear().range([1, 1]),
            'opacity' : d3.scaleLinear().range([0.4, 0.9]),
        },
    };

    this.displayDefaults = {
        'c' : 60, // charge
        'g' : 0.1, // gravity
        'l' : 20, // edge length
        'r' : 5, // node radius
        'linkStrength' : 1,
        'colorPalette' : 'Set1',
        'metadata' : {},
        'nameToMatch' : "",
        'freezeNodeMovement' : false,
        'hideMenu' : false,
        'invertBinaryColors' : false,
        'invertBinarySizes' : false,
        'colorBy' : 'none',
        'sizeBy' : 'none',
        'scaleLinkOpacity' : false,
        'networkName' : this.networkNames[0],
        'networkLayer' : 0,
    };

    this.displaySynonyms = [
        ['c', 'charge'],
        ['g', 'gravity'],
        ['h', 'height'],
        ['l', 'linkLength'],
        ['r', 'radius'],
        ['w', 'width'],
    ];

    this.display = this.standardizeDisplayParameterSynonyms(wwdata.display);
    this.standardizeNetworks(wwdata.networks);

    this.createNodes();
    this.createSimulation();

    this.legendNodes = [];
    this.legendText = [];
}
Webweb.prototype.standardizeNetworks = function(networks) {
    this.networks = {};
    for (var networkName in networks) {
        var network = networks[networkName];
        this.networks[networkName] = this.standardizeNetwork(network);
    }
}
Webweb.prototype.standardizeDisplayParameterSynonyms = function(display) {
    if (display == undefined) {
        display = {};
    }

    for (var i in this.displaySynonyms) {
        var key1 = this.displaySynonyms[i][0];
        var key2 = this.displaySynonyms[i][1];

        if (display[key1] == undefined && display[key2] !== undefined) {
            display[key1] = display[key2];
        }

        delete display[key2];
    }

    for (var key in this.displayDefaults) {
        if (display[key] == undefined) {
            display[key] = this.displayDefaults[key];
        }
    }

    return display;
}
Webweb.prototype.standardizeNetwork = function(network) {
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
        network.layers[i] = this.standardizeLayer(network.layers[i]);
        network.layers[i].nodeIdMap = this.getNodeIdMap(network.layers[i]);
    }

    return network;
}
Webweb.prototype.getNodeIdMap = function(network) {
    var nodeNames = [];

    network.edgeList.forEach(function(edge) {
        nodeNames.push(edge[0]);
        nodeNames.push(edge[1]);
    });

    if (getObjetPropertyCount(this.display.nodes) > 0) {
        for (var i in this.display.nodes) {
            var _id = isNaN(i) ? i : +i;
            nodeNames.push(_id);
        }
    }

    if (getObjetPropertyCount(network.nodes) > 0) {
        for (var i in network.nodes) {
            var _id = isNaN(i) ? i : +i;
            nodeNames.push(_id);
        }
    }

    if (allInts(nodeNames)) {
        nodeNames.sort();
    }

    var unusedId = 0;
    var nodeIdMap = {};
    nodeNames.forEach(function(name) {
        if (nodeIdMap[name] == undefined) {
            nodeIdMap[name] = unusedId;
            unusedId += 1;
        }
    });

    var unusedName = 0;
    for (var key in nodeIdMap){
        key = +key;
        if (isInt(key) && key >= unusedName) {
            unusedName = key + 1;
        }
    }

    var displayMetadataValuesCount = metadataValuesCount(this.display.metadata);

    if (displayMetadataValuesCount > unusedId) {
        while (displayMetadataValuesCount > unusedId) {
            nodeIdMap[unusedName] = unusedId;
            unusedName += 1;
            unusedId += 1;
        }
    }

    var networkMetadataValuesCount = metadataValuesCount(network.metadata);

    if (networkMetadataValuesCount > unusedId) {
        while (networkMetadataValuesCount > unusedId) {
            nodeIdMap[unusedName] = unusedId;
            unusedName += 1;
            unusedId += 1;
        }
    }

    return nodeIdMap;
}
Webweb.prototype.standardizeLayer = function(layer) {
    if (this.display.metadata == undefined) {
        this.display.metadata = {};
    }
    if (layer.metadata !== undefined) {
        for (var metadatum in layer.metadata) {
            var layerMetadatum = layer.metadata[metadatum];

            var displayMetadatum = {};
            if (this.display.metadata[metadatum] !== undefined) {
                displayMetadatum = this.display.metadata[metadatum];
            }

            if (layerMetadatum.categories !== undefined) {
                displayMetadatum.categories = layerMetadatum.categories;
            }

            if (layerMetadatum.type !== undefined) {
                displayMetadatum.type = layerMetadatum.type;
            }

            this.display.metadata[metadatum] = displayMetadatum;
        }
    }

    return layer;
}
////////////////////////////////////////////////////////////////////////////////
// Webweb:
// nodes
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// initialize the nodes (attempting to be smart about the number of them)
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.createNodes = function() {
    // iterate through the networks and get their node counts
    this.maxNodeCount = 0;
    for (var i in this.networks) {
        var network = this.networks[i];
        for (var i in network.layers) {
            var nodeCount = getObjetPropertyCount(network.layers[i].nodeIdMap);

            if (nodeCount > this.maxNodeCount) {
                this.maxNodeCount = nodeCount;
            }
        }
    }

    this.nodes = [];
    for (var i = 0; i < this.maxNodeCount; i++) {
        this.nodes.push(new Node(i));
    }

    this.nodesPersistence = [];
}
////////////////////////////////////////////////////////////////////////////////
// 
// Node
// 
////////////////////////////////////////////////////////////////////////////////
function Node(idx) {
    this.idx = idx;
}

Node.prototype.radius = function() {
    if (this.fixedRadius) {
        return this.fixedRadius;
    }

    var radius = this.__scaledSize * webweb.display.r;
    if (this.matchesString() || this.containsMouse(radius)) {
        radius *= 1.3;
    }

    return radius;
}
Node.prototype.outline = function() {
    if (this.matchesString() || this.containsMouse()) {
        return "black";
    }
    else {
        return d3.rgb(255, 255, 255);
    }
}
Node.prototype.isMetadataKey = function(key) {
    var nonMetadataKeys = [
        'degree',
        'strength',
        'fx',
        'fy',
        'idx',
        'index',
        'vx',
        'vy',
        'x',
        'y',
    ];

    if (nonMetadataKeys.indexOf(key) < 0) {
        var attribute = this[key];
        
        if (attribute && {}.toString.call(attribute) !== '[object Function]') {
            return true;
        }
    }

    return false;
}
Node.prototype.draw = function(ctx) {
    var radius = this.radius();
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2, false)
    ctx.strokeStyle = this.outline();
    ctx.stroke();
    ctx.fillStyle = d3.rgb(this.__scaledColor);
    ctx.fill();

    this.pushNodeText();
}
Node.prototype.pushNodeText = function() {
    var radius = this.radius();
    if (! this.nonInteractive) {
        if (this.matchesString() || webweb.display.showNodeNames || this.containsMouse(radius)) {
            if (webweb.simulation.alpha() < .01) {
                var text = this.name || this.idx;
                var textX = this.x + 1.1 * radius;
                var textY = this.y - 1.1 * radius;
                var font = "12px";
                webweb.nodeText.push(new Text(text, textX, textY, font));
            }
        }
    }
}
Node.prototype.drawSVG = function() {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttributeNS(null, 'cx', this.x);
    circle.setAttributeNS(null, 'cy', this.y);
    circle.setAttributeNS(null, 'r', this.radius());
    circle.setAttributeNS(null, 'style', 'fill: ' + d3.rgb(this.__scaledColor) + '; stroke: ' + this.outline() + ';' );

    this.pushNodeText();
    return circle;
}
Node.prototype.containsMouse = function(radius) {
    if (webweb.canvas.mouseState == undefined) {
        return false;
    }

    // recursion...
    if (radius == undefined) {
        radius = 1.3 * this.radius();
    }

    if (
        this.x + radius >= webweb.canvas.mouseState.x &&
        this.x - radius <= webweb.canvas.mouseState.x &&
        this.y + radius >= webweb.canvas.mouseState.y &&
        this.y - radius <= webweb.canvas.mouseState.y
    ) {
        return true;
    }

    return false;
}
Node.prototype.matchesString = function() {
    var matchString = webweb.display.nameToMatch;
    if (matchString !== undefined && matchString.length > 0) {
        if (this.name !== undefined && this.name.indexOf(matchString) >= 0) {
            return true;
        }
    }
    
    return false;
}
////////////////////////////////////////////////////////////////////////////////
// 
// Text
// 
////////////////////////////////////////////////////////////////////////////////
function Text(value, x, y, font) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.font = font;
}

Text.prototype.draw = function(ctx) {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = this.font;
    ctx.fillText(this.value, this.x, this.y);
    ctx.restore();
}
Text.prototype.drawSVG = function() {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = this.value;
    text.setAttributeNS(null, 'x', this.x);
    text.setAttributeNS(null, 'y', this.y);
    text.setAttributeNS(null, 'style', 'fill: black; font-size: ' + this.font + ';' );
    return text;
}
////////////////////////////////////////////////////////////////////////////////
// 
// Link
// 
////////////////////////////////////////////////////////////////////////////////
function Link(source, target, weight) {
    this.source = source;
    this.target = target;
    this.w = weight;
    this.strokeStyle = d3.rgb(150, 150, 150)
}
Link.prototype.width = function() {
    return this.w == 0 ? 0 : webweb.scales.links.width(this.w);
}
Link.prototype.opacity = function() {
    return webweb.scales.links.opacity(this.w);
}
Link.prototype.draw = function(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity();
    ctx.beginPath();
    ctx.moveTo(this.source.x, this.source.y);
    ctx.lineTo(this.target.x, this.target.y);
    ctx.lineWidth = this.width();
    ctx.strokeStyle = this.strokeStyle;
    ctx.stroke();
    ctx.restore();
}
Link.prototype.drawSVG = function() {
    var link = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    link.setAttributeNS(null, 'x1', this.target.x);
    link.setAttributeNS(null, 'y1', this.target.y);
    link.setAttributeNS(null, 'x2', this.source.x);
    link.setAttributeNS(null, 'y2', this.source.y);
    link.setAttributeNS(null, 'style', 'stroke: ' + this.strokeStyle + '; stroke-opacity: ' + this.opacity() + ';' + 'stroke-width: ' + this.width() + ';' );

    return link;
}
////////////////////////////////////////////////////////////////////////////////
// adds/removes nodes from the visualization
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.setVisibleNodes = function() {
    var count = getObjetPropertyCount(webweb.displayedNetworkData().nodeIdMap);

    if (! count) {
        count = this.maxNodeCount;
    }

    if (count < this.nodes.length) {
        while (count != this.nodes.length) {
            var node = this.nodes.pop();
            this.nodesPersistence.push(node);
        }
    }
    else if (count > this.nodes.length) {
        while (count != this.nodes.length) {
            var node = this.nodesPersistence.pop();
            this.nodes.push(node);
        }
    }
}
Webweb.prototype.resetNodeMetadata = function() {
    // reset node data
    for (var i in this.nodes) {
        for (var key in this.nodes[i]) {
            if (this.nodes[i].isMetadataKey(key)) {
                delete this.nodes[i][key];
            }
            else if (key == 'degree' || key == 'strength') {
                // reset the degree and strength (strength not yet supported)
                this.nodes[i][key] = 0;
            }
        }
    }
}
Webweb.prototype.standardizeSourceMetadata = function(source) {
    var nodeIdMap = this.displayedNetworkData().nodeIdMap;

    // add the vectorized node metadata to the nodes
    for (var metadatum in source.metadata) {
        for (var i in source.metadata[metadatum].values) {
            this.nodes[i][metadatum] = source.metadata[metadatum].values[i];
        }
    }

    if (getObjetPropertyCount(source.nodes) == 0) {
        return;
    }

    for (var i in source.nodes) {
        for (var metadatum in source.nodes[i]) {
            this.nodes[nodeIdMap[i]][metadatum] = source.nodes[i][metadatum];
        }
    }
}
////////////////////////////////////////////////////////////////////////////////
// loads the metadata up from the places they could come from:
// 1. the defaults (none, degree)
// 2. the display parameters
// 3. the network itself
//
// Priority is given to the network's metadata, then display, then defaults
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.setNodeMetadata = function() {
    this.setVisibleNodes();
    this.resetNodeMetadata();

    var networkData = this.displayedNetworkData();
    var nodeIdMap = networkData.nodeIdMap;

    this.standardizeSourceMetadata(this.display);
    this.standardizeSourceMetadata(networkData);

    var nodeNameMap = {};
    for(var key in nodeIdMap){
        nodeNameMap[nodeIdMap[key]] = key;
    }

    // now we need to define the set of metadata
    for (var i in this.nodes) {
        var node = this.nodes[i];
        for (var key in node) {
            if (node.isMetadataKey(key)) {
                if (this.display.metadata !== undefined && this.display.metadata[key] !== undefined) {
                    var metadatumInfo = this.display.metadata[key];

                    // if we have categories, change the node values here
                    if (metadatumInfo.categories !== undefined) {
                        var nodeCategoryNumber = this.nodes[i][key];
                        this.nodes[i][key] = metadatumInfo.categories[nodeCategoryNumber];
                    }
                    else if (metadatumInfo.type !== undefined && metadatumInfo.type == 'binary') {
                        this.nodes[i][key] = this.nodes[i][key] ? true : false;
                    }
                }
            }
        }

        // if we don't already have node names, use the mapping to assign them
        if (this.nodes[i]['name'] == undefined && nodeNameMap !== undefined) {
            this.nodes[i]['name'] = nodeNameMap[this.nodes[i].idx];
        }
    }

    this.allMetadata = {
        'none' : {
            'type' : 'none',
        },
        'degree' : {
            'type' : 'degree',
        },
        'strength' : {
            'type' : 'degree',
        },
    };

    // identify the set of metadata keys
    this.nodes.forEach(function(node) {
        for (var key in node) {
            if (node.isMetadataKey(key)) {
                if (this.allMetadata[key] == undefined) {
                    var networkMetadata = networkData.metadata;
                    if (networkMetadata !== undefined && networkMetadata !== null && networkMetadata[key] !== undefined) {
                        this.allMetadata[key] = networkMetadata[key];
                    }
                    else if (this.display.metadata[key] !== undefined) {
                        this.allMetadata[key] = this.display.metadata[key];
                    }
                    else {
                        this.allMetadata[key] = {};
                    }
                }
            }
        }
    }, this);

    for (metadatum in this.allMetadata) {
        if (this.allMetadata[metadatum].type == undefined) {
            this.allMetadata[metadatum].type = this.getMetadatumType(metadatum);
        }

        if (this.allMetadata[metadatum].type == "categorical") {
            this.setCategoricalMetadataInfo(metadatum);
        }
    }

    // these below if statements are only here because of poor design (says
    // hunter, the designer of this bit)
    // really, computeSizes and computeColors should already have this
    // information.
    if (this.display.colorBy !== undefined && this.display.colorBy !== 'none') {
        if (this.allMetadata !== undefined && this.allMetadata[this.display.colorBy] == undefined) {
            this.display.colorBy = 'none';
        }
    }
    if (this.display.sizeBy !== undefined && this.display.sizeBy !== 'none') {
        if (this.allMetadata !== undefined && this.allMetadata[this.display.sizeBy] == undefined) {
            this.display.sizeBy = 'none';
        }
    }
}
////////////////////////////////////////////////////////////////////////////////
// tries to figure out the metadatum type of a given metadatum.
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.getMetadatumType = function(metadatum) {
    if (metadatum == 'none') {
        return;
    }

    var q = d3.set(getRawNodeValues(metadatum)).values().sort();

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
Webweb.prototype.setCategoricalMetadataInfo = function(metadatum) {
    var metadata = this.allMetadata[metadatum];

    if (metadata.categories == undefined) {
        var rawValues = getRawNodeValues(metadatum);
        metadata.categories = d3.set(rawValues).values().sort();
    }

    if (metadata.categories.length >= 9) {
        metadata.type = 'scalarCategorical';
    }

    this.allMetadata[metadatum] = metadata;
}
////////////////////////////////////////////////////////////////////////////////
// initialize links/edges
//
// - scale link width/opacity
// - calculate node weights/degrees
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.createLinks = function() {
    var networkData = this.displayedNetworkData();
    var nodeIdMap = networkData.nodeIdMap;

    var linkMatrix = {};

    // reset the node degrees
    for (var i in this.nodes) {
        webweb.nodes[i].degree = 0;
        webweb.nodes[i].strength = 0;

        linkMatrix[i] = {};
        for (var j in this.nodes) {
            linkMatrix[i][j] = 0;
        }
    }

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
            
        this.nodes[source].degree += 1;
        this.nodes[target].degree += 1;
        this.nodes[source].strength += weight;
        this.nodes[target].strength += weight;
    }

    this.links = [];
    for (var source in linkMatrix) {
        for (var target in linkMatrix[source]) {
            if (linkMatrix[source][target]) {
                this.links.push(new Link(
                    source,
                    target,
                    linkMatrix[source][target],
                ));
            }
        }
    }

    var networkIsUnweighted = true;
    this.nodes.forEach(function(node) {
        if (node.strength !== node.degree) {
            networkIsUnweighted = false;
        }
    });

    if (networkIsUnweighted) {
        delete this.allMetadata.strength;
    }

    this.scales.links.width.domain(d3.extent(weights));
    this.scales.links.opacity.domain(d3.extent(weights));
}
////////////////////////////////////////////////////////////////////////////////
// Webweb:
//
// UTIL
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.displayedNetworkData = function() {
    return this.networks[this.display.networkName].layers[this.display.networkLayer];
}
Webweb.prototype.getSizeByType = function() {
    return this.allMetadata[this.display.sizeBy].type;
}
Webweb.prototype.getColorByType = function() {
    return this.allMetadata[this.display.colorBy].type;
}
////////////////////////////////////////////////////////////////////////////////
// Webweb:
// simulation
//////////////////////////////////////////////////////////////////////////////// 
Webweb.prototype.tick = function() {
    webweb.canvas.redraw.call(webweb.canvas);
}
Webweb.prototype.createSimulation = function() {
    this.simulation = d3.forceSimulation(this.nodes)
        .on('tick', this.tick);

    this.simulation.alphaDecay = 0.001

    this.forces = {
        "center" : function () {
            return d3.forceCenter(this.display.w / 2, this.display.h / 2);
        },
        "charge" : function () {
            return d3.forceManyBody().strength(-this.display.c);
        },
        "gravity-x" : function () {
            return d3.forceX(this.display.w / 2).strength(this.display.g);
        },
        "gravity-y" : function () {
            return d3.forceY(webweb.display.h / 2).strength(webweb.display.g);
        },
        "link" : function () {
            return d3.forceLink()
                .links(this.links)
                .distance(this.display.l)
                .strength(this.display.linkStrength);
        },
    }
}
Webweb.prototype.updateSimulation = function(force) { 
    var forcesToUpdate = [];
    if (force && this.forces[force] !== undefined) {
        forcesToUpdate.push(force)
    }
    else {
        for (var force in this.forces) {
            forcesToUpdate.push(force);
        }
    }

    for (var i in forcesToUpdate) {
        var forceToUpdate = forcesToUpdate[i];
        var updatedForce = this.forces[forceToUpdate].call(this);
        this.simulation.force(forceToUpdate, updatedForce);
    }
    this.simulation.alpha(1).restart();
}
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
    webweb = new Webweb(wwdata);

    initializeHTML();
    displayNetwork();
}
function initializeHTML() {
    var container;

    if (webweb.display.attachWebwebToElementWithId == undefined) {
        var container = document.createElement('div')
        container.setAttribute('id', 'webweb-center');

        document.getElementsByTagName("body")[0].appendChild(container);

        if (wwdata.title !== undefined) {
            document.title = wwdata.title;
        }
    }
    else {
        container = document.getElementById(webweb.display.attachWebwebToElementWithId);
    }

    writeMenus(container);
    writeVisualization(container);
}
function writeVisualization(container) {
    var visualizationContainer = document.createElement("div");
    visualizationContainer.setAttribute('id', 'webweb-visualization-container');

    container.appendChild(visualizationContainer);

    if (webweb.display.w == undefined) {
        var heuristic = container.clientWidth - 3 * 20;

        if (heuristic <= 0) {
            heuristic = 1000;
        }
        webweb.display.w = Math.min.apply(null, [heuristic, 1000]);
    }

    if (webweb.display.h == undefined) {
        webweb.display.h = Math.min.apply(null, [webweb.display.w, 600]);
    }

    webweb.canvas = new CanvasState(webweb);
    document.getElementById('webweb-visualization-container').appendChild(webweb.canvas.canvas);
}

////////////////////////////////////////////////////////////////////////////////
// - changes the number of visible nodes
// - adds metadata to nodes
// - computes links
// - draws links
// - uses the force (luke)
////////////////////////////////////////////////////////////////////////////////
function displayNetwork() {
    webweb.setNodeMetadata();
    webweb.createLinks();
    webweb.updateSimulation();

    // update the menus with these new metadata
    updateSizeMenu();
    updateColorMenu();

    toggleFreezeNodes(webweb.display.freezeNodeMovement);
    toggleShowNodeNames(webweb.display.showNodeNames);
    toggleInvertBinaryColors(webweb.display.invertBinaryColors);
    toggleInvertBinarySizes(webweb.display.invertBinarySizes);
    toggleLinkWidthScaling(webweb.display.scaleLinkWidth);
    toggleLinkOpacityScaling(webweb.display.scaleLinkOpacity);

    // change the display of the layers widget
    setNetworkLayerMenuVisibility();

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (webweb.display.freezeNodeMovement) {
        webweb.canvas.redraw();
    }

    computeLegend();
}
////////////////////////////////////////////////////////////////////////////////
// creates a map from observed nodes (nodes in the edge list, display.nodes, and
// the current layer's nodes) to an internal "id"
////////////////////////////////////////////////////////////////////////////////
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
// Compute the radius multipliers of the nodes, given the data and chosen parameters
// 
// the 'sizeBy' display parameter determines how we will scale this.
// For example, if sizeBy is None, then the multiplier is 1 (the identity)
// Otherwise, the multiplier can be something else!
////////////////////////////////////////////////////////////////////////////////
function computeSizes() {
    var rawValues = [];
    var scaledValues = [];

    var sizeBy = webweb.display.sizeBy;

    // set all sizes to 1 if there's no scaling 
    if (sizeBy == "none") {
        for (var i in webweb.nodes) {
            scaledValues[i] = 1;
            rawValues[i] = 1;
        }
    }
    else {
        var type = webweb.getSizeByType();
        rawValues = getRawNodeValues(sizeBy, type, 'size');

        // if we're sizing by degree (or strength), square root the value
        rawValues.forEach(function(val) {
            var scaled = type == 'degree' ? Math.sqrt(val) : val;
            scaledValues.push(scaled);
        });

        // scale between true and false even if we only have one of
        // the two values
        var extent = type == 'binary' ? [true, false] : scaledValues;
        var range = d3.set(extent).values().length > 1 ? [0.5, 1.5] : [1, 1];

        webweb.scales.nodeSize.domain(d3.extent(extent)).range(range);

        for (var i in scaledValues) {
            scaledValues[i] = webweb.scales.nodeSize(scaledValues[i]);
        }
    }

    for (var i in webweb.nodes) {
        webweb.nodes[i]['__scaledSize'] = scaledValues[i];
        webweb.nodes[i]['__rawSize'] = rawValues[i];
    }
}
////////////////////////////////////////////////////////////////////////////////
// computes the colors for the nodes based on the preferences of the user chosen
// in the dropdown menus.
////////////////////////////////////////////////////////////////////////////////
function computeColors() {
    var rawValues = [];
    var scaledValues = [];

    // no colors
    if (webweb.display.colorBy == "none"){
        for (var i in webweb.nodes) { 
            rawValues[i] = d3.rgb(100, 100, 100);
            scaledValues[i] = d3.rgb(100, 100, 100);
        }
    }
    else {
        var type = webweb.getColorByType();
        var rawValues = getRawNodeValues(webweb.display.colorBy, type, 'color');

        if (type == 'binary' || type == 'categorical') {
            var categoryValues = [];

            if (type == 'binary') {
                categoryValues = getBinaryValues('color');
            }
            else {
                categoryValues = d3.set(rawValues).values().sort();
            }

            var categoryValuesCount = categoryValues.length;

            // make sure there's enough categories even if there aren't
            if (categoryValuesCount == 1) {
                categoryValuesCount += 1;
            }

            // if there are fewer than 9 categories, use the colorbrewer
            // TODO:
            // actually check how many colors there are in the user's selected
            // colorbrewer
            // update the list for this...
            webweb.scales.colors.categorical.domain(categoryValues)
                .range(colorbrewer[webweb.display.colorPalette][categoryValuesCount]);
        }
        else if (type == 'scalarCategorical') {
            var categoryValues = d3.set(rawValues).values().sort();
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

        if (type != 'categorical') {
            webweb.scales.colors.scalar.domain(d3.extent(rawValues)).range([0,1]);
        }
    }

    for (var i in webweb.nodes) {
        scaledValues[i] = colorWheel(rawValues[i]);
        webweb.nodes[i]['__scaledColor'] = scaledValues[i];
        webweb.nodes[i]['__rawColor'] = rawValues[i];
    }
}
////////////////////////////////////////////////////////////////////////////////
// returns raw values for:
// - a metadatumName
// - a metadatumType
// - a displayType (color/size)
////////////////////////////////////////////////////////////////////////////////
function getRawNodeValues(metadatumName, metadatumType, displayType) {
    var rawValues = [];
    for (var i in webweb.nodes){
        var val = webweb.nodes[i][metadatumName];

        if (metadatumType == 'binary') {
            val = getBinaryValue(val, displayType);
        }

        rawValues[i] = val;
    }

    return rawValues;
}
// ColorWheel is a function that takes a node metadatum, like a category or scalar
// and just gets the damn color. But it has to take into account what the 
// current colorType is. Basically, this is trying to apply our prefs to colors
function colorWheel(x) {
    var type = webweb.getColorByType();

    if (type == "categorical") {
        return webweb.scales.colors.categorical(x);
    }
    else if (type == 'binary') {
        return webweb.scales.colors.categorical(getBinaryValue(x, 'color'));
    }
    else {
        return d3.hsl(210 * (1 - webweb.scales.colors.scalar(x)), 0.7, 0.5);
    }
}
////////////////////////////////////////////////////////////////////////////////
//
//
// Menu Interaction
//
//
////////////////////////////////////////////////////////////////////////////////
function changeNetwork(networkName) {
    var networkSelect = document.getElementById('networkSelect-widget');
    networkSelect.value = networkName;

    webweb.display.networkName = networkName;
    displayNetwork();
}
function changeSizes(sizeBy) {
    webweb.display.sizeBy = sizeBy;

    computeLegend();
    webweb.canvas.redraw();

    var showInvertWidget = webweb.getSizeByType() == 'binary' ? true : false;
    setInvertBinaryWidgetVisibility(showInvertWidget, 'size');
}
function changeColors(colorBy) {
    webweb.display.colorBy = colorBy;
    computeLegend();
    webweb.canvas.redraw();
    var showColorPaletteWidget = webweb.getColorByType() == 'categorical' ? true : false;
    var showInvertWidget = false;

    if (webweb.getColorByType() == 'binary') {
        showColorPaletteWidget = true;
        showInvertWidget = true;
    }
    setColorPaletteMenuVisibility(showColorPaletteWidget);
    setInvertBinaryWidgetVisibility(showInvertWidget, 'color');
}
function setColorPalette(colorPalette) {
    webweb.display.colorPalette = colorPalette;
    computeLegend();
    webweb.canvas.redraw();
}
function changeCharge(c) {
    if (c >= 0) {
        webweb.display.c = c;
        webweb.updateSimulation("charge");
    }
    else {
        alert("Repulsion must be nonnegative.");
    }
}
function changeR(r) {
    webweb.display.r = r;
    computeLegend();
    webweb.canvas.redraw();
}
function changeDistance(l) {
    if (l >= 0) {
        webweb.display.l = l;
        webweb.updateSimulation("link");
        webweb.canvas.redraw();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeLinkStrength(linkStrength) {
    if (linkStrength >= 0) {
        webweb.display.linkStrength = linkStrength;
        webweb.updateSimulation("link");
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeGravity(g) {
    if (parseFloat(g) >= 0) {
        webweb.display.g = parseFloat(g);
        webweb.updateSimulation("gravity-x");
        webweb.updateSimulation("gravity-y");
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}
function toggleFreezeNodes(isFrozen) {
    webweb.display.freezeNodeMovement = isFrozen;
    if (isFrozen) {
        webweb.simulation.stop();
        for (var i = 0; i < webweb.simulation.nodes().length; i++) {
            webweb.simulation.nodes()[i].fx = webweb.simulation.nodes()[i].x;
            webweb.simulation.nodes()[i].fy = webweb.simulation.nodes()[i].y;
        }
    }
    else {
        for (var i = 0; i < webweb.simulation.nodes().length; i++) {
            webweb.simulation.nodes()[i].fx = undefined;
            webweb.simulation.nodes()[i].fy = undefined;
        }
        webweb.updateSimulation("__");
    }

    var freezeNodesToggle = document.getElementById('freezeNodes-widget');
    freezeNodesToggle.checked = webweb.display.freezeNodeMovement ? true : false;
    webweb.canvas.redraw();
}
function toggleShowNodeNames(show) {
    webweb.display.showNodeNames = show;
    var showNodeNamesWidget = document.getElementById('showNodeNames-widget');
    showNodeNamesWidget.checked = webweb.display.showNodeNames;
    webweb.canvas.redraw();
}
function toggleInvertBinaryColors(setting) {
    var widget = document.getElementById('invertBinaryColors-widget');
    widget.checked = setting;
    webweb.display.invertBinaryColors = setting;

    computeLegend();
    webweb.canvas.redraw();
}
function toggleInvertBinarySizes(setting) {
    var widget = document.getElementById('invertBinarySizes-widget');
    widget.checked = setting;
    webweb.display.invertBinarySizes = setting;

    computeLegend();
    webweb.canvas.redraw();
}
function getBinaryValue(value, type) {
    var attribute = getBinaryInversionAttributeForType(type);

    if (webweb.display[attribute]) {
        return value ? false : true;
    }
    else {
        return value;
    }
}
function getBinaryValues(type) {
    return [getBinaryValue(false, type), getBinaryValue(true, type)];
}
function toggleLinkWidthScaling(checked) {
    var range = checked ? [0.5, 4] : [1, 1];
    webweb.scales.links.width.range(range);
    webweb.canvas.redraw();
}
function toggleLinkOpacityScaling(checked) {
    var range = checked ? [0.4, 0.9] : [1, 1];
    webweb.scales.links.opacity.range(range);
    webweb.canvas.redraw();
}
function matchNodesNamed(x) {
    webweb.display.nameToMatch = x;
    webweb.canvas.redraw();
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
    computeColors();
    computeSizes();
    webweb.legendNodes = [];
    webweb.legendText = [];

    var sizeBy = webweb.display.sizeBy;
    var sizeType = webweb.getSizeByType();
    var colorBy = webweb.display.colorBy;
    var colorType = webweb.getColorByType();

    if (sizeType == "none" && colorType == "none") {
        return;
    };

    var sizeLegend = new Legend(sizeBy, 'size', sizeType, getRawNodeValues('__rawSize'));
    var colorLegend = new Legend(colorBy, 'color', colorType, getRawNodeValues('__rawColor'));

    var R = 0;

    if (sizeLegend.values.length > 0) {
        R = webweb.display.r * d3.max(sizeLegend.values);;
    }

    // if we have a color legend, use it for the size menu (if it's there)
    var fillFunction = function(i) {
        return d3.rgb(100, 100, 100);
    };

    if (sizeBy == colorBy) {
        fillFunction = function(i) {
            return colorWheel(colorLegend.values[i]);
        }
    }

    var datatypeTextPushdown = 15;

    var textPushRight = 2 * (Math.max(R, 5) + 5);
    var nodePushRight = 5 + Math.max(R, 5);
    var pushdown = function(i) { return 0 };

    if (sizeBy != "none") {
        pushdown = function (i) {
            if (i !== undefined) {
                return 5 + R + 2.3 * R * i + datatypeTextPushdown;
            }
            return datatypeTextPushdown;
        };

        sizeLegend.drawLegendLabel(pushdown);
        sizeLegend.drawLegendText(pushdown, textPushRight);
        sizeLegend.drawLegendValues(
            pushdown,
            nodePushRight,
            function (d) { return webweb.display.r * d },
            fillFunction,
        );
    }

    // if we've drawn the size legend and the color legend shows the same value,
    // return
    if (sizeBy == colorBy) {
        return;
    }

    if (colorType != "none") {
        var initialPushdown = datatypeTextPushdown;

        if (webweb.display.sizeBy != "none") {
            initialPushdown += pushdown(sizeLegend.values.length);
            pushdown = function (i) {
                if (i !== undefined) {
                    return 2.3 * Math.max(R, 7.5) * i + initialPushdown + datatypeTextPushdown;
                }
                return initialPushdown;
            }
        }
        else {
            pushdown = function (i) {
                if (i !== undefined) {
                    return 2.3 * webweb.display.r * i + initialPushdown + (3 + i) * webweb.display.r;
                }
                return initialPushdown;
            }
        }

        // show the variable being displayed
        colorLegend.drawLegendLabel(pushdown);
        colorLegend.drawLegendText(pushdown, textPushRight);
        colorLegend.drawLegendValues(
            pushdown,
            nodePushRight,
            function (i) { return webweb.display.r },
            function (i) { return colorWheel(colorLegend.values[i]); }
        );
    }
}
function Legend(metadataName, legendType, dataType, rawValues) {
    this.metadataName = metadataName;
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
            'scalarCategorical' : 'makeScalarCategoricalLegend',
        },
    }

    var legendFunction = legendTypeToLegendMaker[this.legendType][this.dataType];

    if (legendFunction !== undefined) {
        this[legendFunction]();

        if (this.legendType == 'size') {
            for (var i in this.values) {
                this.values[i] = webweb.scales.nodeSize(this.values[i]);
            }
        }
    }
}
Legend.prototype.drawLegendLabel = function(pushDown) {
    var text = new Text(this.metadataName, 5, pushDown(), "12px");
    webweb.legendText.push(text);
}
Legend.prototype.drawLegendText = function(pushDown, pushRight) {
    this.text.forEach(function(d, i) {
        var text = new Text(d, pushRight, pushDown(i) + 3.5, "12px");
        webweb.legendText.push(text);
    });
}
Legend.prototype.drawLegendValues = function(pushDown, pushRight, sizeFunction, colorFunction) {
    this.values.forEach(function(d, i){
        var node = new Node(-1);
        node.fixedRadius = sizeFunction(d);
        node.x = pushRight;
        node.y = pushDown(i);
        node.__scaledColor = colorFunction(i);
        node.nonInteractive = true;

        webweb.legendNodes.push(node);
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
    this.values = webweb.scales.colors.categorical.domain();
    this.text = d3.values(webweb.allMetadata[webweb.display.colorBy].categories);
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
Legend.prototype.makeScalarCategoricalLegend = function(bins) {
    this.makeBinnedLegend();

    // this logic is sorta weird; we have converted the categorical information
    // to indexes, but we want the legend to display the actual category values
    // at those indexes
    var categoryValues = d3.set(getRawNodeValues(this.metadataName)).values().sort();

    for (var i in this.text) {
        this.text[i] = categoryValues[parseInt(this.text[i])];
    }
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
function CanvasState(webweb) {
    this.webweb = webweb;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement("canvas");
    this.canvas.id = "webweb-vis-canvas";

    this.canvas.style.width = webweb.display.w + "px";
    this.canvas.style.height = webweb.display.h + "px";

    this.canvas.width = webweb.display.w * this.dpr;
    this.canvas.height = webweb.display.h * this.dpr;

    this.context = this.canvas.getContext('2d');
    this.context.scale(this.dpr, this.dpr);

    this.padding = 3;
    this.dragBoundary = 15;

    this.dragging = false;
    this.draggedNode = undefined;

    this.canvas.addEventListener("mousedown", function(event) {
        webweb.canvas.mouseDownListener(event);
    });
    this.canvas.addEventListener("mousemove", function(event) {
        webweb.canvas.mouseMoveListener(event);
    });
    this.canvas.addEventListener("mouseup", function(event) {
        webweb.canvas.mouseUpListener(event);
    });
}

CanvasState.prototype.getContext = function() {
    if (this.context == undefined) {
        this.context = this.canvas.getContext('2d');
        this.context.scale(this.dpr, this.dpr);
    }
}

CanvasState.prototype.clear = function() {
    this.context.clearRect(0, 0, webweb.display.w, webweb.display.h);
}

CanvasState.prototype.redraw = function() {
    this.clear();
    this.webweb.links.forEach(function(link) {
        link.draw(this.context);
    }, this);

    this.webweb.nodeText = [];
    this.webweb.nodes.forEach(function(node) {
        node.draw(this.context);
    }, this);
    this.webweb.nodeText.forEach(function(text) {
        text.draw(this.context);
    }, this);

    this.webweb.legendNodes.forEach(function(node) {
        node.draw(this.context);
    }, this);
    this.webweb.legendText.forEach(function(text) {
        text.draw(this.context);
    }, this);
}

CanvasState.prototype.getMouseState = function(event) {
    var container = this.canvas.getBoundingClientRect();
    this.mouseState = {
        x: event.clientX - container.left - this.padding,
        y: event.clientY - container.top - this.padding,
    };
}

CanvasState.prototype.mouseIsWithinDragBoundary = function() {
    if (
        this.mouseState.x < this.dragBoundary ||
        this.mouseState.y < this.dragBoundary ||
        this.mouseState.x > this.webweb.display.w - this.dragBoundary ||
        this.mouseState.y > this.webweb.display.h - this.dragBoundary
    ) {
        return true;
    }
    return false;
}

CanvasState.prototype.endDragging = function() {
    webweb.simulation.alphaTarget(0);

    if (! webweb.display.freezeNodeMovement && this.draggedNode !== undefined) {
        this.draggedNode.fx = null;
        this.draggedNode.fy = null;
    }
    this.draggedNode = undefined;
    this.dragging = false;
}

CanvasState.prototype.updateDraggedNode = function() {
    this.draggedNode.x = this.mouseState.x;
    this.draggedNode.y = this.mouseState.y;
    this.draggedNode.fx = this.mouseState.x;
    this.draggedNode.fy = this.mouseState.y;
}
CanvasState.prototype.mouseMoveListener = function(event) {
    this.getMouseState(event);

    if (this.dragging) {
        if (this.mouseIsWithinDragBoundary()) {
            this.endDragging();
        }
        else {
            this.updateDraggedNode();
        }
    }

    this.redraw();
}
CanvasState.prototype.mouseDownListener = function(event) {
    this.getMouseState(event);
    this.endDragging();

    for (var i in webweb.nodes) {
        if (webweb.nodes[i].containsMouse()) {
            this.dragging = true;
            this.draggedNode = webweb.nodes[i];

            webweb.simulation.alphaTarget(0.3).restart();

            this.updateDraggedNode();
        }
    }
}
CanvasState.prototype.mouseUpListener = function() {
    if (this.dragging) {
        this.endDragging();
    }
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
    for (var metadatum in webweb.allMetadata) {
        if (metadatum == 'name') {
            continue;
        }
        if (webweb.allMetadata[metadatum].categories == undefined) {
            options.push(metadatum);
        }
    }

    resetSelectOptionsTo(sizeSelect, options);

    if (webweb.display.sizeBy == undefined) {
        webweb.display.sizeBy = 'none';
    }
    else if (webweb.allMetadata[webweb.display.sizeBy] == undefined) {
        webweb.display.sizeBy = 'none';
    }

    sizeSelect = document.getElementById('sizeSelect-widget');
    sizeSelect.value = webweb.display.sizeBy;
    changeSizes(webweb.display.sizeBy);
}
function updateColorMenu() {
    var colorSelect = document.getElementById('colorSelect-widget');

    var options = [];
    for (var metadatum in webweb.allMetadata) {
        if (metadatum == 'name') {
            continue;
        }

        options.push(metadatum);
    }

    resetSelectOptionsTo(colorSelect, options);

    if (webweb.display.colorBy == undefined) {
        webweb.display.colorBy = 'none';
    }
    else if (webweb.allMetadata[webweb.display.colorBy] == undefined) {
        webweb.display.colorBy = 'none';
    }

    colorSelect.value = webweb.display.colorBy;
    changeColors(webweb.display.colorBy);
}
function setNetworkLayerMenuVisibility() {
    var visibility = 'inline';

    if (wwdata.networks[webweb.display.networkName].layers.length == 1) {
        visibility = 'none';
    }

    document.getElementById('layerSelect-widget').parentElement.style.display = visibility;
}
function changeLayer(layer) {
    webweb.display.networkLayer = layer;

    var layerSelect = document.getElementById('layerSelect-widget');
    layerSelect.value = webweb.display.networkLayer;

    displayNetwork();
}
function setInvertBinaryWidgetVisibility(visible, type) {
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
function setColorPaletteMenuVisibility(visible) {
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
    menu.style.display = webweb.display.hideMenu == true ? 'none' : 'flex';
    container.appendChild(menu);

    var layers = [];
    for (var i in wwdata.networks[webweb.display.networkName].layers) {
        layers.push(i);
    }

    var colorNames = [];
    for (colorName in colorbrewer) {
        colorNames.push(colorName);
    }

    var colorPaletteSelectValue = 'Set1';
    if (webweb.display.colorPalette !== undefined) {
        if (colorbrewer[webweb.display.colorPalette] !== undefined) {
            colorPaletteSelectValue = webweb.display.colorPalette;
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
                        'options' : webweb.networkNames,
                        'value' : webweb.display.networkName,
                        'inline' : true,
                    },
                    'layerSelect' : {
                        'text' : " layer ",
                        'type' : 'select',
                        'functions' : {
                            'change' : changeLayer,
                        },
                        'options' : layers,
                        'value' : webweb.display.networkLayer,
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
                        'text' : ' invert ',
                        'type' : 'checkbox',
                        'functions' : {
                            'change' : toggleInvertBinarySizes,
                        },
                        'value' : webweb.display.invertBinarySizes,
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
                        'text' : ' invert ',
                        'type' : 'checkbox',
                        'functions' : {
                            'change' : toggleInvertBinaryColors,
                        },
                        'value' : webweb.display.invertBinaryColors,
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
                'value' : webweb.display.scaleLinkWidth,
                'size' : 10,
            },
            'scaleLinkOpacity' : {
                'text' : 'Scale link opacity ',
                'type' : 'checkbox',
                'functions' : {
                    'change' : toggleLinkOpacityScaling,
                },
                'value' : webweb.display.scaleLinkOpacity,
                'size' : 10,
            },
            'freezeNodes' : {
                'text' : 'Freeze nodes ',
                'type' : 'checkbox',
                'functions' : {
                    'change' : toggleFreezeNodes,
                },
                'value' : webweb.display.freezeNodes,
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
                'value' : webweb.display.c,
            },
            'linkLength' : {
                'text' : 'Link length: ',
                'functions' : {
                    'change' : changeDistance,
                },
                'value' : webweb.display.l,
            },
            'linkStrength' : {
                'text' : 'Link strength: ',
                'functions' : {
                    'change' : changeLinkStrength,
                },
                'value' : webweb.display.linkStrength,
            },
            'gravity' : {
                'text' : 'Gravity: ',
                'functions' : {
                    'change' : changeGravity,
                },
                'value' : webweb.display.g,
            },
            'radius' : {
                'text' : 'Node radius: ',
                'functions' : {
                    'change' : changeR,
                },
                'value' : webweb.display.r,
            },
            'nameToMatch' : {
                'text' : 'Highlight nodes named: ',
                'functions' : {
                    'input' : matchNodesNamed,
                },
                'value' : webweb.display.nameToMatch,
                'size' : 10,
            },
            'showNodeNames' : {
                'text' : 'Show node names ',
                'type' : 'checkbox',
                'functions' : {
                    'input' : toggleShowNodeNames,
                },
                'value' : webweb.display.showNodeNames,
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
    var svg = drawSVG();
    svg.setAttribute("title", webweb.display.networkName);
    svg.setAttribute("version", 1.1)
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    saveIt(webweb.display.networkName, "image/svg+xml", svg.outerHTML);
};
function drawSVG() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    webweb.links.forEach(function(link) {
        svg.appendChild(link.drawSVG());
    });

    webweb.nodes.forEach(function(node) {
        svg.appendChild(node.drawSVG());
    });
    webweb.nodeText.forEach(function(text) {
        svg.appendChild(text.drawSVG());
    });

    webweb.legendNodes.forEach(function(node) {
        svg.appendChild(node.drawSVG());
    });
    webweb.legendText.forEach(function(text) {
        svg.appendChild(text.drawSVG());
    });

    return svg;
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
    var currentNetworkIndex = webweb.networkNames.indexOf(webweb.display.networkName);
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
        if (0 <= changeToNetworkIndex && changeToNetworkIndex < webweb.networkNames.length) {
            var changeToNetworkName = webweb.networkNames[changeToNetworkIndex];
            changeNetwork(changeToNetworkName);
        }
    }
}
// binds the left/right arrow keys to change layers
function changeNetworkLayerListener(event) {
    var currentLayer = webweb.display.networkLayer;
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
        if (0 <= changeToLayer && changeToLayer < wwdata.networks[webweb.display.networkName].layers.length) {
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
