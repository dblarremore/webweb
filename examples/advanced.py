from webweb.webweb import webweb

if __name__ == '__main__':
    # number of nodes
    N = 6

    # Instantiate webweb object
    web = webweb(num_nodes=N)

    # set the display width
    web.display.w = 200

    # set the display height
    web.display.h = 200

    # set the charge
    web.display.c = 50

    # set the gravity
    web.display.g = 0.3

    # Give the file a name
    web.display.name = 'Advanced'
    web.display.colorBy = 'slithering'
    web.display.sizeBy = 'hunger'
    web.display.scaleLinkWidth = True
    web.display.scaleLinkOpacity = True
    web.display.colorPalate = "Set2"
    # web.display.freezeNodeMovement = True
    # web.display.networkName = 'starfish'


    # Build a few networks
    web.networks.snake.adj = [[i, i+1, 1] for i in range(N-1)]
    web.networks.starfish.adj = [[0, i+1, 1] for i in range(N-1)]

    # Name the nodes
    web.display.nodeNames = ['dane', 'sebastian', 'manny', 'brock', 'ted', 'donnie']

    # add some top-level scalar labels. 
    # these will be shared by both of our networks
    # (nodes in both our snake network and our starfish network will have an
    # attribute 'hungry')
    web.display.labels.hunger.type = 'scalar'
    web.display.labels.hunger.value = [4,9,2,4,12.1,5]

    # Add some labels, binary, categorical, etc...
    web.networks.snake.labels.isHead.type = 'binary'
    web.networks.snake.labels.isHead.value = [0,0,0,0,0,1]

    web.networks.snake.labels.slithering.type = 'categorical'
    web.networks.snake.labels.slithering.value = [1,2,2,3,1,2]

    web.networks.starfish.labels.texture.type = 'categorical'
    web.networks.starfish.labels.texture.value = [1,3,0,2,0,1]
    # web.networks.starfish.labels.texture.categories = ['chewy','gooey','crunchy','fishy']

    web.networks.starfish.labels.power.type = 'scalar'
    web.networks.starfish.labels.power.value = [1,3,3.8,0.2,1,3.1415]

    # Launch webbrowser with result
    web.draw()
