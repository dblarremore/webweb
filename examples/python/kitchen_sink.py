from webweb import Web
import random

web = Web(title='kitchen_sink')

################################################################################
# Stochastic Block Model network
################################################################################
# let's generate a graph using the Stochastic Block Model

# choose sizes of communities
c1, c2, c3 = 15, 20, 25

# group memberships, z
z = [0 for _ in range(c1)] + [1 for _ in range(c2)] + [2 for _ in range(c3)]

# group affinity matrix
M = [[ 0.25, 0.02, 0    ],
     [ 0.02, 0.2,  0.02 ],
     [ 0,    0.02, 0.15 ]]

# SBM
edge_list = []
for i in range(c1 + c2 + c3):
    for j in range(i):
        if random.random() < M[z[i]][z[j]]:
            edge_list.append([i,j])

web.networks.sbm(adjacency=edge_list, metadata={'community': {'values' : z}})

################################################################################
# Zachary Karate Club
################################################################################
web.networks.zkc(
    adjacency=[[2,1],[3,1],[3,2],[4,1],[4,2],[4,3],[5,1],[6,1],[7,1],[7,5],[7,6],[8,1],[8,2],[8,3],[8,4],[9,1],[9,3],[10,3],[11,1],[11,5],[11,6],[12,1],[13,1],[13,4],[14,1],[14,2],[14,3],[14,4],[17,6],[17,7],[18,1],[18,2],[20,1],[20,2],[22,1],[22,2],[26,24],[26,25],[28,3],[28,24],[28,25],[29,3],[30,24],[30,27],[31,2],[31,9],[32,1],[32,25],[32,26],[32,29],[33,3],[33,9],[33,15],[33,16],[33,19],[33,21],[33,23],[33,24],[33,30],[33,31],[33,32],[34,9],[34,10],[34,14],[34,15],[34,16],[34,19],[34,20],[34,21],[34,23],[34,24],[34,27],[34,28],[34,29],[34,30],[34,31],[34,32],[34,33]],
    nodes={1 : { 'headHoncho' : True}, 34 : {'headHoncho' : True}},
    metadata={
        'name' : {
            'values' : ["Bernita Blizzard", "Lauran Lenahan", "Kallie Kerr", "Yun Yearsley", "Krystina Kehr", "Marisa Mccullough", "Sandra Soderquist", "Latisha Luczynski", "Gertrudis Guadarrama", "Ramonita Raley", "Tessa Tuff", "Michell Murphey", "Juliana Jenny", "Imogene Ivie", "Ricky Revis", "Tonia Tighe", "Lyle Lamanna", "Michael Motto", "Charlie Cartwright", "Aimee Aschenbrenner", "Vi Vallery", "Shaquana Stocking", "Penelope Percival", "Bari Barrentine", "Janie Jeske", "Breann Brodie", "Carmel Clara", "Nada Nicol", "Francisca Fu", "Shyla Schranz", "Clarissa Crooks", "Hilario Holzwarth", "Huong Hodge", "Lavonne Leng",]
        }
    }
)
################################################################################
# Tree/Ring network (N-Cayley tree)
################################################################################
# let's make a tree network with 4 layers and a branching factor of 5
tree_layers = 4
branching_factor = 5

nodes_queue = [0]

edge_list = []
nodes = {}
for tree_layer in range(tree_layers):
    new_nodes_queue = []

    while len(nodes_queue):
        node = nodes_queue.pop(0)
        nodes[node] = { 'ring' : tree_layer }
        for _ in range(branching_factor):
            new_node = max(nodes.keys()) + 1
            edge_list.append([node, new_node])
            new_nodes_queue.append(new_node)
            nodes[new_node] = { 'ring' : tree_layer + 1 }
    
    nodes_queue = new_nodes_queue
    web.networks.tree.add_layer(adjacency=edge_list, nodes=nodes)

web.display.metadata = {
    'ring' : {
        'type' : 'categorical',
    }
}

web.display.networkName = 'tree'
web.display.networkLayer = 3
web.display.colorBy = 'ring'
web.display.sizeBy = 'degree'
web.display.gravity = .3
web.display.charge = 30
web.display.linkLength = 15
web.display.colorPalette = 'Greens'
web.display.scaleLinkOpacity = True
web.display.scaleLinkWidth = True

# show the visualization
web.show()
