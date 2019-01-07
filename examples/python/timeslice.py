from webweb.webweb import webweb
import random

web = webweb()

# add the first `layer`
web.networks.oroboros.add_layer(
    [[0, 1], [1, 2], [2, 3]],
    {
        'isHead' : {
            'value' : [ True, False, False, False],
        } 
    },
    4,
)

# add the second `layer` 
# oroboros!
# the snake is biting it's tail.
web.networks.oroboros.add_layer(
    [[0, 1], [1, 2], [2, 3], [3, 0]],
    {
        'isHead' : {
            'value' : [ True, False, False, False],
        } 
    },
    4,
)

# the snake is eating itself. wooo
web.networks.oroboros.add_layer(
    [[0, 1], [1, 2], [2, 0]],
    {
        'isHead' : {
            'value' : [ True, False, False],
        } 
    },
    3,
)

web.networks.oroboros.add_layer(
    [[0, 1], [1, 0]],
    {
        'isHead' : {
            'value' : [ True, False ],
        } 
    },
    2,
)

web.networks.oroboros.add_layer(
    [],
    {
        'isHead' : {
            'value' : [ True ],
        } 
    },
    1,
)

# display the first layer first (you could put, say, 1 here and it would display the second)
web.display.networkLayer = 0

# color by the head attribute
web.display.colorBy = 'isHead'

web.draw()
