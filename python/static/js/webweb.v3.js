/*
 * Dynamics and colors
 */
function tick() {
    link.attr("x1", function(d) {return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

function removeLinks() {
    links.splice(0,links.length);
    draw();
}

function computeLinks(net) {
    var i;
    netName = net;
    removeLinks();
    nodeSizeLabels = nodeSizeLabelsBase.slice(0);
    nodeColorLabels = nodeColorLabelsBase.slice(0);

    try {
        adj = d3.values(current_network["network"][netName]["adjList"]);
        scaleLink.domain(d3.extent(d3.transpose(adj)[2]));
        scaleLinkOpacity.domain(d3.extent(d3.transpose(adj)[2]));
        for (i in adj) {
            links.push({source: adj[i][0], target: adj[i][1], w: adj[i][2]});
        }
    }
    catch (error) {
        console.log("No links to add!");
    }

    loadLabels = Object.keys(current_network.network[netName].labels);
    for (i in loadLabels) {
        if (current_network.network[netName].labels[loadLabels[i]].type === "categorical") {
            nodeColorLabels.push(loadLabels[i]);
        }
        else {
            nodeSizeLabels.push(loadLabels[i]);
            nodeColorLabels.push(loadLabels[i]);
        }
    }
    draw();

    writeMenuB();
    if (nodeSizeLabelsBase.indexOf(sizeKey) === -1){
        changeSizes("none");
    } else {
        changeSizes(sizeKey);
    }
    sizeSelect.selectedIndex = nodeSizeLabels.indexOf(sizeKey);

    writeMenuC();
    if (nodeColorLabelsBase.indexOf(colorKey) === -1){
        changeColors("none");
    } else {
        changeColors(colorKey);
    }
    colorSelect.selectedIndex = nodeColorLabels.indexOf(colorKey);
}

function computeSizes(x) {
    var i;

    if (x === "none"){
        sizeType = "none";
        for (i in nodes){sizes[i] = 1;}
    }
    else if (x === "degree"){
        sizeType = "degree";
        for (i in nodes){
            degrees[i] = nodes[i].weight;
            rawSizes[i] = Math.sqrt(degrees[i]);
        }
        scaleSize.domain(d3.extent(rawSizes),d3.max(rawSizes)).range([0.5,1.5]);
        for (i in sizes){sizes[i] = scaleSize(rawSizes[i]);}
        rawSizes = degrees.slice(0);
    }
    else {
        if (x[0] === " "){
            x = x.slice(1);
            for (i in nodes){sizes[i] = current_network.display.labels[x].value[i];}
            sizeType = current_network.display.labels[x].type;
        }
        else {
            for (i in nodes){sizes[i] = current_network.network[netName].labels[x].value[i];}
            sizeType = current_network.network[netName].labels[x].type;
        }
        rawSizes = sizes.slice(0);
        scaleSize.domain(d3.extent(sizes),d3.max(sizes)).range([0.5,1.5]);
        for (i in sizes){sizes[i] = scaleSize(sizes[i]);}
    }
}

function highlightNode(d) {
    d3.select("#node_" + d.idx)
        .transition().duration(100)
        .attr("r", sizes[d.idx] * network_node_r * 1.3)
        .style("stroke", d3.rgb(0,0,0));
}

function highlightText(d) {
    if (d === "stop") {isHighlightText=false; return}
    else if (d === "start") {isHighlightText=true; return}
    if (isHighlightText){
        if (sizeType !== "none" || colorType !== "none") { pos=35; }
        if (d.name === undefined) {
            textbit = vis.append("text").text("This is node " + d.idx + ".")
                .attr("x", d.x+1.5*network_node_r)
                .attr("y", d.y-1.5*network_node_r)
                .attr("fill", "black")
                .attr("font-size",12)
                .attr("id","highlightText");
        } else {
            textbit = vis.append("text").text("This is " + d.name + " (" + d.idx + ").")
                .attr("x", d.x+1.5*network_node_r)
                .attr("y", d.y-1.5*network_node_r)
                .attr("fill", "black")
                .attr("font-size",12)
                .attr("id","highlightText");
        }
    }
}
function unHighlightNode(d) {
    if (nameToMatch === "" || d.name.indexOf(nameToMatch) < 0) {
        d3.select("#node_" + d.idx)
            .transition()
            .attr("r", sizes[d.idx] * network_node_r)
            .style("stroke",d3.rgb(255,255,255));
    }
}
function unHighlightText() {
    vis.selectAll("#highlightText").remove();
}
function computeColors(x) {

    var i;

    // no colors
    if (x === "none"){
        // no colors
        colorType = "none";
        // set all nodes to dark grey 100
        for (i in nodes){colors[i] = d3.rgb(100,100,100);}
    }
    // by degree
    else if (x === "degree"){
        // we'll treat degree as a scalar
        colorType = x;
        // raw values are weights
        for (i in nodes){
            rawColors[i] = nodes[i].weight;
        }
        // scaled values mapped to 0...1
        scaleColorScalar.domain(d3.extent(rawColors)).range([0, 1]);
        // get colors by passing scaled value to colorWheel
        for (i in nodes){colors[i] = colorWheel(nodes[i].weight);}
    }
    // by other label
    else {
        var y;
        if (x[0] === " "){
            x = x.slice(1);
            y = current_network.display.labels[x];
        }
        else {
            y = current_network.network[netName].labels[x];
            console.log(y);
        }

        for (i in nodes){
            // Load raw values from the data structure
            rawColors[i] = y.value[i];
        }
        // Load the data type from the data structure
        colorType = y.type;
        catNames = [];
        cats = [];
        if (colorType === "categorical") {catNames = y.categories}
        if (catNames === undefined){
            var q = d3.set(rawColors).values();
            q.sort();
            catNames = [];
            for (i in q){
                cats[i] = q[i];
                catNames[i] = q[i];
            }
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
                }
            }
        }

        // We think it's categorical...
        if (colorType === "categorical") {
            // but let's check because we can only have up to 9 categorical colors
            if (Object.keys(catNames).length <= 9) {
                // scaled values properly mapped using colorBrewer Set1
                scaleColorCategory.domain(cats).range(colorbrewer[current_color_scheme][Object.keys(catNames).length]);
                for (i in nodes){
                    // get colors by passing categories to colorWheel
                    colors[i] = colorWheel(rawColors[i]);
                }
                // console.log(cats,catNames);
            }
            else
            {
                // if we thought we had categories but we have too many, treat like scalars
                colorType = "scalarCategorical";
                // scaled values mapped to 0...1
                scaleColorScalar.domain(d3.extent(rawColors)).range([0,1]);
                for (i in nodes){
                    // get colors by passing scalars to colorWheel
                    colors[i] = colorWheel(rawColors[i]);
                }
            }
        }
        else {
            // scaled values mapped to 0...1
            scaleColorScalar.domain(d3.extent(rawColors)).range([0,1]);
            for (i in nodes){
                // get colors by passing scalars to colorWheel
                colors[i] = colorWheel(rawColors[i]);
            }
        }
    }
}
function colorWheel(x) {
    if (isNaN(x)) {
        if (colorType === "categorical" && typeof(x) === "string"){
            return scaleColorCategory(x);
        }
        else{
            return d3.rgb(180,180,180);}
    }
    if (colorType === "categorical") {
        return scaleColorCategory(x);
    }
    else if (colorType === "scalar" || colorType === "scalarCategorical" || colorType === "degree") {
        // Rainbow HSL
        return d3.hsl(210*(1-scaleColorScalar(x)),0.7,0.5);
        // Greyscale
        // return [0.8*255*x,0.8*255*x,0.8*255*x];
        // Copper
        // return [255*Math.min(x/0.75,1),0.78*255*x,0.5*255*x];
    }
    else if (colorType === "binary") {
        if (!x){ return d3.rgb(30,100,180); }
        else { return d3.rgb(102,186,30); }
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
    if (nameToMatch !== "") { matchNodes(nameToMatch); }
}
function changeColors(x) {
    colorKey = x;

    if (nameToMatch !== "") { matchNodes(nameToMatch); }

    // if (x.indexOf("partition") >= 0) {
    try {
        color_key_legend = current_network["network"][netName]["labels"][colorKey]["value_keys"];

        d3.select("#partition_type_label")
            .style("opacity", 1.0)
            .text("Partition Type: " + x)
            .attr("x", function () {
                var bbox = this.getBBox();
                var width = bbox.width;
                console.log(bbox);
                return (network_height / 2) - (width / 2.0);
            });
    }
    catch (err) {
        d3.select("#partition_type_label")
            .style("opacity", 0.0);
    }
    // }
    // else {
    //     d3.select("#partition_type_label")
    //         .style("opacity", 0.0);
    // }

    computeColors(x);
    redrawNodes();
    computeLegend();
}

function changeColorScheme() {
    current_color_scheme = this.value;
    changeColors(colorKey);
}

function changeCharge(new_charge_val) {
    if (new_charge_val >= 0) {
        current_network.display.c = new_charge_val;
        force.charge(-new_charge_val);
        force.start();
    }
    else {
        alert("Repulsion must be nonnegative.");
    }
}
function changeNodeRadius(new_node_size) {
    network_node_r = new_node_size;
    current_network.display.r = new_node_size;
    redrawNodes();
    computeLegend();
}
function changeDistance(new_distance_val) {
    if (x >= 0) {
        current_network.display.l = new_distance_val;
        force.linkDistance(new_distance_val);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeLinkStrength(new_strength_val) {
    if (new_strength_val >= 0) {
        current_network.display.c = new_strength_val;
        force.linkStrength(new_strength_val);
        force.start();
    }
    else {
        alert("Distance must be nonnegative.");
    }
}
function changeGravity(new_gravity_val) {
    if (new_gravity_val >= 0) {
        current_network.display.g = new_gravity_val;
        force.gravity(new_gravity_val);
        force.start();
    }
    else {
        alert("Gravity must be nonnegative.");
    }
}

function toggleZoom() {
    zoom_on = !zoom_on;
    d3.select(this).attr("checked", zoom_on);

    var svg = d3.select("#vis");
    if (zoom_on) {
        svg.call(zoom);
    }
    else {
        svg.call(zoom_off);
    }
}

function toggleDynamics(x) {
    var i;

    isDynamics = x.checked;
    if (!isDynamics)
    {
        force.stop();
        for (i=0; i<force.nodes().length; i++)
        {
            force.nodes()[i].fixed=true;
        }
    }
    else
    {
        for (i=0; i<force.nodes().length; i++)
        {
            force.nodes()[i].fixed=false;
        }
        node.call(force.drag);
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

    if (x.length === 0){
        nodes.forEach(function(d){
            unHighlightNode(d)
        });
    }
    else {
        nodes.forEach(function(d) {
            if (d.name.indexOf(nameToMatch) < 0) {
                unHighlightNode(d);
            }
            else {
                highlightNode(d)}
        })
    }
}
/*
 * Drawing
 */
function redrawNodes() {
    nodes.forEach(function(d, i) {
        d3.select("#node_" + d.idx)
            .attr("r",sizes[i]*network_node_r)
            .style("fill", function() {
                return (rawColors[i] === 0) ? unclassified_color : d3.rgb(colors[i]);
            });})
}
function redrawLinks() {
    links.forEach(function(d, i) {
        d3.select("#link_" + i)
            .transition()
            .style("stroke-width",function(d){
                if (d.w === 0){return 0}
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
    var numInts, isIntScalar, i, j;

    R = 0;
    if (sizeType !== "none" && network_node_r !== 0 && network_node_r !== "") {
        if (sizeType === "scalar" || sizeType === "degree") {
            // test for ints
            isIntScalar = true;
            j=0;

            while (j<N && isIntScalar){isIntScalar=isInt(rawSizes[j]); j++;}
            // integer scalars
            if (isIntScalar) {
                numInts = d3.max(rawSizes)-d3.min(rawSizes)+1;
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
                    for (i=1; i<bins; i++) {sizesLegend.push(lower+i*step);}
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
                for (i=1; i<bins; i++) {sizesLegend.push(round(lower+i*step,10));}
                sizesLegend.push(roundup(upper,10));
            }
            sizesLegendText = sizesLegend.slice(0);
        }
        else if (sizeType === "binary") {
            sizesLegendText = ["false","true"];
            sizesLegend = [0,1];
        }
        if (sizeType === "degree"){
            for (i in sizesLegend){
                sizesLegend[i] = scaleSize(Math.sqrt(sizesLegend[i]));
            }
        }
        else {
            for (i in sizesLegend){
                sizesLegend[i] = scaleSize(sizesLegend[i]);
            }
        }
        R = network_node_r*d3.max(sizesLegend);
    }
    if (colorType !== "none") {

        if (colorType === "categorical") {
            colorsLegend = scaleColorCategory.domain();
            colorsLegendText = d3.values(catNames);
        }
        else if (colorType === "binary") {
            colorsLegend = [0,1];
            colorsLegendText = ["false","true"];
        }
        else if (colorType === "scalar" || colorType === "degree") {
            // test for ints
            isIntScalar = true;
            j = 0;

            while (j<N && isIntScalar){isIntScalar=isInt(rawColors[j]); j++;}
            // integer scalars
            if (isIntScalar) {
                numInts = d3.max(rawColors)-d3.min(rawColors)+1;
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
                    for (i=1; i<bins; i++) {colorsLegend.push(lower+i*step);}
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
                for (i=1; i<bins; i++) {colorsLegend.push(round(lower+i*step,10));}
                colorsLegend.push(roundup(upper,10));
                colorsLegendText = colorsLegend.slice(0);
            }
        }
        else if (colorType === "scalarCategorical") {
            lower = d3.min(rawColors);
            upper = d3.max(rawColors);
            bins = 4;
            step = (upper-lower)/bins;
            colorsLegend.push(lower);
            for (i=1; i<bins; i++) {colorsLegend.push(Math.round(lower+i*step));}
            colorsLegend.push(upper);
            colorsLegendText = colorsLegend.slice(0);
        }
    }
    drawLegend();
}
function drawLegend() {
    var svg = d3.select("#vis");
    svg.selectAll("#legend").remove();
    if (sizeType === "none" && colorType === "none"){return;}
    if (sizeKey === colorKey) {
        sizesLegend.forEach(function(d,i){
            svg.append("circle")
                .attr("id", "legend")
                .attr("r", network_node_r * d)
                .attr("cx", 5+R)
                .attr("cy", 5+R+2.3*R*i)
                .style("fill", colorWheel(colorsLegend[i]))
                .style("stroke", d3.rgb(255,255,255));
        });
        sizesLegendText.forEach(function(d,i){
            svg.append("text")
                .attr("id","legend")
                .text(d)
                .attr("x", 10+2*R)
                .attr("y", 5+R+2.3*R*i+4)
                .attr("fill","black")
                .attr("font-size",12)
        });
        return;
    }
    if (sizeType !== "none") {
        sizesLegend.forEach(function(d,i){
            svg.append("circle")
                .attr("id","legend")
                .attr("r", network_node_r * d)
                .attr("cx", 5+R)
                .attr("cy", 5+R+2.3*R*i)
                .style("fill",d3.rgb(0,0,0))
                .style("stroke",d3.rgb(255,255,255));
        });
        sizesLegendText.forEach(function(d,i){
            svg.append("text")
                .attr("id","legend")
                .text(d)
                .attr("x", 10+2*R)
                .attr("y", 5+R+2.3*R*i+4)
                .attr("fill","black")
                .attr("font-size",12)
        });
    }
    if (colorType !== "none") {
        colorsLegend.forEach(function(d,i){
            svg.append("circle")
                .attr("id", "legend")
                .attr("r", 5)
                .attr("cx", 5+Math.max(R,5))
                .attr("cy", 5+5+2*R+2.3*R*(sizesLegend.length-1)+5+2.3*5*i)
                .style("fill", function() {
                    return (d == 0) ? unclassified_color : colorWheel(colorsLegend[i]);
                })
                .style("stroke", d3.rgb(255,255,255));
        });
        colorsLegendText.forEach(function(d,i){
            svg.append("text")
                .attr("id","legend")
                .text(function() {
                    if (color_key_legend === undefined) {
                        return d;
                    }
                    return (d == 0) ? "Unclassified" : color_key_legend[i];
                })
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
            if (d.w === 0){return 0}
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
            .attr("r", network_node_r)
            .attr("id",function(d) {return ("node_" + d.idx);})
            .style("fill",d3.rgb(255,255,255))
            .style("stroke",d3.rgb(255,255,255));

        node.exit().remove();

        node.on("mousedown", function(d) {
            unHighlightText();
            highlightText("stop");
        });

        d3.select(window).on("mouseup",function(){highlightText("start");});

        node.on("click", function(d) {
                console.log(d);
                d3.select("#vis_g").call(zoom_off);
                setTimeout(function() {
                    d3.select("#vis_g").call(zoom);
                }, 2000);

            })
            .on("mouseover",function (d) {
                highlightNode(d);
                highlightText(d);
            })
            .on("mouseout",function(d) {
                unHighlightNode(d);
                unHighlightText();
            });

        node.call(force.drag);
        toggleDynamics(document.getElementById("onoffSelect"));
        isStartup = 0;
    }
    force.start();
}
