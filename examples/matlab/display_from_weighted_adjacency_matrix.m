% define a weighted adjacency matrix
adjacency_matrix = [...
    0, .1, 0, 0, 0;...
    .1, 0, .5, 0, 0;...
    0, .5, 0, 1, 0;...
    0, 0, 1, 0, 2;...
    0, 0, 0, 2, 0;...
];

% call webweb
webweb(adjacency_matrix);

%% [OPTIONAL] Set default: show weighted edges.
% To set a default parameter, we need to creat a webweb struct
% and place our parameter setting in it.
%
% Convert from the matrix to an edgeList.
[from,to,weight] = find(triu(adjacency_matrix));
% Place this edgeList into a network within the webweb struct
ww.networks.network.edgeList = [from,to,weight];
% Set scaleLinkWidth to True. 
ww.display.scaleLinkWidth = 'True';
% call webweb
webweb(ww);
