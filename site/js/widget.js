var visDisplay = null;
var vis;

var margins = [50, 50, 50, 50],
    displayWidth = 640 - margins[1] - margins[3],
    displayHeight = 480 - margins[0] - margins[2],
    idCounter = 0;

var tree = null;
var diagonal = d3.svg.diagonal().projection(function (d) { return [d.y, d.x]; });

function buildTree() {
    tree = d3.layout.tree().size([displayHeight, displayWidth]);

    if (visDisplay != null) {
        visDisplay.remove();
    }

    visDisplay = d3.select("#divDisplayTree")
        .append("svg:svg")
        .attr("width", displayWidth + margins[1] + margins[3])
        .attr("height", displayHeight + margins[0] + margins[2]);

    vis = visDisplay
        .append("svg:g")
        .attr("transform", "translate(" + margins[3] + "," + margins[0] + ")");

    // get the Jane display tree
    var root = Jane.dataRefs.root;

    root.x0 = root.x = displayHeight / 2;
    root.y0 = root.y = 0;

    updateTreeDisplay(root);
}

var ColorNode = function (d) {
    if (d.dataRef != null) {
        return d.dataRef.hasBag() ? "#4f4" : (("populateRequested" in d.dataRef) ? "#ff4" : "#88f");
    }
    return "#44f";
};

function updateTreeDisplay(source) {
    var treeRootX = displayHeight / 2;
    var treeRootY = 0;

    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    // Compute the new tree layout.
    var root = Jane.dataRefs.root;
    var nodes = tree.nodes(root).reverse();

    // space the nodes according to the tree depth
    nodes.forEach(function (d) { d.y = treeRootY + (d.depth * ((displayWidth - (treeRootY + (margins[1] * 2.0))) / Jane.dataRefs.depth)); });

    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function (d) { return d.id || (d.id = ++idCounter); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function (d) {
            if (d.parent != null) {
                return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
            }
            return "translate(" + d.y0 + "," + d.x0 + ")";
        })
        .on("click", function (d) {
            Jane.postEvent(Jane.events.DATA_REFERENCE_SELECTED, d.dataRef);
            })
        .on("dblclick", function (d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            updateTreeDisplay(d);
        })
        .on("contextmenu", function (data, index) {
            //handle right click

            //stop showing browser menu
            d3.event.preventDefault();
        });

    nodeEnter.append("svg:circle")
        .attr("r", 1e-6)
        .style("fill", ColorNode);

    nodeEnter.append("svg:text")
        .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
        .text(function (d) { return d.name; })
        .style("fill-opacity", 1e-6)
        ;

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", ColorNode);

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function (d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = { x: d.source.x0, y: d.source.y0 };
            return diagonal({ source: o, target: o });
        })
      .transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function drawTree() {
    updateTreeDisplay(Jane.dataRefs.root);
}

