# webweb
This is basically MATLAB/Python + d3js. Webweb is a tool for creating interactive visualizations of networks on the web. 

Webpage here: [http://danlarremore.com/webweb/](http://danlarremore.com/webweb/)

webweb is a front end to a clever library called d3. Learn more about d3 at [d3js.org](d3js.org). While d3 was made for web developers, webweb is made for networks researchers who use MATLAB or Python. The idea is that you can use webweb to make easily shareable and interactive network visualizations. View your webs on the web!

## Why though?
I got tired of having an adjacency matrix for a network in MATLAB with no way to just _see_ it quickly. Now, I can just call webweb(A) in MATLAB and it pops up in my browser. Recently, this has been rebuilt in Python because it's open source and powerful. 

## Features:

webweb has a bunch of useful features.

### networks

You can load up multiple networks at the same time, to explore how different configurations effect the resulting network.

### labels

A label is a string, and each node node can have a value for that label. The label can be categorical, scalar, or binary. Labels can be used to control node size or color in the display. A label defined in `display` will be applied to all networks. A label defined for a single network will (surprising, I know) only apply to that network.

If you have a categorical label, you should pass those categories to the label.

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
