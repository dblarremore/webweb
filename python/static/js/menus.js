var networkConstructor = {
    "network_id"            : "my network",
    "num_nodes"            : 100,
    "connection_factor"    : 1.01
};

var request_form_display = false;

function initMenuDOM() {

    var row_size = 12 / 3;
    var row_size_string = "col-xs-" + row_size.toString();

    var menu = d3.select("#center").append("div")
        .attr("id", "menu")
        .attr("class", "container");

    var menu_row = menu.append("div")
        .attr("id", "menu_row")
        .attr("class", "row");


    // Setup left menu
    var menuL = menu_row.append("div")
        .attr("id", "menuL")
        .attr("class", row_size_string);

    menuL.append("div")
        .attr("id", "menuLeft_header")
        .append("h1")
        .html("Networks");

    menuL.append("div").attr("id","menuA").attr("class", "menu_row");
    menuL.append("div").attr("id","menuB").attr("class", "menu_row");
    menuL.append("div").attr("id","menuC").attr("class", "menu_row");
    menuL.append("div").attr("id","menuC2").attr("class", "menu_row");


    // Setup Center Left Menu
    menu_row.append("div")
        .attr("id", "menuCenterLeft")
        .attr("class", row_size_string);

    if (network_creator) {
        // Setup Center Right Menu
        menu_row.append("div")
            .attr("id", "menuCenterRight")
            .attr("class", row_size_string);
    }

    // Setup right menu
    var menuR = menu_row.append("div")
        .attr("id","menuR")
        .attr("class", row_size_string)
        .attr("style","text-align:right");

    menuR.append("div")
        .attr("id", "menuLeft_header")
        .append("h1")
        .html("Network Parameters");

    // Setup svg overlay menu
    var menu_overlay = d3.select("#center").append("div")
        .attr("id", "menu_overlay")
        .attr("class", "container");

    var menu_overlay_row = menu_overlay.append("div")
        .attr("id", "menu_overlay_row")
        .attr("class", "row");

    var menuSVGOveraly = menu_overlay_row.append("div")
        .attr("id","menuSVGOveraly")
        .attr("class", "col-xs-4");

    menuSVGOveraly.append("div")
        .attr("id", "menuSVGOverlay_header")
        .append("h1")
        .html("SVG Overlay");
}

function writeMenus() {
    writeMenuLeft();
    writeMenuRight();
    writeMenuSVGOverlay();
}



/*
 * Menus
 */
function writeMenuLeft() {

    writeMenuA();

    var menuL = d3.select("#menuL");

    var menuL4 = menuL.append("div").attr("id","menuL4").attr("class", "menu_row");
    var menuL5 = menuL.append("div").attr("id","menuL5").attr("class", "menu_row");
    var menuL6 = menuL.append("div").attr("id","menuL6").attr("class", "menu_row");
    var menuL6B = menuL.append("div").attr("id","menuL6B").attr("class", "menu_row");

    menuL4.text("Scale link width ");
    var linkWidthCheck = menuL4.append("input")
        .attr("id", "linkWidthCheck")
        .attr("class", "floatRight")
        .attr("type", "checkbox")
        .attr("onchange", "toggleLinkWidth(this)");

    menuL5.text("Scale link opacity ");
    var linkOpacityCheck = menuL5.append("input")
        .attr("id", "linkOpacityCheck")
        .attr("class", "floatRight")
        .attr("type", "checkbox")
        .attr("checked", "")
        .attr("onchange", "toggleLinkOpacity(this)");

    menuL6.text("Allow nodes to move");
    var nodesMoveCheck = menuL6.append("input")
        .attr("id", "onoffSelect")
        .attr("class", "floatRight")
        .attr("type", "checkbox")
        .attr("checked", "")
        .attr("onchange", "toggleDynamics(this)");

    menuL6B.text("Allow zoom");
    var nodesMoveCheck = menuL6B.append("input")
        .attr("id", "zoomSelect")
        .attr("class", "floatRight")
        .attr("type", "checkbox")
        .attr("checked", function() {
            return zoom_on;
        })
        .on("change", toggleZoom);
}

function writeMenuSVGOverlay() {

    var menuO = d3.select("#menuSVGOveraly");

    var menuO1 = menuO.append("div").attr("id","menuO1").attr("class", "menu_row");
    var menuO2 = menuO.append("div").attr("id","menuO2").attr("class", "menu_row");
    var menuO3 = menuO.append("div").attr("id","menuO3").attr("class", "menu_row");
    var menuO4 = menuO.append("div").attr("id","menuO4").attr("class", "menu_row");

    menuO1.text("Save SVG");
    var saveSVGButton = menuO1.append("input")
        .attr("id", "saveSVGButton")
        .attr("class", "floatRight")
        .attr("type", "button")
        .attr("value", "Save SVG")
        .on("click", writeDownloadLink);

    menuO2.text("Save JSON");
    var saveJSONButton = menuO2.append("input")
        .attr("id", "save_json_files")
        .attr("class", "floatRight")
        .attr("type", "button")
        .attr("value", "Save JSON")
        .on("click", save_JSON);

    menuO3.text("Load JSON");
    var loadJSONButton = menuO3.append("input")
        .attr("type", "file")
        .attr("id", "json_files")
        .attr("class", "floatRight")
        .attr("name", "uploadJSON")
        .attr("accept", ".json")
        .on("change", read_JSON);

    // Setup the dnd listeners.
    d3.select("#chart")
        .style("border", "2px dashed")
        .style("border-radius", "5px")
        .style("padding", "25px")
        .style("text-align", "center")
        .style("color", "#bbb");


    var dropZone = document.getElementById('chart');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', read_JSON_drop, false);


    menuO4.text("New Feature Request");
    var saveSVGButton = menuO4.append("input")
        .attr("id", "request_feature_button")
        .attr("class", "floatRight")
        .attr("type", "button")
        .attr("value", "Request New Feature")
        .on("click", function() {
            request_form_display = !request_form_display

            if (request_form_display) {
                openFeatureRequestForm();
            }
            else {
                closeFeatureRequestForm();
            }
        });
}


function writeMenuA() {
    var menuA = d3.select("#menuA");

    menuA.text("Display data from ");
    menuA.append("select")
        .attr("id", "netSelect")
        .attr("class", "floatRight")
        .attr("onchange", "computeLinks(this.value)")
        .selectAll("option.netSelect")
        .data(netNames).enter()
        .append("option")
        .attr("class", "netSelect")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });
}
function writeMenuB() {
    var menuB = d3.select("#menuB");

    menuB.text("Compute node size from ");
    menuB.append("select")
        .attr("id", "sizeSelect")
        .attr("class", "floatRight")
        .attr("onchange", "changeSizes(this.value)")
        .selectAll("option")
        .data(nodeSizeLabels).enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });
}
function writeMenuC() {
    var menuC = d3.select("#menuC");
    menuC.text("Compute node color from ");
    menuC.append("select")
        .attr("id", "colorSelect")
        .attr("class", "floatRight")
        .attr("onchange", "changeColors(this.value)")
        .selectAll("option")
        .data(nodeColorLabels).enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    var color_options = Object.keys(colorbrewer);
    var menuC2 = d3.select("#menuC2");
    menuC2.text("Color options ");
    menuC2.append("select")
        .attr("id", "colorSelect")
        .attr("class", "floatRight")
        .on("input", changeColorScheme)
        .selectAll("option")
        .data(color_options).enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });
}



function changeNetworkName(new_network_name) {
    networkConstructor["network_id"] = new_network_name;
}

function changeConnectionFactor(new_connection_factor) {
    if ( new_connection_factor >= 0 ) {
        networkConstructor["connection_factor"] = parseFloat(new_connection_factor);
    }
    else {
        alert("Connection factor must be nonnegative.");
    }
}

function changeNumNodes(new_num_nodes) {
    if ( new_num_nodes >= 1 ) {
        networkConstructor["num_nodes"] = parseInt(new_num_nodes);
    }
    else {
        alert("Number of nodes must be nonnegative.");
    }
}


function writeMenuRight() {
    d3.select("#menuR_subdiv").remove();

    var menuR = d3.select("#menuR");

    var menuR_subdiv = menuR.append("div").attr("id", "menuR_subdiv");

    var menuR1 = menuR_subdiv.append("div").attr("id","menuR1").attr("class", "menu_row_right");
    var menuR2 = menuR_subdiv.append("div").attr("id","menuR2").attr("class", "menu_row_right");
    var menuR2B = menuR_subdiv.append("div").attr("id","menuR2B").attr("class", "menu_row_right");
    var menuR3 = menuR_subdiv.append("div").attr("id","menuR3").attr("class", "menu_row_right");
    var menuR4 = menuR_subdiv.append("div").attr("id","menuR4").attr("class", "menu_row_right");
    var zoom_menu = menuR_subdiv.append("div").attr("id","zoom_menu").attr("class", "menu_row_right");
    var menuR6 = menuR_subdiv.append("div").attr("id","menuR6").attr("class", "menu_row_right");

    menuR1.append("div").attr("class", "div_text_right").text("Node charge: ");
    menuR1.append("div").attr("id", "menuR1input").append("input")
        .attr("id", "chargeText")
        .attr("type", "text")
        .attr("onchange", "changeCharge(this.value)")
        .attr("value", -force.charge())
        .attr("size", 3);

    menuR2.append("div").attr("class", "div_text_right").text("Link length: ");
    menuR2.append("div").attr("id", "menuR2input").append("input")
        .attr("id", "distanceText")
        .attr("type", "text")
        .attr("onchange", "changeDistance(this.value)")
        .attr("value", force.distance())
        .attr("size", 3);

    menuR2B.append("div").attr("class", "div_text_right").text("Link strength: ");
    menuR2B.append("div").attr("id", "menuR2Binput").append("input")
        .attr("id", "linkStrengthText")
        .attr("type", "text")
        .attr("onchange", "changeLinkStrength(this.value)")
        .attr("value", force.linkStrength())
        .attr("size", 3);

    menuR3.append("div").attr("class", "div_text_right").text("Gravity: ");
    menuR3.append("div").attr("id", "menuR3input").append("input")
        .attr("id", "gravityText")
        .attr("type", "text")
        .attr("onchange", "changeGravity(this.value)")
        .attr("value", force.gravity())
        .attr("size", 3);

    menuR4.append("div").attr("class", "div_text_right").text("Node r: ");
    menuR4.append("div").attr("id", "menuR4input").append("input")
        .attr("id", "rText")
        .attr("type", "text")
        .attr("onchange", "changeNodeRadius(this.value)")
        .attr("value", network_node_r)
        .attr("size", 3);

    zoom_menu.append("div").attr("class", "div_text_right").text("Zoom Level ");
    zoom_menu.append("div").attr("id", "zoom_menuinput").append("input")
        .attr("id", "zoom_level_text")
        .attr("type", "text")
        .attr("size", 3)
        .attr("value", zoom.scale())
        .on("change", function() {
            var new_val = parseFloat(this.value);
            current_network.display.zoom = new_val;
        });

    menuR6.append("div").attr("class", "div_text_right").text("Highlight nodes whose name matches ");
    menuR6.append("div").attr("id", "menuR6input").append("input")
        .attr("id", "matchText")
        .attr("type", "text")
        .attr("onchange", "matchNodes(this.value)")
        .attr("size", 3);
}



function updateMenuA() {
    var netSelect = d3.select("#netSelect");

    netSelect.selectAll("option").remove();

    netSelect.selectAll("option")
        .data(netNames).enter()
        .append("option")
        .attr("value",function(d) { return d; })
        .text(function(d) { return d; });
}
