from webweb.webweb import webweb
import random

# Build a simple network
N = 100

adjacency_matrix = [[0 for _ in range(N)] for _ in range(N)]

# let's make 100 edges
edges = 0
while edges < 100:
    node_one = random.randint(0, N-1)
    node_two = random.randint(0, N-1)

    # make sure the lower node number is node_one
    if node_one > node_two:
        node_one, node_two = node_two, node_two

    # don't make self loops or edges we've already made
    if node_one != node_two and not adjacency_matrix[node_one][node_two]:
        adjacency_matrix[node_one][node_two] = 1

    edges += 1


# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.simple.add_layer(adjacency_matrix)

# Launch webbrowser with result
web.draw()
