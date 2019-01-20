% webweb for MATLAB accepts a few input types:
%
% webweb(adjacency_matrix)
%   adjacency_matrix must be at least 4x4; may be directed or undirected.
%   Note: any 3x3 or 2x2 matrix will be parsed as an edge_list instead.
%   
% webweb(edge_list)
%   edge_list representing M edges must be Mx3 [from, to, weight] or 
%      Mx2 [from,to]. Passing 2xM or 3xM is also ok.
%
% webweb(webweb_struct)
%   webweb_struct is a MATLAB struct enabling full webweb functionality.
%      all elements of its hierarchical struct is:
%     .networks
%         .networkObject
%         - and/or -
%         .layers
%             .networkObject
%     .display
%         .metadataObject
%         .[optional display parameters]
%
% networkObject
%     .edgeList [2 or 3]
%     .metadataObject
%
% metadataObject
%     .values
%     .type (optional generally; required 'binary' if metadata are 0,1)
%     .categories (optional)
%
% [optional display parameters]
%   w, h, c, g, l, r, linkStrength,
%   scaleLinkWidth, scaleLinkOpacity
%   colorPalette
%   freezeNodeMovement, showNodeNames, invertBinaryColors, invertBinarySizes
%   nodeCoordinates
%   see http://github.com/dblarremore/webweb for full documentation

function [] = webweb(x)

if isstruct(x)
    %%% PARSE A webweb STRUCT %%%
    
    % Basically, if you're passing in a struct, we're going to assume that
    % you have set all the parameters already. :)
    %
    % However, we're still going to go through and check that you're not
    % sending in weights unnecessarily, and that all adjacency matrices
    % have been changed to edge lists (which is what the js expects).
    %
    % We will also check all edgelists to make sure that they are
    % zero-indexed instead of one-indexed.
    %
    % We're also going to look for layers and check THOSE the same as we
    % checked single layers above.
    
    % Get the names of the networks. We'll iterate through each.
    mynets = fieldnames(x.networks);
    for i = 1:length(mynets)
        % Does this network have an .edgeList or .layers?
        if isfield(x.networks.(mynets{i}),'edgeList')
            % edgeList!
            x.networks.(mynets{i}).edgeList = ...
                clean_edgeList(x.networks.(mynets{i}).edgeList);
            if isfield(x.networks.(mynets{i}),'metadata')
                myMetadata = fieldnames(x.networks.(mynets{i}).metadata);
                for k = 1:length(myMetadata)
                    x.networks.(mynets{i}).metadata.(myMetadata{k}).values = ...
                        force_brackets(x.networks.(mynets{i}).metadata.(myMetadata{k}).values);
                end
            end
        elseif isfield(x.networks.(mynets{i}),'layers')
            % layers!
            for j=1:length(x.networks.(mynets{i}).layers)
                x.networks.(mynets{i}).layers{j}.edgeList = ...
                    clean_edgeList(x.networks.(mynets{i}).layers{j}.edgeList);
                if isfield(x.networks.(mynets{i}).layers{j},'metadata')
                    myMetadata = fieldnames(x.networks.(mynets{i}).layers{j}.metadata);
                    for k = 1:length(myMetadata)
                        x.networks.(mynets{i}).layers{j}.metadata.(myMetadata{k}).values = ...
                            force_brackets(x.networks.(mynets{i}).layers{j}.metadata.(myMetadata{k}).values);
                    end
                end
            end
        end
    end
    webwebWrite(x)
else
    %%% PARSE A MATRIX OR TENSOR %%%
    % Is it a matrix or a tensor?
    if size(x, 3)==1
        % It's a matrix
        wwstruct.networks.network.edgeList = to_edgeList(x);
    else
        % It's a tensor
        wwstruct.networks.network.layers = {};
        for m=1:size(x,3)
            netObj.edgeList = to_edgeList(x);
            wwstruct.networks.network.layers{end+1} = netObj;
        end
    end
    webwebWrite(wwstruct);
end

end
%%%%%%%%%%

%%%%%%%%%%
function webwebWrite(wwstruct)
% if you want all your webwebs written elsewhere, you can...
% Default = here.
webwebloc = '';
% Alternative = uncomment and customize the line below.
% webwebloc = '~/Desktop/webweb/';

% Open the file.
if isfield(wwstruct,'title')
    fid = fopen([webwebloc wwstruct.title '.html'],'w');
    fname = wwstruct.title;
else
    fid = fopen([webwebloc 'webweb.html'],'w');
    fname = 'webweb';
end
%%%%%%%%%% WRITE THE DATA TO HTML/JSON %%%%%%%%%%
fprintf(fid,'<!DOCTYPE html>\n');
fprintf(fid,'<html>\n');
fprintf(fid,'<head>\n');
if isfield(wwstruct,'title')
    fprintf(fid,'\t<title>webweb %s</title>\n',wwstruct.title); %TITLE
else
    fprintf(fid,'\t<title>webweb</title>\n'); %TITLE
end
fprintf(fid,'\t<script src="client/js/d3.v5.min.js"></script>\n');
fprintf(fid,'\t<link type="text/css" rel="stylesheet" href="client/css/style.css"/>\n');
fprintf(fid,'\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n');
fprintf(fid,'</head>\n');
fprintf(fid,'<body>\n');
fprintf(fid,'\t<script type="text/javascript" src="client/js/colors.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript" src ="client/js/Blob.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript" src ="client/js/FileSaver.min.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript">var wwdata = %s;</script>\n',...
    jsonencode(wwstruct)); %JSON
fprintf(fid,'\t<script type="text/javascript" src ="client/js/webweb.v5.js"></script>\n');
fprintf(fid,'</body>\n');
fprintf(fid,'</html>\n');

fclose('all');

%%%%%%%%%% OPEN THE FILE %%%%%%%%%%
comp = computer;
if ~isempty(strfind(comp,'PCWIN'))
    dos([webwebloc fname '.html'],'-echo');
else
    unix(['open ' webwebloc fname '.html']);
end

end
%%%%%



%%%%%
function rcv = adj_to_edgeList(A)
% we'll simply return a Mx3 edgelist if the network is weighted
% and a Mx2 edgelist if the network is unweighted
[r,c,v] = find(remove_undirected_redundancy(A));
if sum(v==1)==length(v)
    rcv = [r-1,c-1];
    return
else
    rcv = [r-1,c-1,v];
    return
end
end


%%%%%
function B = remove_undirected_redundancy(A)
if ~sum(sum(A~=A'))
    B = triu(A);
else
    B = A;
end
return
end


%%%%%
function rcv = to_edgeList(myArray)
nrows   = size(myArray, 1);
ncols   = size(myArray, 2);
if ((nrows <= 3) || (ncols <= 3))
    rcv = clean_edgeList(myArray);
    return
else
    rcv = adj_to_edgeList(myArray);
    return
end
end


%%%%%
function rcv = clean_edgeList(myEdges)
% if the edges are just empty, return nothing.
if size(myEdges,1)==0
    rcv = {[]};
    return
end
% if the edges are sizeways (3xM instead of Mx3 for instance) flip them
if size(myEdges,1) < size(myEdges,2)
    myEdges = myEdges';
end
% if there are no edge weights, return
if size(myEdges,2)==2
    rcv = myEdges;
    return
end
% if there are edge weights...
if size(myEdges,2)==3
    % are they all ones, and can be discarded?
    if sum(myEdges(:,3)==1)==size(myEdges,1)
        % yes
        rcv = myEdges(:,1:2);
        return
    else
        % no
        rcv = myEdges;
        return
    end
end
error('Unable to parse edgeList. Possible cause: did you pass in an adjacency matrix?');
end

%%%%%
function md = force_brackets(metadata)
if length(metadata)==1
    md = {metadata};
else
    md = metadata;
end
return
end