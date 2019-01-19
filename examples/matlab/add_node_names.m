% define a couple edges
edges = [...
    1,2;
    2,3;...
    ];
% Place the edges in a webweb struct called ww
ww.networks.network.edgeList = edges;

% Define some names in an array of cells containing strings
names = {'Huberg','Pierot','Slartibertfast'};

% Put the names in metadata with the special key "names"
ww.display.metadata.name.values = names;

% Call webweb
webweb(ww)