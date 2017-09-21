# webweb
This is basically MATLAB + d3js. Webweb is a tool for creating interactive visualizations of networks on the web. 

Webpage here: [http://danlarremore.com/webweb/](http://danlarremore.com/webweb/)

webweb is a front end to a clever library called d3. Learn more about d3 at [d3js.org](d3js.org). While d3 was made for web developers, webweb is made for networks researchers who use MATLAB. The idea is that you can use webweb to make easily shareable and interactive network visualizations. View your webs on the web!

## Why though?
I got tired of having an adjacency matrix for a network in MATLAB with no way to just _see_ it quickly. Now, I can just call webweb(A) in MATLAB and it pops up in my browser. 

## How to use it
Grab the files above and put them into your current MATLAB directory. Then either check out the MATLAB help for webweb.m, try opening webwebTest.m for some worked examples, or view the [webweb examples page](http://danlarremore.com/webweb/). 

-	[Example 1 - A single network](http://danlarremore.com/webweb/example2/)

```matlab
% create a 100 node adjacency matrix A
A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
% call webweb
webweb(A);
```
- [Example 2 - Node names](http://danlarremore.com/webweb/example2/)
- [Example 3 - Two networks](http://danlarremore.com/webweb/example3/)
- [Example 4 - Two networks + Node names](http://danlarremore.com/webweb/example4/)
- [Example 5 - Name the networks](http://danlarremore.com/webweb/example5/)
- [Example 6 - Multiple networks, with node and network names](http://danlarremore.com/webweb/example6/)
- [Advanced Example - Customized](http://danlarremore.com/webweb/advanced/)
- [All Examples](http://danlarremore.com/webweb/examples.html)

## Feedback and Bugs

The code provided here is provided as-is, with no warranty, with no guarantees of technical support or maintenance, etc. If you experience problems while using the code, please let me know via email. I am happy to host (or link to) implementations of webweb drivers in other programming languages, in the interest of facilitating their more widespread use. However, I cannot provide any technical support for that code. 

Fork away!

If you repurpose or hack this code to do something else, I would love to hear about it. If you use webweb to make figures for an academic paper, no citation is needed, but please let me know and I will post a link here to your publication.