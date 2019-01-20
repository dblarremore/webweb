% make a matrix of weighted edges
% edge weights are the third element in the edge
edge_list = [...
    1, 2, .1;... 
    2, 3, .5;... 
    3, 4, 1;... 
    4, 5, 2;...
];

% call webweb
webweb(edge_list);

%% [OPTIONAL] Set default: show weighted edges.
% To set a default parameter, we need to creat a webweb struct
% and place our parameter setting in it.
% Place this edgeList into a network within the webweb struct
ww.networks.network.edgeList = edge_list;
% Set scaleLinkWidth to True. 
ww.display.scaleLinkWidth = 'True';
% call webweb
webweb(ww);
