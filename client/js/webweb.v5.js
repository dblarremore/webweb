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
// import { colorbrewer } from './colors'
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
function displayNetwork() {
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
function SaveSVG(title) {
  html = getSVGHTML()
  saveIt(title, "image/svg+xml", html);
this.settings.networkName, "image/svg+xml", html
}
function getSVGHTML(){
    var svg = drawSVG();
    svg.setAttribute("title", webweb.display.networkName);
    svg.setAttribute("version", 1.1);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return svg.outerHTML;
}
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
window.onload = function() {
  let webweb = new Webweb(window.wwdata);
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
