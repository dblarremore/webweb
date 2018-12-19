from webweb.webweb import webweb
import random

nodes = 20

# Build a simple network
adjaceny_list = [(i, i + 1) for i in range(nodes)] + [(0, nodes)]

# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.simple.add_layer(adjaceny_list)

# only show the visualization, no menus
web.display.showWebOnly = True

# Launch webbrowser with result
web.draw()
