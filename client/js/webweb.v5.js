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
import { Blob } from 'blob-polyfill'
import { saveAs } from 'file-saver'
import * as d3 from 'd3'

// function Webweb(wwdata) {
//     this.legendNodes = []
//     this.legendText = []
// }
function displayNetwork() {
    computeLegend();
}
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
  saveIt(title, "image/svg+xml", html)
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
  webweb.displayNetwork(webweb.networkName, webweb.state.global.settings)
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
})
