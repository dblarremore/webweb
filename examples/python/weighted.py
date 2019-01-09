from webweb.webweb import webweb

# Build a simple network
adjaceny_list = [[0, 1, 1], [1, 2, 15], [2, 3, 10], [3, 4, 100], [4, 5, 70], [0, 3, 25]]

# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.simple.add_layer(adjaceny_list)

# Launch webbrowser with result
web.draw()

