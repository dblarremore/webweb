# webweb
A tool for creating interactive networkk visualizations for the web. It's primarily written in javascript and makes heavy use of [d3js](d3js.org). There are interfaces for (MATLAB)[http://danlarremore.com/webweb/] and (python)[https://github.com/hneutr/webweb].

d3 was made for web developers, webweb was made for networks researchers who use MATLAB or Python. The idea is to make it easy to create and share interactive network visualizations. View your webs on the web! Webweb!

## Why though?
I got tired of having an adjacency matrix for a network in MATLAB with no way to just _see_ it quickly. Now, I can just call webweb(A) in MATLAB or python and it'll pop right up in my browser.

# Documentation, etc

A webweb object can have multiple _networks_, and each of those networks can have multiple _frames_.

The idea of a webweb object is for it to contain networks related to some set of nodes; if you're using a single webweb object to display several networks with no nodes in common, it would probably make sense to make multiple webweb objects instead.

To define things that are shared by all nodes, set them in `display.labels` (see labels below)

The idea of a webweb network is that the frames in it have a consistent definition of an edge.

### display parameters

These are the parameters you can set:

- w: positive number; the width of the network visualization
- h: positive number; the height of the network visualization
- c: positive number; the charge of the nodes (the strength of the repulsion force between nodes)
- g: positive number; gravity, the strength of the force pulling nodes to the center
- l: positive number; link length, how long links "like" to be
- r: positive number; the radius of the nodes
- linkStrength: positive number; how much force it takes to shrink or grow the length of a link
- scaleLinkWidth: boolean; scale the width of the link by its weight
- scaleLinkOpacity: boolean; scale the opacity of the link by its weight
- colorPalette: string; which color palette to use
- freezeNodeMovement: boolean; stop forces from being applied
- nodeCoordinates: `[{ 'x': 1, 'y' : 1}, ...]`; the initial positions of the nodes. Note: this is ignored unless freezeNodeMovement is true (otherwise you'll just get a bunch of stacked circles in the corner...)
- showNodeNames: boolean; should we show node names (it's kinda ugly with more than like, 2 nodes)
- invertBinaryColors: boolean; if true, the colors used for `true` and `false` will be swapped. Ignored if the label in colorBy isn't binary
- invertBinarySizes: boolean; if true, `true` will be small and `false` will be big. Ignored if the label in sizeBy isn't binary label

### nodes

Webweb tries to be "smart" about how many nodes there are, but you can also tell it: `display.N = x`

It tries to find the number of nodes by taking whichever is biggest, the number of node names or the number of nodes referenced in each network's adjacency list.

Generally, you don't have to tell it how many nodes there are, but if your nodes have no names and there's at least one node with degree zero (no edges) then you should specify how many nodes there are.

### networks

You can load up multiple "views" of a set of nodes to explore how different settings effect the resulting network.

### labels

A label is a string (like "strength"); each node node should have a value for that label (like "enormous"). 

You can use labels to determine node size (unless the label is categorical) or node color.

You can make a label that will apply to all of your networks if you add it to the `display` element.

A label defined for a single network will only apply to that network (surprising, right?).

Labels can be of three types:
- binary (true/false)
- scalar
- categorical

How webweb will display data if it isn't told:
- If all of your label's values are true or false webweb will display it as binary
- If one of your label's is a string webweb will show it as categorical

You can also explicitly tell webweb how to display things (see the examples).

### Adjacency Lists

You tell webweb about the edges in your network by supplying an adjacency list.

The first two elements in an edge are the nodes in that edge.

The third element in an edge is the weight of that edge. If you don't provide one, this will default to 1.

Right now, webweb tries to be "smart" about edges and figuring out the nodes they refer to: whether your edge list is 1- or 0-indexed, it'll still play nice.

This _does_ make things a little weird with labels though, as labels are (right now) just an array. If you've 1-indexed your edge list, then node "1" will get the first value in a label array.

Notes:

- if there are multiple edges between two nodes, the weight of the first edge will be used.
- webweb doesn't understand directed networks; it'll display them as if they were undirected

## Setup:

Right now:

1. clone the repository: `git clone https://github.com/hneutr/webweb`
2. add it locally via pip: `pip install -e webweb`

Soon (once we upload it to the archive):
`pip install webweb`

## How to use it:

See the examples!

Note that you can pass webweb (networkx)[http://networkx.github.io/] objects! For more on how, see the (simple_networkx)[https://github.com/hneutr/webweb/blob/master/examples/simple_networkx.py] example or the (weighted_networkx)[https://github.com/hneutr/webweb/blob/master/examples/weighted_networkx.py] example. (Networkx attributes are automatically translated into webweb labels too).

## Feedback and Bugs

The code provided here is provided as-is, with no warranty, with no guarantees of technical support or maintenance, etc. If you experience problems while using the code, please let me know via email. I am happy to host (or link to) implementations of webweb drivers in other programming languages, in the interest of facilitating their more widespread use. However, I cannot provide any technical support for that code. 

Fork away!

If you repurpose or hack this code to do something else, I would love to hear about it. If you use webweb to make figures for an academic paper, no citation is needed, but please let me know and I will post a link to your publication [here](http://danlarremore.com/webweb/).
