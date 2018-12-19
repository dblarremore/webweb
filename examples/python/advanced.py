from webweb.webweb import webweb

# Instantiate webweb object
web = webweb()

# number of nodes
N = 6

# set the display width
web.display.w = 200

# set the display height
web.display.h = 200

# set the gravity
web.display.g = 0.3

# Give the file a name
web.display.name = 'Advanced'

# links will be 20 pixels long
web.display.l = 20

# nodes will have a charge of 200
web.display.c = 200

# display the `snake` network first
web.display.networkName = 'snake'

# we'll compute node color by the `hunger` attribute
web.display.colorBy = 'hunger'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

# set the default color palette for non-scalars
web.display.colorPalette = "Set2"

# we'll invert the sizing of isHead (false will be big, true will be small)
# if colorBy was a binary label, we could also set web.display.inverBinaryColors to True.
web.display.invertBinarySizes = True

# Build a few networks
web.networks.snake.add_layer(
    # the adjacency
    [[i + 1, i+2] for i in range(N-1)],
    # the labels
    {
        'isHead' : {
            # the length of this array should equal the number of nodes
            'value' : [ False, False, False, False, False, True ],
        },
        'slithering' : {
            # type can be 'scalar', 'binary', or 'categorical'
            # if you use True/False, webweb will know it's binary
            # if you use strings for categories, webweb will know it's
            # categorical
            'type' : 'categorical',
            'value' : [1,2,2,3,1,2],
        }
    }
)

web.networks.starfish.add_layer(
    [[0, i+1] for i in range(N-1)],
    {
        'texture' : {
            # we don't have to put a type since the values are strings
            'value' : ['gooey', 'fishy', 'chewy','crunchy', 'chewy', 'gooey'],
        },
        'power' : {
            # we don't have to put a type since scalar is the default
            'value' : [1,3,3.8,0.2,1,3.1415],
        }
    }
)

# Name the nodes
web.display.nodeNames = ['dane', 'sebastian', 'manny', 'brock', 'ted', 'donnie']

# add some top-level scalar labels. 
# these will be shared by both of our networks
# (nodes in both our snake network and our starfish network will have an
# attribute 'hungry')
web.display.labels.hunger.type = 'scalar'
web.display.labels.hunger.value = [4,9,2,4,12.1,5]

web.networks.small_snake.add_layer(
    [[i, i+1] for i in range(N-3)],
    # this snake has only 4 nodes
    nodes=4,
)

web.draw()
