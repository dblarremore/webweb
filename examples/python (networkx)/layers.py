from webweb import Web
import networkx as nx

snake1 = nx.Graph()
snake1.add_edges_from([[0, 1], [1, 2], [2, 3]])

snake1.nodes[0]['isHead'] = True
snake1.nodes[1]['isHead'] = False
snake1.nodes[2]['isHead'] = False
snake1.nodes[3]['isHead'] = False

web = Web(
    title='oroboros',
    nx_G=snake1,
)

snake2 = nx.Graph()
snake2.add_edges_from([[0, 1], [1, 2], [2, 3], [3, 0]])

snake2.nodes[0]['isHead'] = True
snake2.nodes[1]['isHead'] = False
snake2.nodes[2]['isHead'] = False
snake2.nodes[3]['isHead'] = False

web.networks.oroboros.add_layer(nx_G=snake2)

snake3 = nx.Graph()
snake3.add_edges_from([[0, 1], [1, 2], [2, 0]])

snake3.nodes[0]['isHead'] = True
snake3.nodes[1]['isHead'] = False
snake3.nodes[2]['isHead'] = False

web.networks.oroboros.add_layer(nx_G=snake3)

snake4 = nx.Graph()
snake4.add_edges_from([[0, 1], [1, 0]])

snake4.nodes[0]['isHead'] = True
snake4.nodes[1]['isHead'] = False

web.networks.oroboros.add_layer(nx_G=snake4)

snake5 = nx.Graph()
snake5.add_node(0)

snake5.nodes[0]['isHead'] = True

web.networks.oroboros.add_layer(nx_G=snake5)

# display the first layer first (you could put, say, 1 here and it would display the second)
web.display.networkLayer = 0

# we'll compute node color by the `isHead` attribute
web.display.colorBy = 'isHead'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

web.draw()
