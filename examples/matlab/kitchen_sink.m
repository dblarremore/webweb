% Give the webweb a title.
ww.title = 'kitchen_sink';

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Network 1 of 3: a stochastic block model (SBM)                          %
% Features: a network w/ metadata                                         %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Create an empty edge list, to be populated during network construction
edgeList = [];
groupSizes = [15,20,25]; groupProbs = [0.25, 0.02, 0; 0.02, 0.2, 0.02; 0, 0.02, 0.15];
% Create an array to store the group label for each node in the network
groupIDs = [];
for i=1:length(groupSizes)    
    groupIDs = [groupIDs; i*ones(groupSizes(i),1)];
end
% Populate the edge list.
for i=1:sum(groupSizes)-1
    for j=i:sum(groupSizes)
        if rand < groupProbs(groupIDs(i),groupIDs(j))
            edgeList(end+1,:) = [i,j];
        end
    end
end
% Create a network called sbm, and assign its edgelist
ww.networks.sbm.edgeList = edgeList;
% Assign the sbm network some metadata equal to the group IDs.
ww.networks.sbm.metadata.community.values = groupIDs;
% Tell webweb the metadata type here is categorical (and not scalar).
ww.networks.sbm.metadata.community.type = 'categorical';


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Network 2 of 3: the Zachary Karate Club                                 %
% Feature: a network w/ node names and additional (binary ) metadata      %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Directly specify an edge list.
ww.networks.zkc.edgeList = [2,1;3,1;3,2;4,1;4,2;4,3;5,1;6,1;7,1;7,5;7,6;8,1;8,2;8,3;8,4;9,1;9,3;10,3;11,1;11,5;11,6;12,1;13,1;13,4;14,1;14,2;14,3;14,4;17,6;17,7;18,1;18,2;20,1;20,2;22,1;22,2;26,24;26,25;28,3;28,24;28,25;29,3;30,24;30,27;31,2;31,9;32,1;32,25;32,26;32,29;33,3;33,9;33,15;33,16;33,19;33,21;33,23;33,24;33,30;33,31;33,32;34,9;34,10;34,14;34,15;34,16;34,19;34,20;34,21;34,23;34,24;34,27;34,28;34,29;34,30;34,31;34,32;34,33];
% Specify node names using metadata called 'name', a reserved keyword
ww.networks.zkc.metadata.name.values = {"Bernita Blizzard", "Lauran Lenahan", "Kallie Kerr", "Yun Yearsley", "Krystina Kehr", "Marisa Mccullough", "Sandra Soderquist", "Latisha Luczynski", "Gertrudis Guadarrama", "Ramonita Raley", "Tessa Tuff", "Michell Murphey", "Juliana Jenny", "Imogene Ivie", "Ricky Revis", "Tonia Tighe", "Lyle Lamanna", "Michael Motto", "Charlie Cartwright", "Aimee Aschenbrenner", "Vi Vallery", "Shaquana Stocking", "Penelope Percival", "Bari Barrentine", "Janie Jeske", "Breann Brodie", "Carmel Clara", "Nada Nicol", "Francisca Fu", "Shyla Schranz", "Clarissa Crooks", "Hilario Holzwarth", "Huong Hodge", "Lavonne Leng"};
% Create some extra "notes" about two of the nodes (1 and 34) by creating
% a map from 1 and 34 to two struct variables. This format will be 
% correctly written by the jsonencode function by webweb.
nodeNotes = containers.Map(...
    {'1','34'},...
    {struct('headHoncho',true),...
    struct('headHoncho',true)});
ww.networks.zkc.nodes = nodeNotes;

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Network 3 of 3: Tree/Ring network (N-Cayley tree)                       %
% Features: a multilayer network with different metadata for each layer   %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Create an empty network called tree, with to-be-populated layers
ww.networks.tree.layers = {};
% Create an empty edge list, to be populated during layer construction
edgeList = [];
tree_layers = 4; branching_factor = 5; nodes_queue = 1; nodeCounter = 1;
% Create an array to store the layer of each node in the tree
ringNumber = 0;
for ring=1:tree_layers
    new_nodes_queue = [];
    while ~isempty(nodes_queue)
        for i=1:branching_factor
            nodeCounter = nodeCounter+1;
            new_nodes_queue(end+1) = nodeCounter;
            % append to edge list and metadata
            edgeList(end+1,:) = [nodes_queue(end),nodeCounter];
            ringNumber(end+1) = ring;
        end
        nodes_queue(end) = [];
    end
    if ring==1
        branching_factor = branching_factor-1;
    end
    nodes_queue = new_nodes_queue;
    % Create a temporary variable called netObj, and put in an edgelist...
    netObj.edgeList = edgeList;
    % ... and metadata values for which node is in which ring.
    netObj.metadata.ring.values = ringNumber;
    netObj.metadata.ring.type = 'categorical';
    % Append that netObj as the next layer in the tree network.
    ww.networks.tree.layers{end+1} = netObj;
end

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Display parameters choices and defaults                                   %
% Demonstrates: how to set default behavior for webweb on opening the html  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

ww.display.networkName = 'tree';
ww.display.networkLayer = 2;
ww.display.colorBy = 'ring';
ww.display.sizeBy = 'degree';
ww.display.gravity = 0.3;
ww.display.charge = 30;
ww.display.linkLength = 15;
ww.display.colorPalette = 'Greens';
ww.display.scaleLinkOpacity = 0;
ww.display.scaleLinkWidth = 1;

% call webweb
webweb(ww);
