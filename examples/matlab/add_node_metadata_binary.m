% define an edge list
edge_list = [...
    1, 2;
    2, 3;
    2, 4;
    3, 4;
    ];
% define names for the nodes
names = {'Dan','Hunter','Brian','Carl'};

% put the edge list and names into a webweb struct called ww
ww.networks.network.edgeList = edge_list;
ww.display.metadata.name.values = names;

% put some boolean metadata into the same struct
wearsGlasses = [1,1,1,0];
ww.display.metadata.wearsGlasses.values = wearsGlasses;
ww.display.metadata.wearsGlasses.type   = 'binary';

% call webweb
webweb(ww);