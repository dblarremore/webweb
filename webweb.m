function [] = webweb(varargin)
% WEBWEB makes pretty interactive network diagrams in your browser
% version 3.3
%
% Daniel Larremore
% May 22, 2015
% daniel.larremore@gmail.com, http://danlarremore.com, @danlarremore
% Comments and suggestions always welcome.
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
%     .nodeNames (cell{str} Nx1)
%     .labels
%         .labelsObjects...
% nets
%     .netObjects...
% netObject
%     .adj (nonnegative, NxN. sparse or full)
%     .labels
%         .labelsObjects...
% labelsObject
%     .type (str: categorical, binary, scalar)
%     .values (int Nx1)
%     .categories (cell{str}, categorical names corresponding to values)
%
%
% For all usage examples, see webwebTest.m
% http://danlarremore.com for updates.

if isstruct(varargin{1})
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
                || isfield(a,'labels')
            webwebWrite(a,b);
        else
            webwebWrite(b,a);
        end
    end
    return
end


M = size(varargin{1},3);
if M==1
    if ~sum(sum(varargin{1}~=varargin{1}'))
        varargin{1} = triu(varargin{1});
    end
else
    for m=1:M
        % check to see if each matrix is symmetric.
        % if true, pass upper triangular matrix to avoid doublecounting links
        if ~sum(sum(varargin{1}(:,:,m)~=varargin{1}(:,:,m)'))
            varargin{1}(:,:,m) = triu(varargin{1}(:,:,m));
        end
    end
end

if nargin==1
    if size(varargin{1},3)==1
        dis = struct;
        nets.network.adj = varargin{1};
    else
        dis = struct;
        nets = struct;
        for m=1:M
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
    if M == size(varargin{1}(:,:,1))
        isNetNames = input('Are the labels that you passed network names? (y/n) ');
        if strcmp(isNetNames,'y')
            isNetNames = 1;
        elseif strcmp(isNetNames,'n')
            isNetNames = 0;
        end
    else
        % decide if we have netNames or nodeNames
        a = length(varargin{2});
        if a==M
            isNetNames = 1;
        else
            isNetNames = 0;
        end
    end
    if isNetNames
        for m=1:M
            nets.(varargin{2}{m}).adj = varargin{1}(:,:,m);
        end
    else
        for m=1:M
            nets.(['network' num2str(m)]).adj = varargin{1}(:,:,m);
        end
        dis.nodeNames = varargin{2};
    end

    webwebWrite(dis,nets);
    return
end

if nargin==3
    nets = struct;
    dis = struct;
    % check to disambiguate netNames or nodeNames
    % if M == N, this is confusing...
    if M == size(varargin{1}(:,:,1))
        isNetNames = input('Are the first labels that you passed network names? (y/n) ');
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
        if a==M
            netNames = varargin{2};
            nodeNames = varargin{3};
        else
            netNames = varargin{3};
            nodeNames = varargin{2};
        end
    end

    for m=1:M
        nets.(netNames{m}).adj = varargin{1}(:,:,m);
    end
    dis.nodeNames = nodeNames;

    webwebWrite(dis,nets);
    return
end

end

function webwebWrite(dis, nets)
%webwebloc = '~/Desktop/webweb/';
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
fprintf(fid,'var a = {');
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
if isfield(dis,'nodeNames')
    fprintf(fid,'"nodeNames":[');
    for i=1:length(dis.nodeNames)
        fprintf(fid,'"%s",',dis.nodeNames{i});
    end
    fprintf(fid,'],');
end
fprintf(fid,'"labels":{');
if isfield(dis,'labels')
    q = dis.labels;
    qNames = fieldnames(q);
    for i=1:length(qNames)
        fprintf(fid,'"%s":{',qNames{i});
        fprintf(fid,'"type":"%s",',q.(qNames{i}).type);
        fprintf(fid,'"value":[');
        if iscell(q.(qNames{i}).values)
            for j=1:length(q.(qNames{i}).values)
                fprintf(fid,'"%s",',q.(qNames{i}).values{j});
            end
        else
            for j=1:length(q.(qNames{i}).values)
                fprintf(fid,'%i,',q.(qNames{i}).values(j));
            end
        end
        fprintf(fid,'],');
        if isfield(q.(qNames{i}),'categories')
            fprintf(fid,'"categories":[');
            for j=1:length(q.(qNames{i}).categories)
                fprintf(fid,'"%s",',q.(qNames{i}).categories{j});
            end
            fprintf(fid,'],');
        end
        fprintf(fid,'},');
    end
end
fprintf(fid,'},');
fprintf(fid,'},');

fprintf(fid,'"network":{');
for i=1:length(networkNames)
    p = getfield(nets,networkNames{i});
    fprintf(fid,'"%s":{',networkNames{i});
    fprintf(fid,'"adjList":[');
    [r,c,v] = find(p.adj);
    for j=1:length(v)
        fprintf(fid,'[%i,%i,%i],',r(j)-1,c(j)-1,v(j));
    end
    fprintf(fid,'],');
    fprintf(fid,'"labels":{');
    if isfield(p,'labels')
        q = p.labels;
        qNames = fieldnames(q);
        for ii=1:length(qNames)
            fprintf(fid,'"%s":{',qNames{ii});
            fprintf(fid,'"type":"%s",',q.(qNames{ii}).type);
            fprintf(fid,'"value":[');
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
fprintf(fid,'<!DOCTYPE html>');
fprintf(fid,'<html>');
fprintf(fid,'<head>');
fprintf(fid,'<title>webweb</title>');
fprintf(fid,'<script src="d3.v3.min.js"></script>');
fprintf(fid,'<link   type="text/css"         rel="stylesheet" href="style.css"/>');
fprintf(fid,'<script type="text/javascript"  src="%s.json"></script>',name);
fprintf(fid,'</head>');
fprintf(fid,'<body>');
fprintf(fid,'<script type="text/javascript"  src ="Blob.js"></script>');
fprintf(fid,'<script type="text/javascript"  src ="FileSaver.min.js"></script>');
fprintf(fid,'<script type="text/javascript"  src ="webweb.v3.js"></script>');
fprintf(fid,'</body>');
fprintf(fid,'</html>');
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
