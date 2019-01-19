% set some node names and a metadata attribute (hunger) to appear for all
% of the networks that we will display. Since these metadata attributes
% apply globally, we put them under ww.display
ww.display.metadata.names = {'dane','sebastian','manny','brock','ted','donnie'};
ww.display.metadata.hunger = [4,9,2,4,12.1,5];

% define a network called snake
ww.networks.snake.edgeList = [1,2; 2,3; 3,4; 4,5; 5,6];
ww.networks.snake.metadata.isHead.values = [0,0,0,0,0,1];

% define another called starfish
ww.networks.starfish.edgeList = [1,2; 1,3; 1,4; 1,5; 1,6];
ww.networks.starfish.metadata.texture.values={'gooey','fishy','chewy',...
    'crunchy','chewy','gooey'};
ww.networks.starfish.metadata.power.values={1,3,3.8,0.2,1,3.1415};

% BONUS force the starfish network to display first by default
ww.display.networkName = 'starfish';
% BONUS force node color to texture metadata
ww.display.colorBy = 'texture';
% BONUS force node size to isHead metadata
ww.display.sizeBy = 'hunger';

webweb(ww)
