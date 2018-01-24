/*
 * webweb makes pretty interactive network diagrams in your browser
 * version 3.3
 *
 * Daniel Larremore
 * May 22, 2015
 * daniel.larremore@gmail.com
 * http://danlarremore.com
 * Comments and suggestions always welcome.
 *
 * READ webweb.m for MATLAB usage.
 *
 */
/*
 * Here are default values. If you don't put anything different in the JSON file, this is what you get!
 */
var w = 800,
h = 800,
c = 60,
l = 20,
r = 5,
g = 0.1;

var nodeSizeLabelsBase = ["none","degree"];
var nodeColorLabelsBase = ["none","degree"];

// set up the DOM
var center, menu, menuL, menuA, menuB, menuC, menuR, chart;
var netNames, newLabels;
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


/*
 * Dynamics and colors
 */
function tick() {
    link.attr("x1", function(d) {return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });
    node.attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
}
function removeLinks() {
    links.splice(0,links.length);
    draw();
}
function computeLinks(net) {
    netName = net;
    removeLinks();
    nodeSizeLabels = nodeSizeLabelsBase.slice(0);
    nodeColorLabels = nodeColorLabelsBase.slice(0);

    adj = d3.values(a["network"][netName]["adjList"]);
    scaleLink.domain(d3.extent(d3.transpose(adj)[2]));
    scaleLinkOpacity.domain(d3.extent(d3.transpose(adj)[2]));
    for (var i in adj) {links.push({source:adj[i][0],target:adj[i][1],w:adj[i][2]})}
    loadLabels = Object.keys(a.network[netName].labels);
    for (i in loadLabels) {
        if (a.network[netName].labels[loadLabels[i]].type=="categorical") {
            nodeColorLabels.push(loadLabels[i]);
        }
        else {
            nodeSizeLabels.push(loadLabels[i]);
            nodeColorLabels.push(loadLabels[i]);
        }
    }
    draw();

    writeMenuB();
    if (nodeSizeLabelsBase.indexOf(sizeKey) == -1){
        changeSizes("none");
    } else {
        changeSizes(sizeKey);
    }
    sizeSelect.selectedIndex = nodeSizeLabels.indexOf(sizeKey);

    writeMenuC();
    if (nodeColorLabelsBase.indexOf(colorKey) == -1){
        changeColors("none");
    } else {
        changeColors(colorKey);
    }
    colorSelect.selectedIndex = nodeColorLabels.indexOf(colorKey);
}
function computeSizes(x) {
    if (x=="none"){
        sizeType = "none";
        for (var i in nodes){sizes[i] = 1;}
    }
    else if (x=="degree"){
        sizeType = "degree";
        for (var i in nodes){
            degrees[i] = nodes[i].weight
            rawSizes[i] = Math.sqrt(degrees[i]);
        }
        scaleSize.domain(d3.extent(rawSizes),d3.max(rawSizes)).range([0.5,1.5]);
        for (var i in sizes){sizes[i] = scaleSize(rawSizes[i]);}
        rawSizes = degrees.slice(0);
    }
    else {
        if (x[0]==" "){
            x = x.slice(1);
            for (var i in nodes){sizes[i] = a.display.labels[x].value[i];}
            sizeType = a.display.labels[x].type;
        }
        else {
            for (var i in nodes){sizes[i] = a.network[netName].labels[x].value[i];}
            sizeType = a.network[netName].labels[x].type;
        }
        rawSizes = sizes.slice(0);
        scaleSize.domain(d3.extent(sizes),d3.max(sizes)).range([0.5,1.5]);
        for (var i in sizes){sizes[i] = scaleSize(sizes[i]);}
    }
}
function highlightNode(d) {
    d3.select("#node_" + d.idx)
    .transition().duration(100)
    .attr("r",sizes[d.idx]*r*1.3)
    .style("stroke",d3.rgb(0,0,0));
}
function highlightText(d) {
    if (d=="stop") {isHighlightText=false; return}
    else if (d=="start") {isHighlightText=true; return}
    if (isHighlightText){
        if (sizeType != "none" || colorType != "none") {pos=35};
        if (d.name==undefined) {
            textbit = vis.append("text").text("This is node " + d.idx + ".")
            .attr("x", d.x+1.5*r)
            .attr("y", d.y-1.5*r)
            .attr("fill", "black")
            .attr("font-size",12)
            .attr("id","highlightText");
        } else {
            textbit = vis.append("text").text("This is " + d.name + " (" + d.idx + ").")
            .attr("x", d.x+1.5*r)
            .attr("y", d.y-1.5*r)
            .attr("fill", "black")
            .attr("font-size",12)
            .attr("id","highlightText");
        }
    }
}
function unHighlightNode(d) {
    if (nameToMatch == "" || d.name.indexOf(nameToMatch) < 0) {
        d3.select("#node_" + d.idx)
        .transition()
        .attr("r",sizes[d.idx]*r)
        .style("stroke",d3.rgb(255,255,255));
    }
}
function unHighlightText() {
    vis.selectAll("#highlightText").remove();
}
function computeColors(x) {
    // no colors
    if (x=="none"){
        // no colors
        colorType = "none";
        // set all nodes to dark grey 100
        for (var i in nodes){colors[i] = d3.rgb(100,100,100);}
    }
    // by degree
    else if (x=="degree"){
        // we'll treat degree as a scalar
        colorType = x;
        // raw values are weights
        for (var i in nodes){
            rawColors[i] = nodes[i].weight;
        }
        // scaled values mapped to 0...1
        scaleColorScalar.domain(d3.extent(rawColors)).range([0,1]);
        // get colors by passing scaled value to colorWheel
        for (var i in nodes){colors[i] = colorWheel(nodes[i].weight);}
    }
    // by other label
    else {
        var y;
        if (x[0]==" "){
            x = x.slice(1);
            y = a.display.labels[x];
        }
        else {
            y = a.network[netName].labels[x];
        }

        for (var i in nodes){
            // Load raw values from the data structure
            rawColors[i] = y.value[i];
        }
        // Load the data type from the data structure
        colorType = y.type;
        catNames = [];
        cats = [];
        if (colorType=="categorical") {catNames = y.categories}
        if (catNames==undefined){
            var q = d3.set(rawColors).values();
            q.sort();
            catNames = [];
            for (i in q){
                cats[i] = q[i];
                catNames[i] = q[i]
            };
        }
        else
        {
            // Check to see if our cats are numeric or labels
            if (isNaN(d3.quantile(rawColors,0.25))){
                cats = catNames.sort();
            }
            else{
                for (i in catNames){
                    cats[i] = i;
                };
            }
        }

        // We think it's categorical...
        if (colorType == "categorical") {
            // but let's check because we can only have up to 9 categorical colors
            if (Object.keys(catNames).length <= 9) {
                // scaled values properly mapped using colorBrewer Set1
                scaleColorCategory.domain(cats).range(colorbrewer.Set1[Object.keys(catNames).length]);
                for (var i in nodes){
                    // get colors by passing categories to colorWheel
                    colors[i] = colorWheel(rawColors[i]);
                }
                console.log(cats,catNames);
            }
            else
            {
                // if we thought we had categories but we have too many, treat like scalars
                colorType = "scalarCategorical";
                // scaled values mapped to 0...1
                scaleColorScalar.domain(d3.extent(rawColors)).range([0,1]);
                for (var i in nodes){
                    // get colors by passing scalars to colorWheel
                    colors[i] = colorWheel(rawColors[i]);
                }
            }
        }
        else {
            // scaled values mapped to 0...1
            scaleColorScalar.domain(d3.extent(rawColors)).range([0,1]);
            for (var i in nodes){
                // get colors by passing scalars to colorWheel
                colors[i] = colorWheel(rawColors[i]);
            }
        }
    };
}
function colorWheel(x) {
    if (isNaN(x)) {
        if (colorType=="categorical" && typeof(x)=="string"){
            return scaleColorCategory(x);
        }
        else{
            return d3.rgb(180,180,180)};
    }
    if (colorType=="categorical") {
        return scaleColorCategory(x);
    }
    else if (colorType=="scalar" || colorType=="scalarCategorical" || colorType=="degree") {
        // Rainbow HSL
        return d3.hsl(210*(1-scaleColorScalar(x)),0.7,0.5);
        // Greyscale
        // return [0.8*255*x,0.8*255*x,0.8*255*x];
        // Copper
        // return [255*Math.min(x/0.75,1),0.78*255*x,0.5*255*x];
    }
    else if (colorType=="binary") {
        if (!x){return d3.rgb(30,100,180)}
        else {return d3.rgb(102,186,30)};
    }
}
/*
 * Menu interaction
 */
function changeSizes(x) {
    sizeKey = x;
    computeSizes(x);
    redrawNodes();
    computeLegend();
    if (nameToMatch != "") {matchNodes(nameToMatch)};
}
function changeColors(x) {
    colorKey = x;
    computeColors(x);
    redrawNodes();
    computeLegend();
    if (nameToMatch != "") {matchNodes(nameToMatch)};
}
function changeCharge(x) {
    if (x>=0) {
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
    if (x>=0) {
        force.linkDistance(x);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeLinkStrength(x) {
    if (x>=0) {
        force.linkStrength(x);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeGravity(x) {
    if (x>=0) {
        force.gravity(x);
        force.start();
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}
function toggleDynamics(x) {
    isDynamics = x.checked;
    if (!isDynamics)
    {
        force.stop();
        for (var i=0; i<force.nodes().length; i++)
        {
            force.nodes()[i].fixed=true;
        }
    }
    else
    {
        for (var i=0; i<force.nodes().length; i++)
        {
                force.nodes()[i].fixed=false;
        }
        node.call(force.drag)
        force.resume();
    }
}
function toggleLinkWidth(x) {
    if (x.checked) {
        scaleLink.range([0.5,4]);
    }
    else {
        scaleLink.range([1,1]);
    }
    redrawLinks();
}
function toggleLinkOpacity(x) {
    if (x.checked) {
        scaleLinkOpacity.range([0.4,0.9]);
    }
    else {
        scaleLinkOpacity.range([1,1]);
    }
    redrawLinks();
}
function matchNodes(x) {
    nameToMatch = x;
    if (x.length==0){
        nodes.forEach(function(d){unHighlightNode(d)});
    }
    else {
        nodes.forEach(function(d) {
                      if (d.name.indexOf(nameToMatch) < 0) {unHighlightNode(d);}
                      else {highlightNode(d)}
                      })
    }
}
/*
 * Drawing
 */
function redrawNodes() {
    nodes.forEach(function(d,i) {
                  d3.select("#node_" + d.idx)
                  .attr("r",sizes[i]*r)
                  .style("fill",d3.rgb(colors[i]));})
}
function redrawLinks() {
    links.forEach(function(d,i) {
                  d3.select("#link_" + i)
                  .transition()
                  .style("stroke-width",function(d){
                         if (d.w==0){return 0}
                         else {return scaleLink(d.w)}})
                  .style("stroke-opacity",function(d){
                         return scaleLinkOpacity(d.w)
                         });
                  })
}
function computeLegend() {
    colorsLegend = [];
    sizesLegend = [];
    sizesLegendText = [];
    R = 0;
    if (sizeType != "none" && r!=0 && r!="") {
        if (sizeType == "scalar" || sizeType == "degree") {
            // test for ints
            var isIntScalar=true,j=0;
            while (j<N && isIntScalar){isIntScalar=isInt(rawSizes[j]); j++;}
            // integer scalars
            if (isIntScalar) {
                var numInts = d3.max(rawSizes)-d3.min(rawSizes)+1;
                // <= 9 values
                if (numInts <= 9){
                    sizesLegend = d3.range(d3.min(rawSizes),d3.max(rawSizes)+1);
                }
                // > 9 values
                else
                {
                    lower = d3.min(rawSizes);
                    upper = d3.max(rawSizes);
                    bins = 4;
                    step = (upper-lower)/bins;
                    sizesLegend.push(lower);
                    for (var i=1; i<bins; i++) {sizesLegend.push(lower+i*step);}
                    sizesLegend.push(upper);
                }
            }
            // noninteger scalars
            else
            {
                lower = d3.min(rawSizes);
                upper = d3.max(rawSizes);
                bins = 4;
                step = (upper-lower)/bins;
                sizesLegend.push(rounddown(lower,10));
                for (var i=1; i<bins; i++) {sizesLegend.push(round(lower+i*step,10));}
                sizesLegend.push(roundup(upper,10));
            }
            sizesLegendText = sizesLegend.slice(0);
        }
        else if (sizeType == "binary") {
            sizesLegendText = ["false","true"];
            sizesLegend = [0,1];
        }
        if (sizeType == "degree"){
            for (var i in sizesLegend){
                sizesLegend[i] = scaleSize(Math.sqrt(sizesLegend[i]));
            }
        }
        else {
            for (var i in sizesLegend){
                sizesLegend[i] = scaleSize(sizesLegend[i]);
            }
        }
        R = r*d3.max(sizesLegend);
    }
    if (colorType != "none") {
        if (colorType == "categorical") {
            colorsLegend = scaleColorCategory.domain();
            colorsLegendText = d3.values(catNames);
        }
        else if (colorType == "binary") {
            colorsLegend = [0,1];
            colorsLegendText = ["false","true"];
        }
        else if (colorType == "scalar" || colorType == "degree") {
            // test for ints
            var isIntScalar=true,j=0;
            while (j<N && isIntScalar){isIntScalar=isInt(rawColors[j]); j++;}
            // integer scalars
            if (isIntScalar) {
                var numInts = d3.max(rawColors)-d3.min(rawColors)+1;
                // <= 9 values
                if (numInts <= 9){
                    colorsLegend = d3.range(d3.min(rawColors),d3.max(rawColors)+1);
                    colorsLegendText = colorsLegend.slice(0);
                }
                // > 9 values
                else
                {
                    lower = d3.min(rawColors);
                    upper = d3.max(rawColors);
                    bins = 4;
                    step = (upper-lower)/bins;
                    colorsLegend.push(lower);
                    for (var i=1; i<bins; i++) {colorsLegend.push(lower+i*step);}
                    colorsLegend.push(upper);
                    colorsLegendText = colorsLegend.slice(0);
                }
            }
            // noninteger scalars
            else
            {
                lower = d3.min(rawColors);
                upper = d3.max(rawColors);
                bins = 4;
                step = (upper-lower)/bins;
                colorsLegend.push(rounddown(lower,10));
                for (var i=1; i<bins; i++) {colorsLegend.push(round(lower+i*step,10));}
                colorsLegend.push(roundup(upper,10));
                colorsLegendText = colorsLegend.slice(0);
            }
        }
        else if (colorType == "scalarCategorical") {
            lower = d3.min(rawColors);
            upper = d3.max(rawColors);
            bins = 4;
            step = (upper-lower)/bins;
            colorsLegend.push(lower);
            for (var i=1; i<bins; i++) {colorsLegend.push(Math.round(lower+i*step));}
            colorsLegend.push(upper);
            colorsLegendText = colorsLegend.slice(0);
        }
    }
    drawLegend();
}
function drawLegend() {
    vis.selectAll("#legend").remove();
    if (sizeType == "none" && colorType=="none"){return;};
    if (sizeKey == colorKey) {
        sizesLegend.forEach(function(d,i){
                            vis.append("circle")
                            .attr("id","legend")
                            .attr("r",r*d)
                            .attr("cx", 5+R)
                            .attr("cy", 5+R+2.3*R*i)
                            .style("fill",colorWheel(colorsLegend[i]))
                            .style("stroke",d3.rgb(255,255,255));
                            });
        sizesLegendText.forEach(function(d,i){
                                vis.append("text")
                                .attr("id","legend")
                                .text(d)
                                .attr("x", 10+2*R)
                                .attr("y", 5+R+2.3*R*i+4)
                                .attr("fill","black")
                                .attr("font-size",12)
                                });
        return;
    }
    if (sizeType != "none") {
        sizesLegend.forEach(function(d,i){
                            vis.append("circle")
                            .attr("id","legend")
                            .attr("r",r*d)
                            .attr("cx", 5+R)
                            .attr("cy", 5+R+2.3*R*i)
                            .style("fill",d3.rgb(0,0,0))
                            .style("stroke",d3.rgb(255,255,255));
                            });
        sizesLegendText.forEach(function(d,i){
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
        colorsLegend.forEach(function(d,i){
                             vis.append("circle")
                             .attr("id","legend")
                             .attr("r",5)
                             .attr("cx", 5+Math.max(R,5))
                             .attr("cy", 5+5+2*R+2.3*R*(sizesLegend.length-1)+5+2.3*5*i)
                             .style("fill",colorWheel(colorsLegend[i]))
                             .style("stroke",d3.rgb(255,255,255));
                             });
        colorsLegendText.forEach(function(d,i){
                                 vis.append("text")
                                 .attr("id","legend")
                                 .text(d)
                                 .attr("x", 10+Math.max(R,5)+5)
                                 .attr("y", 5+5+2*R+2.3*R*(sizesLegend.length-1)+5+2.3*5*i+4)
                                 .attr("fill","black")
                                 .attr("font-size",12)
                                 });
    }
}
function draw() {
    //Links
    link = link.data(force.links());
    link.enter().insert("line",".node")
    .attr("class","link")
    .attr("id",function(d,i) {return "link_" + i})
    .style("stroke",d3.rgb(150,150,150))
    .style("stroke-width",function(d){
           if (d.w==0){return 0}
           else {return scaleLink(d.w)}})
    .style("stroke-opacity",function(d){
           return scaleLinkOpacity(d.w)
           });
    link.exit().remove();
    // Nodes
    if (isStartup) {
        node = node.data(force.nodes());
        node.enter().insert("circle")
        .attr("class","node")
        .attr("r", r)
        .attr("id",function(d) {return ("node_" + d.idx);})
        .style("fill",d3.rgb(255,255,255))
        .style("stroke",d3.rgb(255,255,255));
        node.exit().remove();
        node.on("mousedown", function(d) {unHighlightText(); highlightText("stop");});
        d3.select(window).on("mouseup",function(){highlightText("start");});
        node.on("click", function(d) {console.log(d);});
        node.on("mouseover",function (d) {highlightNode(d); highlightText(d);});
        node.on("mouseout",function(d) {unHighlightNode(d);unHighlightText();});
        node.call(force.drag);
        toggleDynamics(document.getElementById("onoffSelect"));
        isStartup = 0;
    }
    force.start();
}
/*
 * Menus
 */
function writeMenuL() {
    writeMenuA();

    var menuL4 = menuL.append("div").attr("id","menuL4");
    var menuL5 = menuL.append("div").attr("id","menuL5");
	var menuL6 = menuL.append("div").attr("id","menuL6");
    var menuL7 = menuL.append("div").attr("id","menuL7");
    var menuL8 = menuL.append("div").attr("id","menuL8");
    var menuL9 = menuL.append("div").attr("id","menuL9").html("Drop files here");

    menuL4.text("Scale link width ");
    var linkWidthCheck = menuL4.append("input")
    .attr("id","linkWidthCheck")
    .attr("type","checkbox")
    .attr("onchange","toggleLinkWidth(this)");

    menuL5.text("Scale link opacity ");
    var linkOpacityCheck = menuL5.append("input")
    .attr("id","linkOpacityCheck")
    .attr("type","checkbox")
    .attr("checked","")
    .attr("onchange","toggleLinkOpacity(this)");

    menuL6.text("Allow nodes to move");
    var nodesMoveCheck = menuL6.append("input")
    .attr("id","onoffSelect")
    .attr("type","checkbox")
    .attr("checked","")
    .attr("onchange","toggleDynamics(this)");

    menuL7.text("Save SVG");
    var saveSVGButton = menuL7.append("input")
    .attr("id", "saveSVGButton")
    .attr("type", "button")
    .attr("value", "Save")
    .on("click", writeDownloadLink);

    menuL8.text("Load JSON");
    var loadJSONButton = menuL8.append("input")
    .attr("type", "file")
    .attr("id", "json_files")
    .attr("name", "uploadJSON")
    .attr("accept", ".json")
    .on("change", function(evt) {
        var evt = d3.event;
        read_JSON();
    });

    // Setup the dnd listeners.
    d3.select("#menuL9")
        .style("border", "2px dashed")
        .style("border-radius", "5px")
        .style("padding", "25px")
        .style("text-align", "center")
        .style("color", "#bbb");


    var dropZone = document.getElementById('menuL9');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', read_JSON_drop, false);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.

    d3.select("#menuL9")
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

    var text = d3.select("#menuL9")

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



function read_JSON(files, method) {
    var file;

    if (files === undefined) {
        files = document.getElementById('json_files').files;
    }
    file = files[0]

    var start = 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        console.log("HERE");
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            var json_string = evt.target.result;
            a = JSON.parse(json_string);
            console.log(a);
            updateVis(a);
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}

function create_json(dataUrl) {
    console.log(JSON.stringify( dataUrl ));
    d3.json( dataUrl, function( data ) {
        console.log(data);
    });
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
    saveAs(blob, "myProfile.svg");
};

function writeMenuA() {
    menuA.text("Display data from ");
    var netSelect = menuA.append("select")
        .attr("id","netSelect")
        .attr("onchange","computeLinks(this.value)")
        .selectAll("option").data(netNames).enter().append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});
}
function writeMenuB() {
    menuB.text("Compute node size from ");
    var sizeSelect = menuB.append("select")
        .attr("id","sizeSelect")
        .attr("onchange","changeSizes(this.value)")
        .selectAll("option").data(nodeSizeLabels).enter().append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});
}
function writeMenuC() {
    menuC.text("Compute node color from ");
    var colorSelect = menuC.append("select")
    .attr("id","colorSelect")
    .attr("onchange","changeColors(this.value)")
    .selectAll("option").data(nodeColorLabels).enter().append("option")
    .attr("value",function(d){return d;})
    .text(function(d){return d;});
}
function writeMenuR() {
    var menuR1 = menuR.append("div").attr("id","menuR1");
    var menuR2 = menuR.append("div").attr("id","menuR2");
    var menuR2B = menuR.append("div").attr("id","menuR2B");
    var menuR3 = menuR.append("div").attr("id","menuR3");
    var menuR4 = menuR.append("div").attr("id","menuR4");
    var menuR6 = menuR.append("div").attr("id","menuR6");

    menuR1.text("Node charge: ");
    var chargeText = menuR1.append("input")
    .attr("id","chargeText")
    .attr("type","text")
    .attr("onchange","changeCharge(this.value)")
    .attr("value",-force.charge())
    .attr("size",3);

    menuR2.text("Link length: ");
    var distanceText = menuR2.append("input")
    .attr("id","distanceText")
    .attr("type","text")
    .attr("onchange","changeDistance(this.value)")
    .attr("value",force.distance())
    .attr("size",3);

    menuR2B.text("Link strength: ");
    var distanceText = menuR2B.append("input")
    .attr("id","linkStrengthText")
    .attr("type","text")
    .attr("onchange","changeLinkStrength(this.value)")
    .attr("value",force.linkStrength())
    .attr("size",3);

    menuR3.text("Gravity: ");
    var gravityText = menuR3.append("input")
    .attr("id","gravityText")
    .attr("type","text")
    .attr("onchange","changeGravity(this.value)")
    .attr("value",force.gravity())
    .attr("size",3);

    menuR4.text("Node r: ");
    var rText = menuR4.append("input")
    .attr("id","rText")
    .attr("type","text")
    .attr("onchange","changer(this.value)")
    .attr("value",r)
    .attr("size",3);

    menuR6.text("Highlight nodes whose name matches ");
    var matchText = menuR6.append("input")
    .attr("id","matchText")
    .attr("type","text")
    .attr("onchange","matchNodes(this.value)")
    .attr("size",3);

}
// This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).
function loadColors() {
    colorbrewer = {YlGn: {
        2: ["#f7fcb9","#addd8e"],
        3: ["#f7fcb9","#addd8e","#31a354"],
        4: ["#ffffcc","#c2e699","#78c679","#238443"],
        5: ["#ffffcc","#c2e699","#78c679","#31a354","#006837"],
        6: ["#ffffcc","#d9f0a3","#addd8e","#78c679","#31a354","#006837"],
        7: ["#ffffcc","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],
        8: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],
        9: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"]
    },YlGnBu: {
        2: ["#edf8b1","#7fcdbb"],
        3: ["#edf8b1","#7fcdbb","#2c7fb8"],
        4: ["#ffffcc","#a1dab4","#41b6c4","#225ea8"],
        5: ["#ffffcc","#a1dab4","#41b6c4","#2c7fb8","#253494"],
        6: ["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#2c7fb8","#253494"],
        7: ["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],
        8: ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],
        9: ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]
    },GnBu: {
        2: ["#e0f3db","#a8ddb5"],
        3: ["#e0f3db","#a8ddb5","#43a2ca"],
        4: ["#f0f9e8","#bae4bc","#7bccc4","#2b8cbe"],
        5: ["#f0f9e8","#bae4bc","#7bccc4","#43a2ca","#0868ac"],
        6: ["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#43a2ca","#0868ac"],
        7: ["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],
        8: ["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],
        9: ["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#0868ac","#084081"]
    },BuGn: {
        2: ["#e5f5f9","#99d8c9"],
        3: ["#e5f5f9","#99d8c9","#2ca25f"],
        4: ["#edf8fb","#b2e2e2","#66c2a4","#238b45"],
        5: ["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"],
        6: ["#edf8fb","#ccece6","#99d8c9","#66c2a4","#2ca25f","#006d2c"],
        7: ["#edf8fb","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],
        8: ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],
        9: ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#006d2c","#00441b"]
    },PuBuGn: {
        2: ["#ece2f0","#a6bddb"],
        3: ["#ece2f0","#a6bddb","#1c9099"],
        4: ["#f6eff7","#bdc9e1","#67a9cf","#02818a"],
        5: ["#f6eff7","#bdc9e1","#67a9cf","#1c9099","#016c59"],
        6: ["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#1c9099","#016c59"],
        7: ["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],
        8: ["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],
        9: ["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016c59","#014636"]
    },PuBu: {
        2: ["#ece7f2","#a6bddb"],
        3: ["#ece7f2","#a6bddb","#2b8cbe"],
        4: ["#f1eef6","#bdc9e1","#74a9cf","#0570b0"],
        5: ["#f1eef6","#bdc9e1","#74a9cf","#2b8cbe","#045a8d"],
        6: ["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#2b8cbe","#045a8d"],
        7: ["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],
        8: ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],
        9: ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"]
    },BuPu: {
        2: ["#e0ecf4","#9ebcda"],
        3: ["#e0ecf4","#9ebcda","#8856a7"],
        4: ["#edf8fb","#b3cde3","#8c96c6","#88419d"],
        5: ["#edf8fb","#b3cde3","#8c96c6","#8856a7","#810f7c"],
        6: ["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8856a7","#810f7c"],
        7: ["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],
        8: ["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],
        9: ["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#810f7c","#4d004b"]
    },RdPu: {
        2: ["#fde0dd","#fa9fb5"],
        3: ["#fde0dd","#fa9fb5","#c51b8a"],
        4: ["#feebe2","#fbb4b9","#f768a1","#ae017e"],
        5: ["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"],
        6: ["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#c51b8a","#7a0177"],
        7: ["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],
        8: ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],
        9: ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"]
    },PuRd: {
        2: ["#e7e1ef","#c994c7"],
        3: ["#e7e1ef","#c994c7","#dd1c77"],
        4: ["#f1eef6","#d7b5d8","#df65b0","#ce1256"],
        5: ["#f1eef6","#d7b5d8","#df65b0","#dd1c77","#980043"],
        6: ["#f1eef6","#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"],
        7: ["#f1eef6","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],
        8: ["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],
        9: ["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#980043","#67001f"]
    },OrRd: {
        2: ["#fee8c8","#fdbb84"],
        3: ["#fee8c8","#fdbb84","#e34a33"],
        4: ["#fef0d9","#fdcc8a","#fc8d59","#d7301f"],
        5: ["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"],
        6: ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"],
        7: ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],
        8: ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],
        9: ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]
    },YlOrRd: {
        2: ["#ffeda0","#feb24c"],
        3: ["#ffeda0","#feb24c","#f03b20"],
        4: ["#ffffb2","#fecc5c","#fd8d3c","#e31a1c"],
        5: ["#ffffb2","#fecc5c","#fd8d3c","#f03b20","#bd0026"],
        6: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#f03b20","#bd0026"],
        7: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
        8: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
        9: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"]
    },YlOrBr: {
        2: ["#fff7bc","#fec44f"],
        3: ["#fff7bc","#fec44f","#d95f0e"],
        4: ["#ffffd4","#fed98e","#fe9929","#cc4c02"],
        5: ["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"],
        6: ["#ffffd4","#fee391","#fec44f","#fe9929","#d95f0e","#993404"],
        7: ["#ffffd4","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],
        8: ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],
        9: ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#993404","#662506"]
    },Purples: {
        2: ["#efedf5","#bcbddc"],
        3: ["#efedf5","#bcbddc","#756bb1"],
        4: ["#f2f0f7","#cbc9e2","#9e9ac8","#6a51a3"],
        5: ["#f2f0f7","#cbc9e2","#9e9ac8","#756bb1","#54278f"],
        6: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"],
        7: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],
        8: ["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],
        9: ["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#54278f","#3f007d"]
    },Blues: {
        2: ["#deebf7","#9ecae1"],
        3: ["#deebf7","#9ecae1","#3182bd"],
        4: ["#eff3ff","#bdd7e7","#6baed6","#2171b5"],
        5: ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"],
        6: ["#eff3ff","#c6dbef","#9ecae1","#6baed6","#3182bd","#08519c"],
        7: ["#eff3ff","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],
        8: ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],
        9: ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"]
    },Greens: {
        2: ["#e5f5e0","#a1d99b"],
        3: ["#e5f5e0","#a1d99b","#31a354"],
        4: ["#edf8e9","#bae4b3","#74c476","#238b45"],
        5: ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"],
        6: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#31a354","#006d2c"],
        7: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
        8: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
        9: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]
    },Oranges: {
        2: ["#fee6ce","#fdae6b"],
        3: ["#fee6ce","#fdae6b","#e6550d"],
        4: ["#feedde","#fdbe85","#fd8d3c","#d94701"],
        5: ["#feedde","#fdbe85","#fd8d3c","#e6550d","#a63603"],
        6: ["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#e6550d","#a63603"],
        7: ["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],
        8: ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],
        9: ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"]
    },Reds: {
        2: ["#fee0d2","#fc9272"],
        3: ["#fee0d2","#fc9272","#de2d26"],
        4: ["#fee5d9","#fcae91","#fb6a4a","#cb181d"],
        5: ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"],
        6: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"],
        7: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
        8: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
        9: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"]
    },Greys: {
        2: ["#f0f0f0","#bdbdbd"],
        3: ["#f0f0f0","#bdbdbd","#636363"],
        4: ["#f7f7f7","#cccccc","#969696","#525252"],
        5: ["#f7f7f7","#cccccc","#969696","#636363","#252525"],
        6: ["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#636363","#252525"],
        7: ["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],
        8: ["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],
        9: ["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525","#000000"]
    },PuOr: {
        2: ["#f1a340","#f7f7f7"],
        3: ["#f1a340","#f7f7f7","#998ec3"],
        4: ["#e66101","#fdb863","#b2abd2","#5e3c99"],
        5: ["#e66101","#fdb863","#f7f7f7","#b2abd2","#5e3c99"],
        6: ["#b35806","#f1a340","#fee0b6","#d8daeb","#998ec3","#542788"],
        7: ["#b35806","#f1a340","#fee0b6","#f7f7f7","#d8daeb","#998ec3","#542788"],
        8: ["#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788"],
        9: ["#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788"],
        10: ["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"],
        11: ["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"]
    },BrBG: {
        2: ["#d8b365","#f5f5f5"],
        3: ["#d8b365","#f5f5f5","#5ab4ac"],
        4: ["#a6611a","#dfc27d","#80cdc1","#018571"],
        5: ["#a6611a","#dfc27d","#f5f5f5","#80cdc1","#018571"],
        6: ["#8c510a","#d8b365","#f6e8c3","#c7eae5","#5ab4ac","#01665e"],
        7: ["#8c510a","#d8b365","#f6e8c3","#f5f5f5","#c7eae5","#5ab4ac","#01665e"],
        8: ["#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e"],
        9: ["#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e"],
        10: ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"],
        11: ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"]
    },PRGn: {
        2: ["#af8dc3","#f7f7f7"],
        3: ["#af8dc3","#f7f7f7","#7fbf7b"],
        4: ["#7b3294","#c2a5cf","#a6dba0","#008837"],
        5: ["#7b3294","#c2a5cf","#f7f7f7","#a6dba0","#008837"],
        6: ["#762a83","#af8dc3","#e7d4e8","#d9f0d3","#7fbf7b","#1b7837"],
        7: ["#762a83","#af8dc3","#e7d4e8","#f7f7f7","#d9f0d3","#7fbf7b","#1b7837"],
        8: ["#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837"],
        9: ["#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837"],
        10: ["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"],
        11: ["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"]
    },PiYG: {
        2: ["#e9a3c9","#f7f7f7"],
        3: ["#e9a3c9","#f7f7f7","#a1d76a"],
        4: ["#d01c8b","#f1b6da","#b8e186","#4dac26"],
        5: ["#d01c8b","#f1b6da","#f7f7f7","#b8e186","#4dac26"],
        6: ["#c51b7d","#e9a3c9","#fde0ef","#e6f5d0","#a1d76a","#4d9221"],
        7: ["#c51b7d","#e9a3c9","#fde0ef","#f7f7f7","#e6f5d0","#a1d76a","#4d9221"],
        8: ["#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221"],
        9: ["#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221"],
        10: ["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"],
        11: ["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"]
    },RdBu: {
        2: ["#ef8a62","#f7f7f7"],
        3: ["#ef8a62","#f7f7f7","#67a9cf"],
        4: ["#ca0020","#f4a582","#92c5de","#0571b0"],
        5: ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"],
        6: ["#b2182b","#ef8a62","#fddbc7","#d1e5f0","#67a9cf","#2166ac"],
        7: ["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"],
        8: ["#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
        9: ["#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
        10: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"],
        11: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"]
    },RdGy: {
        2: ["#ef8a62","#ffffff"],
        3: ["#ef8a62","#ffffff","#999999"],
        4: ["#ca0020","#f4a582","#bababa","#404040"],
        5: ["#ca0020","#f4a582","#ffffff","#bababa","#404040"],
        6: ["#b2182b","#ef8a62","#fddbc7","#e0e0e0","#999999","#4d4d4d"],
        7: ["#b2182b","#ef8a62","#fddbc7","#ffffff","#e0e0e0","#999999","#4d4d4d"],
        8: ["#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d"],
        9: ["#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d"],
        10: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"],
        11: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"]
    },RdYlBu: {
        2: ["#fc8d59","#ffffbf"],
        3: ["#fc8d59","#ffffbf","#91bfdb"],
        4: ["#d7191c","#fdae61","#abd9e9","#2c7bb6"],
        5: ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"],
        6: ["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"],
        7: ["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"],
        8: ["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],
        9: ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"],
        10: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"],
        11: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]
    },Spectral: {
        2: ["#fc8d59","#ffffbf"],
        3: ["#fc8d59","#ffffbf","#99d594"],
        4: ["#d7191c","#fdae61","#abdda4","#2b83ba"],
        5: ["#d7191c","#fdae61","#ffffbf","#abdda4","#2b83ba"],
        6: ["#d53e4f","#fc8d59","#fee08b","#e6f598","#99d594","#3288bd"],
        7: ["#d53e4f","#fc8d59","#fee08b","#ffffbf","#e6f598","#99d594","#3288bd"],
        8: ["#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd"],
        9: ["#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd"],
        10: ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"],
        11: ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]
    },RdYlGn: {
        2: ["#fc8d59","#ffffbf"],
        3: ["#fc8d59","#ffffbf","#91cf60"],
        4: ["#d7191c","#fdae61","#a6d96a","#1a9641"],
        5: ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
        6: ["#d73027","#fc8d59","#fee08b","#d9ef8b","#91cf60","#1a9850"],
        7: ["#d73027","#fc8d59","#fee08b","#ffffbf","#d9ef8b","#91cf60","#1a9850"],
        8: ["#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
        9: ["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
        10: ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"],
        11: ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"]
    },Accent: {
        2: ["#7fc97f","#beaed4"],
        3: ["#7fc97f","#beaed4","#fdc086"],
        4: ["#7fc97f","#beaed4","#fdc086","#ffff99"],
        5: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0"],
        6: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f"],
        7: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17"],
        8: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"]
    },Dark2: {
        2: ["#1b9e77","#d95f02"],
        3: ["#1b9e77","#d95f02","#7570b3"],
        4: ["#1b9e77","#d95f02","#7570b3","#e7298a"],
        5: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"],
        6: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02"],
        7: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d"],
        8: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]
    },Paired: {
        2: ["#a6cee3","#1f78b4"],
        3: ["#a6cee3","#1f78b4","#b2df8a"],
        4: ["#a6cee3","#1f78b4","#b2df8a","#33a02c"],
        5: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99"],
        6: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c"],
        7: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f"],
        8: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00"],
        9: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6"],
        10: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"],
        11: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99"],
        12: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]
    },Pastel1: {
        2: ["#fbb4ae","#b3cde3"],
        3: ["#fbb4ae","#b3cde3","#ccebc5"],
        4: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4"],
        5: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6"],
        6: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc"],
        7: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd"],
        8: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec"],
        9: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]
    },Pastel2: {
        2: ["#b3e2cd","#fdcdac"],
        3: ["#b3e2cd","#fdcdac","#cbd5e8"],
        4: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4"],
        5: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"],
        6: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae"],
        7: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc"],
        8: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc","#cccccc"]
    },Set1: {
        2: ["#e41a1c","#4daf4a"],
        3: ["#e41a1c","#377eb8","#4daf4a"],
        4: ["#e41a1c","#377eb8","#4daf4a","#984ea3"],
        5: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00"],
        6: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#DBDB42"],
        7: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#DBDB42","#a65628"],
        8: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#DBDB42","#a65628","#f781bf"],
        9: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#DBDB42","#a65628","#f781bf","#999999"]
        //        6: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33"],
        //        7: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628"],
        //        8: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf"],
        //        9: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]
    },Set2: {
        2: ["#66c2a5","#fc8d62"],
        3: ["#66c2a5","#fc8d62","#8da0cb"],
        4: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3"],
        5: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854"],
        6: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f"],
        7: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494"],
        8: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"]
    },Set3: {
        2: ["#8dd3c7","#ffffb3"],
        3: ["#8dd3c7","#ffffb3","#bebada"],
        4: ["#8dd3c7","#ffffb3","#bebada","#fb8072"],
        5: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3"],
        6: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462"],
        7: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"],
        8: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"],
        9: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9"],
        10: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd"],
        11: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5"],
        12: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
    }};
}
function isInt(n) {
    return n % 1 === 0;
}
function round(x,dec) {
    return (Math.round(x*dec)/dec);
}
function roundup(x,dec) {
    return (Math.ceil(x*dec)/dec);
}
function rounddown(x,dec) {
    return (Math.floor(x*dec)/dec);
}

function updateVis(a) {
    console.log(a);
    d3.select("#vis").remove();

    netNames = Object.keys(a.network);
    netLabels = Object.keys(a.display.labels);
    for (i in netLabels) {
        if (a.display.labels[netLabels[i]].type=="categorical") {
            nodeColorLabelsBase.push(" " + netLabels[i]);
        }
        else {
            nodeSizeLabelsBase.push(" " + netLabels[i])
            nodeColorLabelsBase.push(" " + netLabels[i])
        }
    }
    N = a.display.N;
    links = []
    nodes = [];
    // Define nodes
    for (var i=0; i<N; i++) {
        newNode = {
            "idx":i,
        }
        nodes.push(newNode);
    }
    if (a.display.nodeNames !== undefined){
        for (var i in nodes) {
            nodes[i]["name"] = a.display.nodeNames[i];
        }
    }
    if (a.display.name !== undefined){
        d3.select("title").text("webweb - " + a.display.name);
    }else{
        d3.select("title").text("webweb");
    }

    vis = d3.select("#chart").append("svg")
        .attr("width",w)
        .attr("height",h)
        .attr("id","vis");

    node = vis.selectAll(".node");
    link = vis.selectAll(".link");
    force = d3.layout.force()
        .links(links)
        .nodes(nodes)
        .charge(-c)
        .gravity(g)
        .linkDistance(l)
        .size([w,h])
        .on("tick",tick);

    scaleSize = d3.scale.linear().range([1,1]);
    scaleColorScalar = d3.scale.linear().range([1,1]);
    scaleColorCategory = d3.scale.ordinal().range([1,1]);
    scaleLink = d3.scale.linear().range([1,1]);
    scaleLinkOpacity = d3.scale.linear().range([0.4,0.9]);
    colorType = "none";
    sizeType = "none";
    colorKey = "none";
    sizeKey = "none";
    rawColors = [],
    rawSizes = [],
    sizes = [],
    degrees = [],
    colors = [],
    sizesLegend = [],
    colorsLegend = [],
    cats = [],
    catNames = [],
    nameToMatch = "",
    R=0,
    isHighlightText=true;
    for (var i=0; i<N; i++){colors[i] = d3.rgb(100,100,100); rawColors[i] = 1;};
    isStartup = 1,
    isOpacity = 1;
    netName;
    colorbrewer;
    updateMenuA();
    computeLinks(netNames[0]);
}

function updateMenuA() {
    // var netSelect = d3.select("#netSelect")
    //     .selectAll("option").data(netNames).enter().append("option")
    //     .attr("value",function(d){return d;})
    //     .text(function(d){return d;});

    var netSelect = d3.select("#netSelect");

    netSelect.selectAll("option").remove();

    netSelect.selectAll("option")
        .data(netNames).enter()
        .append("option")
        .attr("value",function(d){return d;})
        .text(function(d){return d;});

}

function initializeVis() {
    console.log(a);

    /*
     * Don't modify below this line.
     */
    if (a.display.w !== undefined){w = a.display.w;}
    if (a.display.h !== undefined){h = a.display.h;}
    if (a.display.c !== undefined){c = a.display.c;}
    if (a.display.l !== undefined){l = a.display.l;}
    if (a.display.r !== undefined){r = a.display.r;}
    if (a.display.g !== undefined){g = a.display.g;}

    // set up the DOM
    center = d3.select("body").append("div").attr("id","center");
    menu = center.append("div").attr("id","menu");
    menuL = menu.append("div").attr("id","menuL").attr("class","left");
    menuA = menuL.append("div").attr("id","menuA");
    menuB = menuL.append("div").attr("id","menuB");
    menuC = menuL.append("div").attr("id","menuC");
    menuR = menu.append("div").attr("id","menuR").attr("class","right").attr("style","text-align:right");
    chart = center.append("div").attr("id","chart").attr("style","clear:both");

    netNames = Object.keys(a.network);
    netLabels = Object.keys(a.display.labels);
    for (i in netLabels) {
        if (a.display.labels[netLabels[i]].type=="categorical") {
            nodeColorLabelsBase.push(" " + netLabels[i]);
        }
        else {
            nodeSizeLabelsBase.push(" " + netLabels[i])
            nodeColorLabelsBase.push(" " + netLabels[i])
        }
    }
    N = a.display.N;
    links = []
    nodes = [];
    // Define nodes
    for (var i=0; i<N; i++) {
        newNode = {
            "idx":i,
        }
        nodes.push(newNode);
    }
    if (a.display.nodeNames !== undefined){
        for (var i in nodes) {
            nodes[i]["name"] = a.display.nodeNames[i];
        }
    }
    if (a.display.name !== undefined){
        d3.select("title").text("webweb - " + a.display.name);
    }else{
        d3.select("title").text("webweb");
    }
    vis = chart.append("svg")
        .attr("width",w)
        .attr("height",h)
        .attr("id","vis");

    node = vis.selectAll(".node");
    link = vis.selectAll(".link");
    force = d3.layout.force()
        .links(links)
        .nodes(nodes)
        .charge(-c)
        .gravity(g)
        .linkDistance(l)
        .size([w,h])
        .on("tick",tick);

    scaleSize = d3.scale.linear().range([1,1]);
    scaleColorScalar = d3.scale.linear().range([1,1]);
    scaleColorCategory = d3.scale.ordinal().range([1,1]);
    scaleLink = d3.scale.linear().range([1,1]);
    scaleLinkOpacity = d3.scale.linear().range([0.4,0.9]);
    colorType = "none";
    sizeType = "none";
    colorKey = "none";
    sizeKey = "none";
    rawColors = [],
    rawSizes = [],
    sizes = [],
    degrees = [],
    colors = [],
    sizesLegend = [],
    colorsLegend = [],
    cats = [],
    catNames = [],
    nameToMatch = "",
    R=0,
    isHighlightText=true;
    for (var i=0; i<N; i++){colors[i] = d3.rgb(100,100,100); rawColors[i] = 1;};
    isStartup = 1,
    isOpacity = 1;
    netName;
    colorbrewer;
    writeMenuL();
    writeMenuR();
    loadColors();
    computeLinks(netNames[0]);
}

window.onload = function() {
    initializeVis();
};
