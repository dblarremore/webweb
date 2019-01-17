function [] = webweb(varargin)
% WEBWEB makes pretty interactive network diagrams in your browser
% version 3.4
% http://github.com/dblarremore/webweb
% Daniel Larremore + Contributors
% Comments, suggestions, or forks always welcome.
%
% BASIC USAGE:
% WEBWEB(net)                       (see EXAMPLE 1 in webwebTest.m)
% WEBWEB(net,nodeNames);            (see EXAMPLE 2 in webwebTest.m)
% WEBWEB(nets)                      (see EXAMPLE 3 in webwebTest.m)
% WEBWEB(nets,nodeNames);           (see EXAMPLE 4 in webwebTest.m)
% WEBWEB(nets,netNames);            (see EXAMPLE 5 in webwebTest.m)
% WEBWEB(nets,netNames,nodeNames);  (see EXAMPLE 6 in webwebTest.m)
% WEBWEB(nets,nodeNames,netNames);  (see EXAMPLE 7 in webwebTest.m)
%
% INPUTS:
% net                   NxN Adjacency matrix. Can we weighted, unweighted,
%   symmetric or asymmetric. All displayed networks are displayed as
%   undirected, however.
% nets                  NxNxM Adjacency array of M adjacency matrices
% nodeNames             Nx1 cell{string} of names for the nodes
% netNames              Mx1 cell{string} of names for the networks
%
% OUTPUTS:
% Provided that you have webweb.v3.js, style.css, and d3.v3.min.js in the
% same folder as this file, WEBWEB will write a file called network.html
% and a file called network.json to the same folder and then open the html
% file for network display
%
% EXAMPLES (see webwebTest.m)
%
% ADVANCED USAGE
%
% WEBWEB(nets)
% WEBWEB(dis,nets)                  (see ADVANCED EXAMPLE in webwebTest.m)
%
% where dis and nets are structs with optional fields as described below:
%
% dis
%     .name (str)
%     .w,h,l,r,c,g (ints: width,height,linklength,radius,charge,gravity)
%     .metadata
%         .metadataObjects...
%
% nets
%     .netObjects...
%
% netObject
%     .adj (nonnegative, NxN. sparse or full)
%     .metadata
%         .metadataObjects...
%
% metadataObject
%     .values (required. int Nx1, bool Nx1, or cell{str} Nx1)
%     .categories (optional. cell{str} of category names corresponding to int category values)
%     .type (optional. if set to string 'binary' this will force interpretation of {0,1} values as T/F, isntead of as integers)
%
% http://github.com/dblarremore/webweb for updates

% Check if varargin has nodeNames.
% ------------------------------------------------
if isstruct(varargin{1}) % nodeNames exists as second element of varargin
    if nargin==1
        dis = struct;
        webwebWrite(dis,varargin{1});
    elseif nargin==2
        a = varargin{1};
        b = varargin{2};
        if...
                isfield(a,'name')...
                || isfield(a,'w')...
                || isfield(a,'h')...
                || isfield(a,'l')...
                || isfield(a,'r')...
                || isfield(a,'c')...
                || isfield(a,'g')...
                || isfield(a,'nodeNames')...
                || isfield(a,'metadata')
            webwebWrite(a,b);
        else
            webwebWrite(b,a);
        end
    end
    return
end
% ------------------------------------------------

nrows   = size(varargin{1}, 1);
ncols   = size(varargin{1}, 2);
nlayers = size(varargin{1}, 3);
% if you've got an edgelist, convert it to a sparse matrix.
if ((nrows <= 3) || (ncols <= 3)) && (nlayers==1)
    varargin{1} = edgelist_to_adj(varargin{1});
end

if nlayers==1
    varargin{1} = remove_undirected_redundancy(varargin{1});
else
    for m=1:nlayers
        % check to see if each matrix is symmetric.
        % if true, pass upper triangular matrix to avoid doublecounting links
        varargin{1}(:,:,m) = remove_undirected_redundancy(varargin{1}(:,:,m));
    end
end

if nargin==1
    if size(varargin{1},3)==1
        dis = struct;
        nets.network.adj = varargin{1};
    else
        dis = struct;
        nets = struct;
        for m=1:nlayers
            nets.(['network' num2str(m)]).adj = varargin{1}(:,:,m);
        end
    end
    webwebWrite(dis,nets);
    return
end

if nargin==2
    nets = struct;
    dis = struct;
    % check to disambiguate netNames or nodeNames
    % if M == N, this is confusing...
    if nlayers == size(varargin{1}(:,:,1))
        isNetNames = input('Are the metadata that you passed network names? (y/n) ');
        if strcmp(isNetNames,'y')
            isNetNames = 1;
        elseif strcmp(isNetNames,'n')
            isNetNames = 0;
        end
    else
        % decide if we have netNames or nodeNames
        a = length(varargin{2});
        if a==nlayers
            isNetNames = 1;
        else
            isNetNames = 0;
        end
    end
    if isNetNames
        for m=1:nlayers
            nets.(varargin{2}{m}).adj = varargin{1}(:,:,m);
        end
    else
        for m=1:nlayers
            nets.(['network' num2str(m)]).adj = varargin{1}(:,:,m);
        end
        dis.metadata.names.values = varargin{2};
    end
    
    webwebWrite(dis,nets);
    return
end

if nargin==3
    nets = struct;
    dis = struct;
    % check to disambiguate netNames or nodeNames
    % if M == N, this is confusing...
    if nlayers == size(varargin{1}(:,:,1))
        isNetNames = input('Are the first metadata that you passed network names? (y/n) ');
        if strcmp(isNetNames,'y')
            netNames = varargin{2};
            nodeNames = varargin{3};
        elseif strcmp(isNetNames,'n')
            netNames = varargin{3};
            nodeNames = varargin{2};
        end
    else
        % decide if we have netNames or nodeNames
        a = length(varargin{2});
        if a==nlayers
            netNames = varargin{2};
            nodeNames = varargin{3};
        else
            netNames = varargin{3};
            nodeNames = varargin{2};
        end
    end
    
    for m=1:nlayers
        nets.(netNames{m}).adj = varargin{1}(:,:,m);
    end
    dis.metadata.names.values = nodeNames;
    
    webwebWrite(dis,nets);
    return
end

end

function webwebWrite(dis, nets)
% webwebloc = '~/Desktop/webweb/';
webwebloc = '';

if isfield(dis,'name')
    name = dis.name;
else
    name = 'network';
end

networkNames = fieldnames(nets);
N=0;
for i=1:length(networkNames)
    N = max(N,max(size(nets.(networkNames{i}).adj)));
end

%%%%%%%%%%
fid = fopen([webwebloc name '.json'],'w');
fprintf(fid,'var wwdata = {');
fprintf(fid,'"display":{');
fprintf(fid,'"N":%i,',N);
fprintf(fid,'"name":"%s",',name);
if isfield(dis,'w')
    fprintf(fid,'"w":%i,',dis.w);
end
if isfield(dis,'h')
    fprintf(fid,'"h":%i,',dis.h);
end
if isfield(dis,'l')
    fprintf(fid,'"l":%i,',dis.l);
end
if isfield(dis,'r')
    fprintf(fid,'"r":%i,',dis.r);
end
if isfield(dis,'c')
    fprintf(fid,'"c":%i,',dis.c);
end
if isfield(dis,'g')
    fprintf(fid,'"g":%i,',dis.g);
end
fprintf(fid,'"metadata":{');
if isfield(dis,'metadata')
    q = dis.metadata;
    qNames = fieldnames(q);
    for ii=1:length(qNames)
        fprintf(fid,'"%s":{',qNames{ii});
        fprintf(fid,'"type":"%s",',q.(qNames{ii}).type);
        fprintf(fid,'"values":[');
        if iscell(q.(qNames{ii}).values)
            for j=1:length(q.(qNames{ii}).values)
                fprintf(fid,'"%s",',q.(qNames{ii}).values{j});
            end
        else
            for j=1:length(q.(qNames{ii}).values)
                fprintf(fid,'%i,',q.(qNames{ii}).values(j));
            end
        end
        fprintf(fid,'],');
        if isfield(q.(qNames{ii}),'categories')
            fprintf(fid,'"categories":[');
            for j=1:length(q.(qNames{ii}).categories)
                fprintf(fid,'"%s",',q.(qNames{ii}).categories{j});
            end
            fprintf(fid,'],');
        end
        fprintf(fid,'},');
    end
end
fprintf(fid,'},');
fprintf(fid,'},');

fprintf(fid,'"networks":{');
for i=1:length(networkNames)
    p = getfield(nets,networkNames{i});
    fprintf(fid,'"%s":{',networkNames{i});
    fprintf(fid,'"edgeList":[');
    [r,c,v] = find(p.adj);
    for j=1:length(v)
        fprintf(fid,'[%i,%i,%i],',r(j)-1,c(j)-1,v(j));
    end
    fprintf(fid,'],');
    fprintf(fid,'"metadata":{');
    if isfield(p,'metadata')
        q = p.metadata;
        qNames = fieldnames(q);
        for ii=1:length(qNames)
            fprintf(fid,'"%s":{',qNames{ii});
            fprintf(fid,'"type":"%s",',q.(qNames{ii}).type);
            fprintf(fid,'"values":[');
            if iscell(q.(qNames{ii}).values)
                for j=1:length(q.(qNames{ii}).values)
                    fprintf(fid,'"%s",',q.(qNames{ii}).values{j});
                end
            else
                for j=1:length(q.(qNames{ii}).values)
                    fprintf(fid,'%i,',q.(qNames{ii}).values(j));
                end
            end
            fprintf(fid,'],');
            if isfield(q.(qNames{ii}),'categories')
                fprintf(fid,'"categories":[');
                for j=1:length(q.(qNames{ii}).categories)
                    fprintf(fid,'"%s",',q.(qNames{ii}).categories{j});
                end
                fprintf(fid,'],');
            end
            fprintf(fid,'},');
        end
    end
    fprintf(fid,'},');
    fprintf(fid,'},');
end
fprintf(fid,'}}');
fclose(fid);

% Strip out all instances of ,] and ,} which are not JSONic.
fid = fopen([webwebloc name '.json'],'r');
tline = fgetl(fid);
fclose(fid);

tline = strrep(tline,',]',']');
tline = strrep(tline,',}','}');

fid = fopen([webwebloc name '.json'],'w');
fprintf(fid,tline);
fclose(fid)

%%%%%%%%%%
fid = fopen([webwebloc name '.html'],'w');
fprintf(fid,'<!DOCTYPE html>\n');
fprintf(fid,'<html>\n');
fprintf(fid,'<head>\n');
fprintf(fid,'\t<title>webweb %s</title>\n',name);
fprintf(fid,'\t<script src="client/js/d3.v5.min.js"></script>\n');
fprintf(fid,'\t<link type="text/css" rel="stylesheet" href="client/css/style.css"/>\n');
fprintf(fid,'\t<script type="text/javascript" src="%s.json"></script>\n',name);
fprintf(fid,'</head>\n');
fprintf(fid,'<body>\n');
fprintf(fid,'\t<script type="text/javascript" src="client/js/colors.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript" src ="client/js/Blob.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript" src ="client/js/FileSaver.min.js"></script>\n');
fprintf(fid,'\t<script type="text/javascript" src ="client/js/webweb.v5.js"></script>\n');
fprintf(fid,'</body>\n');
fprintf(fid,'</html>\n');
fclose(fid);
fclose('all');
%%%%%%%%%%
comp = computer;
if ~isempty(strfind(comp,'PCWIN'))
    dos([webwebloc name '.html'],'-echo');
else
    unix(['open ' webwebloc name '.html']);
end
end

function A = edgelist_to_adj(RCV)
% If it's a sideways edgelist, flip it.
if size(RCV,1) < size(RCV,2)
    RCV = RCV';
end
% If there are no edge weights, make a bunch of ones
if size(RCV,2)==2
    v = ones(size(RCV,1),1);
else
    v = RCV(:,3);
end
N = max(max(RCV(:,1:2)));
A = sparse(RCV(:,1),RCV(:,2),v,N,N);
return
end

function B = remove_undirected_redundancy(A)
if ~sum(sum(A~=A'))
    B = triu(A);
else
    B = A;
end
return
end

