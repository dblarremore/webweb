from webweb import webweb

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])

# hide webweb's menus
web.display.hideMenu = True

# Launch webbrowser with result
web.draw()

