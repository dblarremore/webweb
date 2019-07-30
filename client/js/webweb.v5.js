/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { Webweb } from './webweb.v6'
// import { Legend } from './legend'
import { colorbrewer } from './colors'
import { Blob } from 'blob-polyfill'
import { saveAs } from 'file-saver'
import * as d3 from 'd3'

// function Webweb(wwdata) {
//     this.legendNodes = []
//     this.legendText = []
// }
////////////////////////////////////////////////////////////////////////////////
// Webweb:
//
// UTIL
////////////////////////////////////////////////////////////////////////////////
Webweb.prototype.getSizeByType = function() {
    return this.allMetadata[this.display.sizeBy].type;
}
Webweb.prototype.getColorByType = function() {
    return this.allMetadata[this.display.colorBy].type;
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
    webweb = new Webweb(window.wwdata);

    // writeMenus()
    displayNetwork();
}
////////////////////////////////////////////////////////////////////////////////
// - changes the number of visible nodes
// - adds metadata to nodes
// - computes links
// - draws links
// - uses the force (luke)
////////////////////////////////////////////////////////////////////////////////
function displayNetwork() {
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
    changeLayer(0);
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
    var range = checked ? [0.5, 2] : [1, 1];
    webweb.display.scaleLinkWidth = checked;
    webweb.scales.links.width.range(range);
    webweb.canvas.redraw();
}
function toggleLinkOpacityScaling(checked) {
    var range = checked ? [0.3, 0.9] : [1, 1];
    webweb.display.scaleLinkOpacity = checked;
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

    var legendTypeToLegendMaker = {
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
    var valuesCount = this.values.length;
    this.text.forEach(function(d, i) {
        // only draw text for as many values as there are
        if (i < valuesCount) {
            var text = new Text(d, pushRight, pushDown(i) + 3.5, "12px");
            webweb.legendText.push(text);
        }
    });
}
Legend.prototype.drawLegendValues = function(pushDown, pushRight, sizeFunction, colorFunction) {
    var textCount = this.text.length;
    this.values.forEach(function(d, i){
        // only draw text for as many values as there are
        if (i < textCount) {
            var node = new Node(-1);
            node.fixedRadius = sizeFunction(d);
            node.x = pushRight;
            node.y = pushDown(i);
            node.__scaledColor = colorFunction(i);
            node.nonInteractive = true;

            webweb.legendNodes.push(node);
        }
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

    if (this.webweb.display.showLegend) {
        this.webweb.legendNodes.forEach(function(node) {
            node.draw(this.context);
        }, this);
        this.webweb.legendText.forEach(function(text) {
            text.draw(this.context);
        }, this);
    }
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

    if (window.wwdata.networks[webweb.display.networkName].layers.length == 1) {
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
    for (var i in window.wwdata.networks[webweb.display.networkName].layers) {
        layers.push(i);
    }

    var colorNames = Object.keys(colorbrewer);

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
            'showNodeNames' : {
                'text' : 'Show node names ',
                'type' : 'checkbox',
                'functions' : {
                    'input' : toggleShowNodeNames,
                },
                'value' : webweb.display.showNodeNames,
                'size' : 10,
            },
            'nameToMatch' : {
                'text' : 'Highlight nodes named: ',
                'functions' : {
                    'input' : matchNodesNamed,
                },
                'value' : webweb.display.nameToMatch,
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
function getSVGHTML(){
    var svg = drawSVG();
    svg.setAttribute("title", webweb.display.networkName);
    svg.setAttribute("version", 1.1);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return svg.outerHTML;
}
function writeSVGDownloadLink() {
    html = getSVGHTML();
    saveIt(webweb.display.networkName, "image/svg+xml", html);
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

    if (webweb.display.showLegend) {
        webweb.legendNodes.forEach(function(node) {
            svg.appendChild(node.drawSVG());
        });
        webweb.legendText.forEach(function(text) {
            svg.appendChild(text.drawSVG());
        });
    }

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
    for (var i in vals) {
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
        if (0 <= changeToLayer && changeToLayer < window.wwdata.networks[webweb.display.networkName].layers.length) {
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
    const listeners = {
        37 : changeNetworkLayerListener,
        38 : changeNetworkListener,
        39 : changeNetworkLayerListener,
        40 : changeNetworkListener,
    };

    if (event.keyCode in listeners) {
        listeners[event.keyCode](event);
    }
});
