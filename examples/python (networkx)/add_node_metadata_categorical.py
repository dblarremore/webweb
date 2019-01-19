from webweb import Web
import networkx as nx

# webweb'll display a metadata attribute as binary if every node's value for
# that attribute is either True or False.
G = nx.Graph()
G.add_edges_from([[0, 1], [1, 2]])

G.nodes[0]['cooperativity'] = 'high'
G.nodes[0]['alphabeticallity'] = 0

G.nodes[1]['cooperativity'] = 'low'
G.nodes[1]['alphabeticallity'] = 1

G.nodes[2]['cooperativity'] = 'medium'
G.nodes[2]['alphabeticallity'] = 2

# if the set of a metadata attribute's values contains strings (like
# 'cooperativity' here), webweb'll display it as a categorical variable.

# if that set contains numbers (like 'alphabeticallity' here), you should tell
# webweb how to display it by adding that metadata attribute name to the
# `metadataInfo` key to the `display` attribute with an array under
# `categories`; a node's value for this metadata attribute should be an index
# into this array.
web = Web(
    nx_G=G,
    display={
        'metadataInfo' : {
            'alphabeticallity' : {
                'categories' : ['A-Z', 'a-z', 'W+'],
            }
        },
    }
)

# we'll compute node color by the `alphabeticallity` metadata attribute
# (categorical metadata can't be used to compute node sizes)
web.display.colorBy = 'alphabeticallity'

# show the visualization
web.show()
