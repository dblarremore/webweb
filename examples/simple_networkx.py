from webweb.webweb import webweb
import networkx as nx
import random

if __name__ == '__main__':
    # make a simple gnp random graph
    G = nx.fast_gnp_random_graph(100, .15)

    # Instantiate webweb object
    web = webweb()

    # Assign adjaceny lists in network
    web.networks.networkx.add_frame_from_networkx_graph(G)

    # Launch webbrowser with result
    web.draw()
