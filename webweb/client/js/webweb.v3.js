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
/*
 * Here are default values. If you don't put anything different in the JSON file, this is what you get!
 * w width
 * h height
 * c charge
 * l length of edges
 * r radius of nodes
 * g gravity
 */
var c = 60;
var l = 20;
var r = 5;
var g = 0.1;

var displayDefaults = {
    'w' : 800,
    'h' : 800,
    'c' : 60,
    'l' : 20,
    'r' : 5,
    'g' : 0.1,
};

var display = {};
var networkNames;

var N;
var links = [];
var nodes = [];
var node, force;

var scaleSize, scaleColorScalar, scaleColorCategory;
var scaleLink, scaleLinkOpacity;

var colorType, sizeType, colorKey, sizeKey;
var sizes, colors, categoryNames;

var nameToMatch, R, isHighlightText;

var isStartup;

var colorLabels, sizeLabels;
var colorData = {
    'key' : 'none',
    'type' : 'none',
    'scaled_values' : [],
    'rawValues' : [],
    'labels' : {},
    'legend' : [],
    'legendText' : [],
};

var sizeData = {
    'key' : 'none',
    'type' : 'none',
    'scaled_values' : [],
    'rawValues' : [],
    'labels' : {},
    'legend' : [],
    'legendText' : [],
    'R' : 0,
};


/*
 * Dynamics and colors
 */
// tick attributes for links and nodes
function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
}

// This function is poorly named. 
// It is called when loading a network or changing networks
// It rebuilds links, labels, and menus, accordingly
function computeLinks() {
    // Remove all the links in the list of links.
    links.splice(0, links.length);
    draw();

    // get the adjacencies
    adj = d3.values(wwdata["network"][display.networkName]["adjList"]);

    // learn how we should scale the link weight and opacity by computing the
    // range (extent) of the adj weights.
    scaleLink.domain(d3.extent(d3.transpose(adj)[2]));
    scaleLinkOpacity.domain(d3.extent(d3.transpose(adj)[2]));

    // make a matrix to intelligently compute node "weights" (or degree)
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

    setLabels();

    updateSizeMenu();
    updateColorMenu();

    // Hunter: I currently don't understand d3 well enough to get why we have to
    // draw both above and here.
    draw();
}

// Compute the actual radius multipliers of the nodes, given the data and chosen parameters
// Input, x, is the method by which we will compute the radii
// For example, if x is None, then the multiplier is 1, the identity
// Otherwise, the multiplier can be something else!
function computeSizes() {
    sizeData['rawValues'] = [];
    sizes = [];

    sizeType = sizeKey;

    // If there's no degree scaling, set all sizes to 1
    if (sizeKey == "none") {
        for (var i in nodes) {
            sizes[i] = 1;
        }
    }
    else {
        // If we're scaling by degrees, linearly scale the range of SQRT(degrees) between 0.5 and 1.5
        if (sizeKey == "degree") {
            for (var i in nodes){
                var val = nodes[i].weight;
                sizeData['rawValues'][i] = val;
                sizes[i] = Math.sqrt(val);
            }
        }
        else {
            var label = sizeLabels[sizeKey];

            sizeType = label.type;
            for (var i in nodes) {
                sizes[i] = label.value[i];
            }

            sizeData['rawValues'] = sizes.slice(0);
        }

        scaleSize.domain(d3.extent(sizes), d3.max(sizes)).range([0.5,1.5]);
        for (var i in sizes) {
            sizes[i] = scaleSize(sizes[i]);
        }
    }
}

function makeSizeLegend() {
    legend = [];
    text = [];
    sizeData['R'] = 0;
    

    // there is no legend if:
    // - the sizeType is "none"
    // - the radius is undefined
    if (sizeType == 'none' || r == 0 || r == "") {
        return
    }

    if (sizeType == 'binary') {
        legend = [0, 1];
        text = ["false", "true"];
    }
    else {
        // otherwise, the size type is either 'degree' or 'scalar'
        var legendData = getScalarLegend(sizeData['rawValues']);

        legend = legendData['legend'];
        text = legendData['text'];
    }

    if (sizeType == "degree"){
        for (var i in legend){
            legend[i] = scaleSize(Math.sqrt(legend[i]));
        }
    }
    else {
        for (var i in legend){
            legend[i] = scaleSize(legend[i]);
        }
    }

    sizeData['R'] = r * d3.max(legend);
    sizeData['legend'] = legend;
    sizeData['legendText'] = text;
}

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

// Highlight a node by making it bigger and outlining it
function highlightNode(d) {
    d3.select("#node_" + d.idx)
        .transition().duration(100)
        .attr("r", sizes[d.idx] * r * 1.3)
        .style("stroke", d3.rgb(0,0,0));
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

        var highlightTextString = "This is " + nodeName + " " + nodeId;

        vis.append("text").text(highlightTextString)
            .attr("x", d.x + 1.5 * r)
            .attr("y", d.y - 1.5 * r)
            .attr("fill", "black")
            .attr("font-size", 12)
            .attr("id", "highlightText");
    }
}
// Returns a node's highlighted size and stroke to normal
function unHighlightNode(d) {
    if (nameToMatch == "" || d.name.indexOf(nameToMatch) < 0) {
        d3.select("#node_" + d.idx)
            .transition()
            .attr("r",sizes[d.idx]*r)
            .style("stroke",d3.rgb(255,255,255));
    }
}
// Removes a node's highlighted name 
function unHighlightText() {
    vis.selectAll("#highlightText").remove();
}
// Similar to computeSizes, this function computes the colors for the nodes
// based on the preferences of the user chosen in the dropdown menus.
// The argument of this function, x, is a string representing the color choice. 
function computeColors() {
    colorType = colorKey;

    // no colors
    if (colorKey == "none"){
        // set all nodes to dark grey 100
        for (var i in nodes) { 
            colors[i] = d3.rgb(100,100,100);
        }
        return
    }
    // treat degree as a scalar
    if (colorKey == "degree"){
        // raw values are weights
        for (var i in nodes) {
            colorData['rawValues'][i] = nodes[i].weight;
        }
    }
    else {
        var label = colorLabels[colorKey];
        colorType = label.type;

        for (var i in nodes){
            colorData['rawValues'][i] = label.value[i];
        }

        // get the category names if it's categorical
        if (colorType == "categorical") {
            categoryNames = [];
            var categories = [];

            // if we don't have categories, retrieve them as scalars from the
            // values for the label
            if (label.categories == undefined) {
                var q = d3.set(colorData['rawValues']).values().sort();
                for (i in q) {
                    categories[i] = q[i];
                    categoryNames[i] = q[i];
                };
            }
            else {
                categoryNames = label.categories;

                // Check to see if our categories are numeric or labels
                if (isNaN(d3.quantile(colorData['rawValues'], 0.25))) {
                    categories = categoryNames.sort();
                }
                else {
                    for (var i in categoryNames) {
                        categories[i] = i;
                    }
                }
            }

            // if there are fewer than 9 categories, use the colorbrewer
            if (categories.length <= 9) {
                var colorPalateName = getColorPalateName();
                scaleColorCategory.domain(categories)
                    .range(colorbrewer[colorPalateName][categories.length]);
            }
            else {
                // otherwise, treat like scalars
                colorType = "scalarCategorical";
            }
        }
    }

    if (colorType != 'categorical') {
        scaleColorScalar.domain(d3.extent(colorData['rawValues'])).range([0,1]);
    }

    // get colors by passing scaled value to colorWheel
    for (var i in nodes) {
        colors[i] = colorWheel(colorData['rawValues'][i]);
    }
}

function makeColorLegend() {
    var legend = [];
    var text = [];

    if (colorType == "none") {
        return
    }

    if (colorType == "categorical") {
        legend = scaleColorCategory.domain();
        text = d3.values(categoryNames);
    }
    else if (colorType == "binary") {
        legend = [0, 1];
        text = ["false", "true"];
    }
    else if (colorType == "scalar" || colorType == "degree") {
        var legendData = getScalarLegend(colorData['rawValues']);

        legend = legendData['legend'];
        text = legendData['text'];
    }
    else if (colorType == "scalarCategorical") {
        legend = binnedLegend(colorData['rawValues'], 4);
        text = legend.slice(0);
    }

    colorData['legend'] = legend;
    colorData['legendText'] = text;
}

// ColorWheel is a function that takes a node label, like a category or scalar
// and just gets the damn color. But it has to take into account what the 
// current colorType is. Basically, this is trying to apply our prefs to colors
function colorWheel(x) {
    if (isNaN(x)) {
        if (colorType == "categorical" && typeof(x) == "string"){
            return scaleColorCategory(x);
        }
        else {
            return d3.rgb(180, 180, 180)};
    }

    if (colorType == "categorical") {
        return scaleColorCategory(x);
    }
    else if (colorType == "scalar" || colorType == "scalarCategorical" || colorType == "degree") {
        // Rainbow HSL
        return d3.hsl(210 * (1 - scaleColorScalar(x)), 0.7, 0.5);
        // Greyscale
        // return [0.8*255*x,0.8*255*x,0.8*255*x];
        // Copper
        // return [255*Math.min(x/0.75,1),0.78*255*x,0.5*255*x];
    }
    else if (colorType == "binary") {
        if (!x) {
            return d3.rgb(30, 100, 180)
        }
        else {
            return d3.rgb(102, 186, 30)
        };
    }
}
/*
 * Menu interaction
 * These functions are bound to the various menus that we create in the GUI.
 * On menu change, one of these will be called. 
 */
function updateNetwork(networkName) {
    display.networkName = networkName;
    computeLinks();
}
function changeSizes(x) {
    sizeKey = x;
    computeSizes();
    redrawNodes();
    computeLegend();
    if (nameToMatch != "") {
        matchNodes(nameToMatch)
    };
}
function changeColors(x) {
    colorKey = x;
    computeColors();
    redrawNodes();
    computeLegend();
    if (nameToMatch != "") {
        matchNodes(nameToMatch)
    };
}
function setColorPalate(color_palate) {
    computeColors();
    redrawNodes();
    computeLegend();
}

function changeCharge(x) {
    if (x >= 0) {
        force.charge(-x);
        force.start();
    }
    else {
        alert("Repulsion must be nonnegative.");
    }
}
function changer(x) {
    r = x;
    redrawNodes();
    computeLegend();
}
function changeDistance(x) {
    if (x >= 0) {
        force.linkDistance(x);
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
function changeGravity(x) {
    if (x >= 0) {
        force.gravity(x);
        force.start();
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}
function toggleFreezeNodes(frozen) {
    if (frozen) {
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
/*
 * Drawing
 * All the functions here have to do with actually creating objects in the canvas.
 */
function redrawNodes() {
    nodes.forEach(function(d, i) {
        d3.select("#node_" + d.idx)
            .attr("r", sizes[i] * r)
            .style("fill", d3.rgb(colors[i]));
    });
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
// This function is rather complicated.
// We want to draw a legend for the sizes and colors.
// If they are bound to the same attribute, we should have a single color/size combined legend
// If they are bound to different attributes, we should keep them separate.
// We generally prefer integer boundaries in our legends... but only if the values
// that are getting passed in are integers... etc. This code steps through what
// we think of as standard human preferences.
function computeLegend() {
    vis.selectAll("#legend").remove();

    makeColorLegend();
    makeSizeLegend();

    R = sizeData['R'];

    if (sizeType == "none" && colorType == "none") {
        return;
    };

    if (sizeKey == colorKey) {
        sizeData['legend'].forEach(function(d, i){
            vis.append("circle")
                .attr("id", "legend")
                .attr("r", r * d)
                .attr("cx", 5 + R)
                .attr("cy", 5 + R + 2.3 * R * i)
                .style("fill", colorWheel(colorData['legend'][i]))
                .style("stroke", d3.rgb(255, 255, 255));
        });

        sizeData['legendText'].forEach(function(d, i){
            vis.append("text")
                .attr("id", "legend")
                .text(d)
                .attr("x", 10 + 2 * R)
                .attr("y", 5 + R + 2.3 * R * i + 4)
                .attr("fill", "black")
                .attr("font-size", 12)
        });

        return;
    }

    if (sizeType != "none") {
        sizeData['legend'].forEach(function(d, i){
            vis.append("circle")
                .attr("id","legend")
                .attr("r",r*d)
                .attr("cx", 5+R)
                .attr("cy", 5+R+2.3*R*i)
                .style("fill",d3.rgb(0,0,0))
                .style("stroke",d3.rgb(255,255,255));
        });
        sizeData['legendText'].forEach(function(d, i){
            vis.append("text")
                .attr("id","legend")
                .text(d)
                .attr("x", 10+2*R)
                .attr("y", 5+R+2.3*R*i+4)
                .attr("fill","black")
                .attr("font-size",12)
        });
    }

    if (colorType != "none") {
        colorData['legend'].forEach(function(d, i){
            vis.append("circle")
                .attr("id","legend")
                .attr("r",5)
                .attr("cx", 5+Math.max(R,5))
                .attr("cy", 5+5+2*R+2.3*R*(sizeData['legend'].length-1)+5+2.3*5*i)
                .style("fill",colorWheel(colorData['legend'][i]))
                .style("stroke",d3.rgb(255,255,255));
        });
        colorData['legendText'].forEach(function(d, i) {
            vis.append("text")
                .attr("id", "legend")
                .text(d)
                .attr("x", 10+Math.max(R,5)+5)
                .attr("y", 5+5+2*R+2.3*R*(sizeData['legend'].length-1)+5+2.3*5*i+4)
                .attr("fill","black")
                .attr("font-size",12)
        });
    }
}

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

// This function does the initial draw.
// It starts from the Links, then does the Nodes. 
// Finally, it starts the force using force.start()
function draw() {
    drawLinks();

    // Nodes
    if (isStartup) {
        drawNodes();
    }

    force.start();
    isStartup = 0;
}

function drawLinks() {
    link = link.data(force.links());

    link.enter()
        .insert("line", ".node")
        .attr("class", "link")
        .attr("id", function(d, i) { 
            return "link_" + i; 
        })
        .style("stroke", d3.rgb(150,150,150))
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

function drawNodes() {
    node = node.data(force.nodes());
    node.enter()
        .insert("circle")
        .attr("class", "node")
        .attr("r", r)
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

    var isChecked = "unchecked";
    if (display.freezeNodeMovement) {
        isChecked = "checked";
        toggleFreezeNodes(true);
    }

    freezeNodesToggle.append("input")
        .attr("id", "freezeNodesToggle")
        .attr("type", "checkbox")
        .attr(isChecked, "")
        .attr("onchange", "toggleFreezeNodes(this.checked)");

}
function writeSaveAsSVGButton(parent) {
    var saveAsSVGButton = parent.append("div")
        .attr("id", "saveAsSVGButton")
        .text("Save SVG ");

    saveAsSVGButton.append("input")
        .attr("id", "saveSVGButton")
        .attr("type", "button")
        .attr("value", "Save")
        .on("click", writeDownloadLink);
}
function writeDropJSONArea() {
    var dropJSONArea = d3.select("#chart")
        .append("div")
        .attr("id","dropJSONArea")
        .html("drop webweb json here");

    d3.select("#chart")
        .style("border", "1.5px dashed")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("text-align", "center")
        .style("color", "#bbb");


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

// called when we load a json file and need to rebuild the networkSelectMenu.
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
    for (var label in sizeLabels) {
        sizeLabelStrings.push(label);
    }

    sizeSelect.selectAll("option")
        .data(sizeLabelStrings)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    if (sizeLabels[sizeKey] == undefined || sizeKey == undefined) {
        sizeKey = "none";
    }

    sizeSelect = document.getElementById('sizeSelect');
    sizeSelect.value = sizeKey;
    changeSizes(sizeKey);
}

function writeColorMenu(parent) {
    var colorMenu = parent.append("div")
        .attr("id","colorMenu")
        .text("Compute node color from ");

    colorMenu.append("select")
        .attr("id","colorSelect")
        .attr("onchange","changeColors(this.value)");
}
function updateColorMenu() {
    var colorSelect = d3.select("#colorSelect");

    colorSelect.selectAll("option").remove();

    var colorLabelStrings = [];
    for (var label in colorLabels) {
        colorLabelStrings.push(label);
    }

    colorSelect.selectAll("option")
        .data(colorLabelStrings)
        .enter()
        .append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});

    if (colorLabels[colorKey] == undefined || colorKey == undefined) {
        colorKey = "none";
    }

    colorSelect = document.getElementById('colorSelect');
    colorSelect.value = colorKey;
    changeColors(colorKey);
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
function getColorPalateName() {
    colorPalateMenuSelect = document.getElementById('colorPalateMenuSelect');
    return colorPalateMenuSelect.value;
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
        .attr("value",force.linkStrength())
        .attr("size",3);
}
function writeGravityWidget(parent) {
    var gravityWidget = parent.append("div")
        .attr("id", "gravityWidget")
        .text("Gravity: ");

    gravityWidget.append("input")
        .attr("id","gravityText")
        .attr("type","text")
        .attr("onchange","changeGravity(this.value)")
        .attr("value",force.gravity())
        .attr("size",3);
}
function writeRadiusWidget(parent) {
    var radiusWidget = parent.append("div")
        .attr("id", "radiusWidget")
        .text("Node r: ");

    radiusWidget.append("input")
        .attr("id","rText")
        .attr("type", "text")
        .attr("onchange","changer(this.value)")
        .attr("value", r)
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
    writeSaveAsSVGButton(leftMenu);
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

/*
* File interaction code
* This code handles the dragging and dropping of files
* as well as the saving of SVG
*/ 
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

    var files = evt.dataTransfer.files; // FileList object.

    var text = d3.select("#menuL9")

    text.html(function() {
        return "Loading " + files[0].name + "...";
    });

    setTimeout(function() {
        text.html("drop webweb json here")
    }, 2000);

    readJSON(files);
}
// Theoretically, multiple files could have been dropped above.
// Those files are passed into readJSON
// Only the first file is used. 
function readJSON(files, method) {
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
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            var json_string = evt.target.result;
            json_string = json_string.replace("var wwdata = ", "");
            wwdata = JSON.parse(json_string);
            updateVis(wwdata);
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}

// Blob is used to do the SVG save. 
function writeDownloadLink(){
    try {
        var isFileSaverSupported = !!new Blob();
    } catch (e) {
        alert("blob not supported");
    }
    // grab the svg, call it display.networkName, and save it.

    var html = d3.select("svg")
        .attr("title", display.networkName)
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;
    var blob = new Blob([html], {type: "image/svg+xml"});
    saveAs(blob, display.networkName);
};


/* Helper functions */
function identity(d) {
    return d;
}
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
// loads the labels up from the places they could come from:
// 1. the defaults (none, degree)
// 2. the display parameters
// 3. the network itself
//
// Priority is given to the network's labels, then display, then defaults
////////////////////////////////////////////////////////////////////////////////
function setLabels() {
    var all_labels = {
        'none' : {},
        'degree' : {},
    };

    if (display.labels !== undefined) {
        var display_labels = display.labels;
        for (var label in display_labels) {
            all_labels[label] = display_labels[label];
        }
    }

    var networkData = wwdata.network[display.networkName];
    if (networkData !== undefined && networkData.labels !== undefined) {
        var network_labels = networkData.labels;
        for (var label in network_labels) {
            all_labels[label] = network_labels[label];
        }
    }
    sizeLabels = {};
    colorLabels = {};
    for (label in all_labels) {
        if (all_labels[label].type !== "categorical") {
            sizeLabels[label] = all_labels[label];
        }
        colorLabels[label] = all_labels[label];
    }
}
////////////////////////////////////////////////////////////////////////////////
// This function is poorly named. It:
// - makes the svg
// - makes a node and link selector
// - scales stuff
// - initializes some colors
//
// Parameters currently passed through:
// - N
// - w, h, c, l, r, g
// - colorBy --> colorKey
// - sizeBy --> sizeKey
// - scaleLinkOpacity
// - scaleLinkWidth
// - freezeNodeMovement
////////////////////////////////////////////////////////////////////////////////
function initializeNetwork() {
    N = wwdata.display.N;
    
    networkNames = Object.keys(wwdata.network);

    displayDefaults['networkName'] = networkNames[0];

    display = wwdata.display;
    for (var key in displayDefaults) {
        if (display[key] == undefined) {
            display[key] = displayDefaults[key];
        }
    }

    if (wwdata.display.c !== undefined){c = wwdata.display.c;}
    if (wwdata.display.l !== undefined){l = wwdata.display.l;}
    if (wwdata.display.r !== undefined){r = wwdata.display.r;}
    if (wwdata.display.g !== undefined){g = wwdata.display.g;}

    colorKey = display.colorBy;
    sizeKey = display.sizeBy;

    var title = "webweb";
    if (display.name !== undefined) {
        title = title + " - " + display.name;
    }

    d3.select("title").text(title);

    links = [];
    nodes = [];
    colors = [];
    nameToMatch = "";
    R = 0;
    isHighlightText = true;

    for (var i = 0; i < N; i++) {
        colors[i] = d3.rgb(100, 100, 100); 
        colorData['rawValues'][i] = 1;
    }

    isStartup = 1;

    // Define nodes
    for (var i = 0; i < N; i++) {
        nodes.push({
            "idx" : i,
            "weight" : 0,
            "name" : display.nodeNames !== undefined ? display.nodeNames[i] : undefined,
        });
    }

    vis = d3.select("#svg_div")
        .append("svg")
        .attr("width", display.w)
        .attr("height", display.h)
        .attr("id", "vis");

    node = vis.selectAll(".node");
    link = vis.selectAll(".link");
    force = d3.layout.force()
        .links(links)
        .nodes(nodes)
        .charge(-c)
        .gravity(g)
        .linkDistance(l)
        .size([display.w, display.h])
        .on("tick", tick);

    scaleSize = d3.scale.linear().range([1,1]);
    scaleColorScalar = d3.scale.linear().range([1,1]);
    scaleColorCategory = d3.scale.ordinal().range([1,1]);
    scaleLink = d3.scale.linear().range([1,1]);
    scaleLinkOpacity = d3.scale.linear().range([0.4,0.9]);
}

// updateVis is called whenever we drag a file in
// It's the update version of initializeVis
function updateVis(wwdata) {
    // remove the SVG; it will be recreated below
    d3.select("#vis").remove();

    initializeNetwork();
    updateNetworkSelectMenu();
    computeLinks();
}

// Initialize the actual viz by putting all the pieces above together.
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

    initializeNetwork();
    writeMenus(menu);
    computeLinks();
}

window.onload = function() {
    initializeVis();
};
