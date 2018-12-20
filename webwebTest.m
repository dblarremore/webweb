% WEBWEB makes pretty interactive network diagrams in your browser
% http://github.com/dblarremore/webweb
% Daniel Larremore + Contributors
% Comments, suggestions, or forks always welcome.


% Constructing your own structs:
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

function webwebTest(varargin)

    % Set example num
    if nargin < 1
        example_num = 1;
        fprintf('To run a different test, pass webwebTest(n) any n from 1 to 7.\n');
    else
        example_num =  varargin{1};
    end
    
    examples = {@run_example_1, @run_example_2, @run_example_3,...
        @run_example_4, @run_example_5, @run_example_6, @run_example_7};
    examples{example_num}();

end

function run_example_1()
    % EXAMPLE 1
    % create a 100 node adjacency matrix A
    A = floor(1.01 * rand(100,100)); 
    A = A + A'; 
    A(A>0) = 1;
    webweb(A);
end

function run_example_2()
    % % EXAMPLE 2
    A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
    % make up some names
    for i=1:size(A,1)
        nodeNames{i} = ['node number ' num2str(i-1)];
    end
    webweb(A,nodeNames);
end

function run_example_3()
    % % EXAMPLE 3
    % % or make up another adjacency matrix
    A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
    B = floor(1.02*rand(100,100)); B=B+B'; B(B>0) = 1;
    nets(:,:,1) = A;
    nets(:,:,2) = B;
    webweb(nets);
end

function run_example_4()
    % % EXAMPLE 4
    % % or pass it nodeNames
    A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
    B = floor(1.02*rand(100,100)); B=B+B'; B(B>0) = 1;
    nets(:,:,1) = A;
    nets(:,:,2) = B;
    for i=1:size(A,1)
        nodeNames{i} = ['node number ' num2str(i-1)];
    end
    webweb(nets,nodeNames);
end

function run_example_5()
    % % EXAMPLE 5
    % % and maybe the networks have names
    A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
    B = floor(1.02*rand(100,100)); B=B+B'; B(B>0) = 1;
    nets(:,:,1) = A;
    nets(:,:,2) = B;
    netNames{1} = 'robotNetwork';
    netNames{2} = 'humanNetwork';
    webweb(nets,netNames);
end


function run_example_6()
    % % EXAMPLES 6 and 7
    % % or pass it both, in any order
    A = floor(1.01*rand(100,100)); A=A+A'; A(A>0) = 1;
    B = floor(1.02*rand(100,100)); B=B+B'; B(B>0) = 1;
    nets(:,:,1) = A;
    nets(:,:,2) = B;
    for i=1:size(A,1)
        nodeNames{i} = ['node number ' num2str(i-1)];
    end
    netNames{1} = 'robotNetwork';
    netNames{2} = 'humanNetwork';
%     webweb(nets,nodeNames,netNames);
    pause(1); % so files don't get overwritten too fast
    webweb(nets,netNames,nodeNames);

end


function run_example_7()
    
    % Advanced Usage Example
    % Make the display a small square
    dis.w = 500;
    dis.h = 500;
    % Increase the charge and the gravity
    dis.c = 100;
    dis.g = 0.3;
    % Give the file a name
    dis.name = 'Advanced';
    % Name the nodes
    dis.nodeNames = {'dane','sebastian','manny','brock','ted','donnie'};
    % Give the nodes some labels called hunger that are scalars
    dis.labels.hunger.type = 'scalar';
    dis.labels.hunger.values = [4,9,2,4,12.1,5];
    % Build a few networks
    snake(1,2) = 1;
    snake(2,3) = 2;
    snake(3,4) = 3;
    snake(4,5) = 4;
    snake(5,6) = 5;
    starfish(1,2) = 1;
    starfish(1,3) = 1;
    starfish(1,4) = 1;
    starfish(1,5) = 1;
    starfish(1,6) = 1;
    % put them into netObjects
    nets.snake.adj = snake;
    nets.starfish.adj = starfish;
    % Add some labels, binary, categorical, etc...
    nets.snake.labels.isHead.type = 'binary';
    nets.snake.labels.isHead.values = [0,0,0,0,0,1];
    nets.snake.labels.slithering.type = 'categorical';
    nets.snake.labels.slithering.values = [1,2,2,3,1,2];
    nets.starfish.labels.texture.type = 'categorical';
    nets.starfish.labels.texture.values = [1,3,0,2,0,1];
    nets.starfish.labels.texture.categories = {'chewy','gooey','crunchy','fishy'};
    nets.starfish.labels.power.type = 'scalar';
    nets.starfish.labels.power.values = [1,3,3.8,0.2,1,3.1415];
    % call webweb
    webweb(dis,nets) %or webweb(nets,dis);
end




