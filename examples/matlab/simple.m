function run_example_1()
    % EXAMPLE 1
    % create a 100 node adjacency matrix A
    A = floor(1.01 * rand(100,100)); 
    A = A + A'; 
    A(A>0) = 1;
    webweb(A);
end
