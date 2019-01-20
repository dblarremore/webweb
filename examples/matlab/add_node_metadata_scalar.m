% define a couple edges
edges = [...
    1,2;
    2,3;...
    ];
% Place the edges in a webweb struct called ww
ww.networks.network.edgeList = edges;

% Define two scalar metadata sets
age = [10,20,30];
velocity = [42,100,7];

% Put them in the webweb struct
ww.display.metadata.age.values = age;
ww.display.metadata.velocity.values = velocity;

% BONUS: ask webweb to use age for default node size
%        ask webweb to use velocity for default node color
% These assignments simply need to match the key of the metadata above.
ww.display.sizeBy = 'age';
ww.display.colorBy = 'velocity';

% call webweb
webweb(ww);