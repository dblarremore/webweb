# webweb
a tool for creating, displaying, and sharing interactive network visualizations on the web designed for simplicity and ease of use.

webweb was made for networks researchers who use MATLAB or Python. The idea is to make it easy to create and share interactive network visualizations. View your webs on the web! Webweb!

check out the [documentation](https://webwebpage.github.io) for the full documentation, examples, and a bunch of pretty visualizations!

## installing

python: 
`pip install webweb`

matlab: 
`git clone https://github.com/dblarremore/webweb`

## getting started
python: 
```python
from webweb import Web

# make a list of unweighted edges
edge_list = [[1, 2], [2, 3], [3, 4]]

# instantiate webweb and show the result
Web(edge_list).show()
```

matlab:
```matlab
% make a list of unweighted edges
edge_list = [...
    1, 2;
    2, 3;
    3, 4;
    ];
webweb(edge_list);
```

## How to use it:

See the [examples](https://webwebpage.github.io/examples/) on the documentation site!

## display parameters:

- attachWebwebToElementWithId: string; default: undefined; id of element to add webweb visualization to
- charge: positive float; default: 60; how much nodes repel each other
- colorBy: string; default: 'none'; metadata attribute to color nodes by
- colorPalette: string; default: 'Set1'; what color palette to use when coloring by a categorical metadata attribute
- freezeNodeMovement: boolean; default: false; fix node positions (drag and drop still works)
- gravity: positive float; default: .1; how much nodes are pulled to the center of the visualization
- height: positive non-zero integer; default: undefined; fix a height for the display. If not set, webweb will try to pick a reasonable value based on the space it's given.
- hideMenu: boolean; default: false; if true, webweb's inputs will be hidden
- invertBinaryColors: boolean; default: false; flip the colors used for True and False if we’re coloring nodes by a binary attribute.
- invertBinarySizes: boolean; default: false; flip the sizes used for True and False if we’re sizing nodes by a binary attribute.
- linkLength: positive non-zero integer; default: 20; the length of link edges
- linkStrength: positive non-zero float; default: 1; how much links resist deformation by other forces
- nameToMatch: string; default: ""; highlight nodes whose name matches this value
- networkLayer: 0-based index; default: 0; network layer the visualization should show to start with
- networkName: string; default: first input network name; the network the visualization should show first
- radius: positive non-zero float; default: 5; node radius
- scaleLinkOpacity: boolean; default: false; scale link opacity by weight
- scaleLinkWidth: boolean; default: false; scale link width by weight
- showNodeNames: boolean; default: false; if true, show all node names (can get a bit messy)
- sizeBy: string; default: 'none'; metadata attribute to size nodes by
- width: positive non-zero integer; default: undefined; fix a width for the display. If not set, webweb will try to pick a reasonable value based on the space it's given.

## Feedback/Bugs

If you find a bug, create an issue! We want webweb to be as great as possible. 

If you want to implement an interface for webweb in another language, go ahead!

If you repurpose or hack this code to do something else, we'd love to hear about it! 

If you use webweb to make figures for an academic paper, no citation is needed, but if you let us know and we'll will post a link to your publication [here](https://webwebpage.github.io/in-the-wild/)

## License

GNU General Public License v3+
