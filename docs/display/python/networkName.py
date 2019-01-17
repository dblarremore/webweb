from webweb import Web

# Instantiate webweb object
web = Web(title='web1', adjacency=[[0, 1]])

web.networks.web2(adjacency=[[0, 1], [1, 2]])

web.display.networkName = "web2"

# Launch webbrowser with result
web.draw()
