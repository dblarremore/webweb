from webweb import Web
import networkx as nx

G = nx.MultiGraph()
G.add_edge(0, 1)
G.add_edge(0, 1)
G.add_edge(1, 2)
G.add_edge(2, 3)
# create the web

web = Web(nx_G=G)
web.networks.web2(
    adjacency=[[3, 4]],
    nodes={
        3: {
            'height': 'tall',
        },
        4: {
            'height': 'short',
        }

    }
)
web.networks.web2.add_layer(
    adjacency=[[2, 4], [5, 6]],
    nodes={
        3: {
            'height': 'tall',
        },
        4: {
            'height': 'short',
        },
        5: {
            'height': 'tall',
        },
        6: {
            'height': 'just right',
        }
    }
)
web.display.scaleLinkWidth = True
web.display.colorBy = 'degree'
web.display.sizeBy = 'degree'
web.display.networkName = 'web2'
web.display.networkLayer = 1
# show the visualization
web.show()

web.save('test.html')
