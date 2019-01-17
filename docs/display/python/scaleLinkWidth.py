from webweb import Web

# Instantiate webweb object
web = Web([[0, 1, 5], [1, 2, 20], [2, 3, .2], [3, 4, 70], [4, 5, 100]])

web.display.scaleLinkWidth = True

# Launch webbrowser with result
web.draw()
