from webweb.webweb import webweb
import random

N = 100

adjaceny_list = [[random.randint(0, N), random.randint(0, N), 1] for _ in range(N)]

# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.simple.add_frame(adjaceny_list)

# Assign node names
web.display.nodeNames = ["example class {}".format(node_i) for node_i in range(N)]

# Launch webbrowser
web.draw()
