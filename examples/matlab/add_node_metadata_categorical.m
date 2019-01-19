% define a couple edges
edges = [...
    1,2;
    2,3;...
    ];
% place the edges in a webweb struct called ww
ww.networks.network.edgeList = edges;

% Define categorical metadata sets in TWO different ways
% 1. Categories defined by integers with a set of integer-assigned keys
alphabeticallity = [1,2,3];
alphabeticallity_keys = {'A-Z','a-z','W+;'};
ww.display.metadata.alphabeticallity.values = alphabeticallity;
ww.display.metadata.alphabeticallity.categories = alphabeticallity_keys;
% 2. Categories defined directly by strings
cooperativity = {'high','medium','low'};
ww.display.metadata.cooperativity.values = cooperativity;

% BONUS: ask webweb to default to present colors by alphabeticallity
% This assignment simply needs to match the key of the metadata above.
ww.display.colorBy = 'alphabeticallity';

% call webweb
webweb(ww);