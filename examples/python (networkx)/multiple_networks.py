from webweb import Web
import networkx as nx

# define the node names and a hunger metadata attribute to appear in all networks
web = Web(
    display={
        'nodes' : {
            0 : {
                'name' : 'dane',
                'hunger' : 4,
            },
            1 : {
                'name' : 'sebastian',
                'hunger' : 9,
            },
            2 : {
                'name' : 'manny',
                'hunger' : 2,
            },
            3 : {
                'name' : 'brock',
                'hunger' : 4,
            },
            4 : {
                'name' : 'ted',
                'hunger' : 12.1,
            },
            5 : {
                'name' : 'donnie',
                'hunger' : 5,
            },
        }
    },
)

snake = nx.Graph()
snake.add_edges_from([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])
snake.nodes[0]['isHead'] = False
snake.nodes[1]['isHead'] = False
snake.nodes[2]['isHead'] = False
snake.nodes[3]['isHead'] = False
snake.nodes[4]['isHead'] = False
snake.nodes[5]['isHead'] = True

# add the 'snake' network
web.networks.snake(nx_G=snake)

starfish = nx.Graph()
starfish.add_edges_from([[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]])
starfish.nodes[0]['texture'] = 'gooey'
starfish.nodes[0]['power'] = 1
starfish.nodes[1]['texture'] = 'fishy'
starfish.nodes[0]['power'] = 3
starfish.nodes[2]['texture'] = 'chewy'
starfish.nodes[0]['power'] = 3.8
starfish.nodes[3]['texture'] = 'crunchy'
starfish.nodes[0]['power'] = 0.2
starfish.nodes[4]['texture'] = 'chewy'
starfish.nodes[0]['power'] = 1
starfish.nodes[5]['texture'] = 'gooey'
starfish.nodes[0]['power'] = 3.1415

# add the 'starfish' network
web.networks.starfish(nx_G=starfish)

# display the `snake` network first
web.display.networkName = 'starfish'

# we'll compute node color by the `hunger` attribute
web.display.colorBy = 'texture'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'hunger'

# open the browser with the result
web.draw()
