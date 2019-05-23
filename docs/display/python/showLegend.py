from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]])

# size and color by degree
web.display.sizeBy = 'degree'
web.display.colorBy = 'degree'

# hide webweb's legend (it defaults to being shown)
web.display.showLegend = False

# show the visualization
web.show()
