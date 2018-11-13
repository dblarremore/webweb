# webweb
This is basically MATLAB/Python + d3js. Webweb is a tool for creating interactive visualizations of networks on the web. 

Webpage here: [http://danlarremore.com/webweb/](http://danlarremore.com/webweb/)

webweb is a front end to a clever library called d3. Learn more about d3 at [d3js.org](d3js.org). While d3 was made for web developers, webweb is made for networks researchers who use MATLAB or Python. The idea is that you can use webweb to make easily shareable and interactive network visualizations. View your webs on the web! Webweb!

## Why though?
I got tired of having an adjacency matrix for a network in MATLAB with no way to just _see_ it quickly. Now, I can just call webweb(A) in MATLAB or python and it'll pop right up in my browser.

# Documentation & Etc

webweb does stuff.

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
- colorPalate: string; which color palate to use
- freezeNodeMovement: boolean; stop forces from being applied
- nodeCoordinates: `[{ 'x': 1, 'y' : 1}, ...]`; the initial positions of the nodes. Note: this is ignored unless freezeNodeMovement is true (otherwise you'll just get a bunch of stacked circles in the corner...)

### nodes

Webweb tries to be "smart" about how many nodes there are, but you can also tell it: `display.N = x`

It will find the number of nodes by taking the maximum of: the set of node names and each set of nodes referenced in network adjacency lists.

Generally, you don't have to tell it how many nodes there are, but there is one exception: if you have a collection of unnamed nodes, and one or more nodes that appear in zero edges, then you should specify the number of nodes.

### networks

You can load up multiple "views" of a set of nodes to explore how different settings effect the resulting network.

### labels

A label is a string (like "strength"); each node node should have a value for that label (like "enormous"). 

You can use labels to determine node color or size (unless the label is categorical).

You can make a label that will apply to all of your networks if you add it to the `display` element.

A label defined for a single network will only apply to that network (surprising, I know).

Labels can be of three types:
- binary (true/false)
- scalar
- categorical

Generally you don't have to say what's what, but there is one exception: if no nodes have a particular value for a category, but you would like that category to appear in the legend, you should define the list of categories (see `examples/categories.py`).

### Adjacency Lists

You tell webweb about the edges in your network by supplying an adjacency list.

The first two elements in an edge are the nodes in that edge.

The third element in an edge is the weight of that edge. If you don't provide one, this will default to 1.

Right now, webweb tries to be "smart" about edges and figuring out the nodes they refer to: whether your edge list is 1- or 0-indexed, it'll still play nice.

This _does_ make things a little weird with labels though, as labels are (right now) just an array. If you've 1-indexed your edge list, then node "1" will get the first value in a label array.

Note: if there are multiple edges between two nodes, the weight of the first edge will be used.

## Setup:

Right now:

1. clone the repository: `git clone https://github.com/hneutr/webweb`
2. add it locally via pip: `pip install -e webweb`

Soon (once we upload it to the archive):
`pip install webweb`

## How to use it:

1. Import webweb into your script: `from webwebpy.webweb import webweb`
2. make a webweb object with the desired number of nodes: `web = webweb(num_nodes=N)`
3. set display parameters via `web.display` (eg, to set the height, `web.display.h = 200`)
4. add your adjacency list: `web.networks.your_network_name.adj = <your_adjacency_list>`
5. display the network in browser: `web.draw()`

## Feedback and Bugs

The code provided here is provided as-is, with no warranty, with no guarantees of technical support or maintenance, etc. If you experience problems while using the code, please let me know via email. I am happy to host (or link to) implementations of webweb drivers in other programming languages, in the interest of facilitating their more widespread use. However, I cannot provide any technical support for that code. 

Fork away!

If you repurpose or hack this code to do something else, I would love to hear about it. If you use webweb to make figures for an academic paper, no citation is needed, but please let me know and I will post a link to your publication [here](http://danlarremore.com/webweb/).
