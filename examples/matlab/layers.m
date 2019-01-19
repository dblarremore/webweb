% define a few layers' edge lists for a multilayer network called oroboros
l_one = [1,2; 2,3; 3,4];
l_two = [1,2; 2,3; 3,4; 4,1];
l_three = [1,2; 2,3; 3,1];
l_four = [1,2; 2,1];
l_five = [];

% Place the layers under oroboros in the order that you'd like them.
% Let's initialize an empty array of layers first
ww.networks.oroboros.layers = {};
% Build the first layer as a networkObject
netObj.edgeList = l_one;
% Assign it its *own* metadata, specific to this layer
netObj.metadata.isHead.values = [1,0,0,0];
% Append it to the layers
ww.networks.oroboros.layers{end+1} = netObj;

% Repeat for layer 2
netObj.edgeList = l_two;
netObj.metadata.isHead.values = [1,0,0,0];
ww.networks.oroboros.layers{end+1} = netObj;

% ... and layer 3.
netObj.edgeList = l_three;
netObj.metadata.isHead.values = [1,0,0];
ww.networks.oroboros.layers{end+1} = netObj;

% ... and layer 4.
netObj.edgeList = l_four;
netObj.metadata.isHead.values = [1,0];
ww.networks.oroboros.layers{end+1} = netObj;

% ... and layer 5.
netObj.edgeList = l_five;
netObj.metadata.isHead.values = [1];
ww.networks.oroboros.layers{end+1} = netObj;


% BONUS: set default node color and size to the `isHead` attribute
ww.display.colorBy = 'isHead';
ww.display.sizeBy = 'isHead';

webwebdev(ww);
