from webweb import Web
import networkx as nx

snake = nx.Graph()
snake.add_edges_from([[0, 1], [1, 2], [2, 3]])

snake.nodes[0]['isHead'] = True
snake.nodes[1]['isHead'] = False
snake.nodes[2]['isHead'] = False
snake.nodes[3]['isHead'] = False

web = Web(title='oroboros', nx_G=snake)

snake.add_edge(0, 3)

web.networks.oroboros.add_layer(nx_G=snake)

snake.remove_node(3)
snake.add_edge(0, 2)

web.networks.oroboros.add_layer(nx_G=snake)

snake.remove_node(2)
snake.add_edge(0, 1)

web.networks.oroboros.add_layer(nx_G=snake)

snake.remove_node(1)

web.networks.oroboros.add_layer(nx_G=snake)

# display the first layer first (you could put, say, 1 here and it would display the second)
web.display.networkLayer = 0

# we'll compute node color by the `isHead` attribute
web.display.colorBy = 'isHead'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

web.draw()
