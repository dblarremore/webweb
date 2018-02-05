# webweb python
This is basically Python + d3js. Webweb is a tool for creating interactive visualizations of networks on the web.

Webpage here: [http://danlarremore.com/webweb/](http://danlarremore.com/webweb/)

webweb is a front end to a clever library called d3. Learn more about d3 at [d3js.org](d3js.org). While d3 was made for web developers, webweb is made for networks researchers who use MATLAB. The idea is that you can use webweb to make easily shareable and interactive network visualizations. View your webs on the web!

## Why though?
Python is open source, powerful, and ubiquitous. The MATLAB version of webweb is great, but a Python implementation expands webweb's reach and potential impact.

## How to use it
Grab the `webwebpy` directory above and place it into your current Python script's directory. Although the syntax for webweb Python is eerily similar to MATLAB, it is slightly different. Check out examples.py for some fully worked examples, but here is a general outline:

- Create an adjacency list, `<your_adj_list>`
- Import webweb into your script via `from webwebpy.webweb import webweb`
- Instantiate a webweb object, specifying number of nodes, N, in network: `web = webweb(num_nodes=N)`
- Set any display parameters by calling appropriate methods on the object, `web.display`
    - E.g., Apply a charge of 5: `web.display.c = 5`
- Set any networks parameters by calling appropriate methods on the object, `web.networks`
    - E.g., To create a new network and assign your adjacency list, <br>
     `web.networks.<name_of_network>.adjList = <your_adj_list>`
- Save network to JSON: `web.save_json(<save_name>)`
- View the interactive visualization of your network in browser: `web.draw()`


## Feedback and Bugs

The code provided here is provided as-is, with no warranty, with no guarantees of technical support or maintenance, etc. If you experience problems while using the code, please let me know via email. I am happy to host (or link to) implementations of webweb drivers in other programming languages, in the interest of facilitating their more widespread use. However, I cannot provide any technical support for that code.

Fork away!

If you repurpose or hack this code to do something else, I would love to hear about it. If you use webweb to make figures for an academic paper, no citation is needed, but please let me know and I will post a link to your publication [here](http://danlarremore.com/webweb/).
