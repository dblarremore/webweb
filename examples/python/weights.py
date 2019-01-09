from webweb.webweb import webweb

# Build a simple network
adjaceny_list = [[0, 1, 1], [1, 2, 15], [2, 3, 10], [3, 4, 100], [4, 5, 70], [0, 3, 25]]

# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.simple.add_layer(adjaceny_list)

# link widths will be scaled by their weight
web.display.scaleLinkWidth = True

# link opacity will be scaled by their weight
web.display.scaleLinkOpacity = True

# Launch webbrowser with result
web.draw()

