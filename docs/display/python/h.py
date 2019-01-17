from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])

web.display.h = 50

# Launch webbrowser with result
web.draw()
