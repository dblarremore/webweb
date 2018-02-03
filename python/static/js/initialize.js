/*
 * webweb makes pretty interactive network diagrams in your browser
 * version 3.3
 *
 * Daniel Larremore, Michael Iuzzolino
 * February 2nd, 2018
 * daniel.larremore@gmail.com
 * http://danlarremore.com
 * michael.iuzzolino@colorado.edu
 * michael-iuzzolino.github.io
 *
 * Comments and suggestions always welcome.
 *
 */

var num_examples;
var examples_list = [];
var current_network;

var WIDTH_DEFAULT = 600;
var HEIGHT_DEFAULT = 600;
var CHARGE_DEFAULT = 60;
var GRAVITY_DEFAULT = 0.1;
var L_DEFAULT = 20;
var R_DEFAULT = 5;

var network_width = WIDTH_DEFAULT;
var network_height = HEIGHT_DEFAULT;
var network_charge = CHARGE_DEFAULT;
var network_gravity = GRAVITY_DEFAULT;
var network_link_distance = L_DEFAULT;
var network_node_r = R_DEFAULT;
var current_color_scheme = "Set1";
var color_key_legend;
var unclassified_color = "#C8C8C8";

var nodeSizeLabelsBase = ["none", "degree"];
var nodeColorLabelsBase = ["none", "degree"];

var network_creator = false;

// set up the DOM
var netNames;
var N;
var links = [];
var nodes = [];
var node, force;

var scaleSize, scaleColorScalar, scaleColorCategory;
var scaleLink, scaleLinkOpacity;

var colorType, sizeType, colorKey, sizeKey;
var rawColors, rawSizes, sizes, degrees, colors, sizesLegend, colorsLegend, cats, catNames;
var nameToMatch, R, isHighlightText;

var isStartup, isOpacity;
var netName;
var colorbrewer;

var min_zoom = 0.1;
var max_zoom = 7;
var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]);
var zoom_off = d3.behavior.zoom();
var zoom_on = true;

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.

    d3.select("#chart")
        .style("border", "5px dashed")
        .style("border-radius", "10px")
        .style("color", "#fbb")
        .transition().duration(500)
        .style("border", "2px dashed")
        .style("border-radius", "5px")
        .style("color", "#bbb");
}

function read_JSON_drop(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    var text = d3.select("#menuL9");

    text.html(function() {
        return "Loading " + files[0].name + "...";
    });

    setTimeout(function() {
        text.html("Drop files here")
    }, 2000);

    console.log("FILES");
    console.log(files);

    read_JSON(files);
}

function save_JSON() {
    var content = "test";
    uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(current_network));
    newWindow = window.open(uriContent, 'neuesDokument');
}

function read_JSON(files, method) {
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
        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
            var json_string = evt.target.result;
            json_string = json_string.replace("var current_network = ", "");
            current_network = JSON.parse(json_string);
            updateVis();
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}

function writeDownloadLink(){
    try {
        var isFileSaverSupported = !!new Blob();
    } catch (e) {
        alert("blob not supported");
    }

    var html = d3.select("svg")
        .attr("title", "test2")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    var blob = new Blob([html], {type: "image/svg+xml"});
    var save_filename = prompt("Enter filename");
    saveAs(blob, save_filename);
}

function updateVis() {

    // Clear previous visualization
    d3.select("#vis").remove();

    var i;

    network_width = (current_network.display.width !== undefined) ? current_network.display.width : WIDTH_DEFAULT;
    network_height = (current_network.display.height !== undefined) ? current_network.display.height : HEIGHT_DEFAULT;
    network_charge = (current_network.display.charge !== undefined) ? current_network.display.charge : CHARGE_DEFAULT;
    network_gravity = (current_network.display.gravity !== undefined) ? current_network.display.gravity : GRAVITY_DEFAULT;
    network_link_distance = (current_network.display.l !== undefined) ? current_network.display.l : L_DEFAULT;
    network_node_r = (current_network.display.r !== undefined) ? current_network.display.r : R_DEFAULT;


    createNetwork();
    resetVariables();

    for (i=0; i<N; i++) {
        colors[i] = d3.rgb(100,100,100); rawColors[i] = 1;
    }

    updateMenuA();
    writeMenuRight();
    computeLinks(netNames[0]);
}




function initializeVis() {

    var i;

    createNetwork();

    // Set Scales
    setScales();

    // Reset variables
    resetNetworkVisOptions();
    resetVariables();

    for (i=0; i<N; i++) {
        colors[i] = d3.rgb(100,100,100); rawColors[i] = 1;
    }

    writeMenus(); // located in menus.js
    loadColors();
    computeLinks(netNames[0]);
}

function createNetwork() {

    var i;
    netNames = Object.keys(current_network.network);
    netLabels = Object.keys(current_network.display.labels);

    for (i in netLabels) {
        if (current_network.display.labels[netLabels[i]].type === "categorical") {
            nodeColorLabelsBase.push(" " + netLabels[i]);
        }
        else {
            nodeSizeLabelsBase.push(" " + netLabels[i]);
            nodeColorLabelsBase.push(" " + netLabels[i]);
        }
    }

    N = current_network.display.N;
    links = [];
    nodes = [];
    // Define nodes
    for (i=0; i<N; i++) {
        nodes.push({ "idx":i });
    }

    if (current_network.display.nodeNames !== undefined){
        for (i in nodes) {
            nodes[i]["name"] = current_network.display.nodeNames[i];
        }
    }

    if (current_network.display.name !== undefined) {
        d3.select("title").text("webweb - " + current_network.display.name);
    }
    else {
        d3.select("title").text("webweb");
    }

    var svg = d3.select("#chart").append("div")
        .attr("id", "svg_div").append("svg")
        .attr("id", "vis")
        .attr("width", network_width)
        .attr("height", network_height);

    vis = svg.append("g").attr("id","vis_g");

    var title = svg.append("text")
        .attr("id", "partition_type_label")
        .attr("y", 20)
        .style("fill", "black")
        .text("Partition Type")
        .style("opacity", 0.0);

    node = vis.selectAll(".node");
    link = vis.selectAll(".link");
    force = d3.layout.force()
        .links(links)
        .nodes(nodes)
        .charge(-network_charge)
        .gravity(network_gravity)
        .linkDistance(network_link_distance)
        .size([network_width, network_height])
        .on("tick",tick);

    zoom.on("zoom", function() {
        vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        var zoom_level = zoom.scale();
        // Update zoom display
        d3.select("#zoom_level_text").attr("value", zoom_level);
    });

    svg.call(zoom);

    // Update current network with zoom level
    current_network.display.zoom = zoom.scale();

    d3.selectAll(".node").on('mousedown.zoom', null);
}




function setScales() {
    scaleSize = d3.scale.linear().range([1,1]);
    scaleColorScalar = d3.scale.linear().range([1,1]);
    scaleColorCategory = d3.scale.ordinal().range([1,1]);
    scaleLink = d3.scale.linear().range([1,1]);
    scaleLinkOpacity = d3.scale.linear().range([0.4,0.9]);
}

function openFeatureRequestForm() {
    d3.select("#request_form_div").transition().duration(1300).style("opacity", 1.0);
    d3.select("#request_feature_button").attr('value', "Close New Feature Request");
}

function closeFeatureRequestForm() {
    d3.select("#request_form_div").transition().duration(750).style("opacity", 0.0);
    d3.select("#request_feature_button").attr('value', "Request New Feature");
}

function addFeatureRequestForm() {
    var schema = {
        fields: [
            {name: 'first_name', type: 'text', display: 'First Name'},
            {name: 'last_name', type: 'text', display: 'Last Name'},
            {name: 'feature_request', type: 'textarea', display: 'Feature Request', rows: "4", cols: "20"}
        ]
    };

    // TODO: Add mail-to reference for offline / local development
    // TODO: check to see if able to detect if running on local server
    // TODO: Put php message on div rather than new window?
    var request_form_div = d3.select("body").append("div").attr("id", "request_form_div").attr("class", "container");

    request_form_div.append("a")
        .attr("href", "mailto:michael.iuzzolino@colorado.edu,daniel.larremore@colorado.edu?Subject=WebWeb_Feature_Request")
        .attr("target", "_top")
        .on("click", function() {
            closeFeatureRequestForm();
        })
        .append("div")
        .attr("id", "email_feature_request")
        .append("p")
        .html("Email Us with Feature Request");
}

function sendEmail() {$.get('email.php');}

function initializeDOM() {
    var center = d3.select("body").append("div").attr("id", "center");
    initMenuDOM();  // located in menus.js
    center.append("div").attr("id","chart").attr("style","clear:both");
}


function resetNetworkVisOptions() {
    colorType = "none";
    sizeType = "none";
    colorKey = "none";
    sizeKey = "none";
    rawColors = [];
    rawSizes = [];
    sizes = [];
    degrees = [];
    colors = [];
    sizesLegend = [];
    colorsLegend = [];
}

function resetVariables() {
    cats = [];
    catNames = [];
    nameToMatch = "";
    R=0;
    isHighlightText=true;
    isStartup = 1;
    isOpacity = 1;
}

function checkCDN(callBack) {
    var head = document.getElementsByTagName('head')[0];
    var js = document.createElement("script");
    var css = document.createElement("link");
    var css3 = document.createElement("link");
    var online = navigator.onLine;

    js.type = "text/javascript";
    css.rel = "stylesheet";
    css3.rel = "stylesheet";
    css3.href = "static/css/style.css";
    head.appendChild(css3);

    if (online) {
        console.log("Online Mode");
        js.src = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js";
        css.href = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
    }
    else {
        console.log("Offline Mode");
        js.src = "static/js/lib//bootstrap.min.js";
        css.href = "static/css/bootstrap.min.css";

        var css2 = document.createElement("link");
        css2.rel = "stylesheet";
        css2.href = "static/css/bootstrap-theme.min.css";
        head.appendChild(css2);
    }

    head.appendChild(js);
    head.appendChild(css);

    return callBack(true);
}

$(function() {
    checkCDN(function(callBack) {
        if (callBack === true) {
            initializeDOM();
            initializeVis();
            addFeatureRequestForm();
        }
        else {
            console.log("Fail to load.");
        }
    });
});
