from webweb import Web
import random

# Give the webweb a title.
web = Web(title='kitchen_sink')

################################################################################
# Network 1 of 3: a stochastic block model (SBM)
# Features: a network w/ metadata
################################################################################

# Create an empty edge list, to be populated during network construction
edge_list = []

# group sizes
group_sizes = [15, 20, 25]

# probability of edges between groups
node_group = [0 for _ in range(group_sizes[0])]
node_group += [1 for _ in range(group_sizes[1])] 
node_group += [2 for _ in range(group_sizes[2])] 

# group affinity matrix
M = [[ 0.25, 0.02, 0    ],
     [ 0.02, 0.2,  0.02 ],
     [ 0,    0.02, 0.15 ]]

# SBM
for i in range(sum(group_sizes)):
    for j in range(i):
        if random.random() < M[node_group[i]][node_group[j]]:
            edge_list.append([i,j])

# create a network called sbm
web.networks.sbm(
    # assign its edgelist
    adjacency=edge_list,
    # give it the community metadata
    metadata={'community': 
        {
            'values' : node_group,
            # tell webweb to display the groups categorically
            'type' : 'categorical',
        },
    }
)

################################################################################
# Network 2 of 3: the Zachary Karate Club
# Feature: a network w/ node names and additional (binary) metadata
################################################################################

web.networks.zkc(
    adjacency=[[2,1],[3,1],[3,2],[4,1],[4,2],[4,3],[5,1],[6,1],[7,1],[7,5],[7,6],[8,1],[8,2],[8,3],[8,4],[9,1],[9,3],[10,3],[11,1],[11,5],[11,6],[12,1],[13,1],[13,4],[14,1],[14,2],[14,3],[14,4],[17,6],[17,7],[18,1],[18,2],[20,1],[20,2],[22,1],[22,2],[26,24],[26,25],[28,3],[28,24],[28,25],[29,3],[30,24],[30,27],[31,2],[31,9],[32,1],[32,25],[32,26],[32,29],[33,3],[33,9],[33,15],[33,16],[33,19],[33,21],[33,23],[33,24],[33,30],[33,31],[33,32],[34,9],[34,10],[34,14],[34,15],[34,16],[34,19],[34,20],[34,21],[34,23],[34,24],[34,27],[34,28],[34,29],[34,30],[34,31],[34,32],[34,33]],
    # assign some metadata to nodes by their id
    nodes={1 : { 'headHoncho' : True}, 34 : {'headHoncho' : True}},
    metadata={
        # use the reserved keyword 'name' to give names to nodes for displaying
        'name' : {
            'values' : ["Bernita Blizzard", "Lauran Lenahan", "Kallie Kerr", "Yun Yearsley", "Krystina Kehr", "Marisa Mccullough", "Sandra Soderquist", "Latisha Luczynski", "Gertrudis Guadarrama", "Ramonita Raley", "Tessa Tuff", "Michell Murphey", "Juliana Jenny", "Imogene Ivie", "Ricky Revis", "Tonia Tighe", "Lyle Lamanna", "Michael Motto", "Charlie Cartwright", "Aimee Aschenbrenner", "Vi Vallery", "Shaquana Stocking", "Penelope Percival", "Bari Barrentine", "Janie Jeske", "Breann Brodie", "Carmel Clara", "Nada Nicol", "Francisca Fu", "Shyla Schranz", "Clarissa Crooks", "Hilario Holzwarth", "Huong Hodge", "Lavonne Leng",]
        }
    }
)

################################################################################
# Network 3 of 3: Tree/Ring network (N-Cayley tree)
# Features: a multilayer network with different metadata for each layer
################################################################################

tree_layers = 4
branching_factor = 5

nodes_queue = [0]

# Create an empty edge list, to be populated during layer construction
edge_list = []
nodes = {}
for tree_layer in range(tree_layers):
    new_nodes_queue = []

    while len(nodes_queue):
        node = nodes_queue.pop(0)
        nodes[node] = { 'ring' : tree_layer }
        branches = branching_factor if tree_layer == 0 else branching_factor - 1
        for _ in range(branches):
            new_node = max(nodes.keys()) + 1
            edge_list.append([node, new_node])
            new_nodes_queue.append(new_node)
            nodes[new_node] = { 'ring' : tree_layer + 1 }
    
    nodes_queue = new_nodes_queue
    web.networks.tree.add_layer(adjacency=edge_list, nodes=nodes)

# tell webweb to display the metdata categorically
web.display.metadata = {
    'ring' : {
        'type' : 'categorical',
    }
}

################################################################################
# Display parameters choices and defaults
# Demonstrates: how to set default behavior for webweb on opening the html
################################################################################

web.display.networkName = 'tree'
web.display.networkLayer = 2
web.display.colorBy = 'ring'
web.display.sizeBy = 'degree'
web.display.gravity = .3
web.display.charge = 30
web.display.linkLength = 15
web.display.colorPalette = 'Greens'
web.display.scaleLinkOpacity = False
web.display.scaleLinkWidth = True

# show the visualization
web.show()
