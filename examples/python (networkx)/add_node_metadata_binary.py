from webweb import Web
import networkx as nx

# webweb'll display a metadata attribute as binary if every node's value for
# that attribute is either True or False.
G = nx.Graph()
G.add_edges_from([['Dan', 'Hunter'], ['Brian', 'Hunter'], ['Carl', 'Hunter'], ['Carl', 'Brian']])

G.nodes['Dan']['wearsGlasses'] = True
G.nodes['Hunter']['wearsGlasses'] = True
G.nodes['Brian']['wearsGlasses'] = True
G.nodes['Carl']['wearsGlasses'] = False

# `True` values will be "big" and `False` values small, but if we wanted the
# opposite, we could do the following:
# web.display.invertBinarySizes = True

# create the web
web = Web(nx_G=G)

# use the 'wearsGlasses' to compute node sizes
web.display.sizeBy = 'wearsGlasses'

# show the visualization
web.show()
