from modules.webweb import webweb
import random

def simple_example():
    # Build a simple network
    N = 100
    adjaceny_list = [[random.randint(0, N-1), random.randint(0, N-1), 1] for _ in range(100)]

    # Instantiate webweb object
    web = webweb()

    # Assign adjaceny lists in network
    web.networks.simple.adj = adjaceny_list

    # Save as json with name "advanced_example"
    web.save_json("simple_example")

    # Launch webbrowser with result
    web.draw()


def simple_example_2():

    # Build a simple network
    N = 100
    adjaceny_list = [[random.randint(0, N), random.randint(0, N), 1] for _ in range(N)]
    node_names = ["example class {}".format(node_i) for node_i in range(N)]

    # Instantiate webweb object
    web = webweb()

    # Assign adjaceny lists in network
    web.networks.simple.adj = adjaceny_list

    # Assign node names
    web.display.nodeNames = node_names

    # Save as json with name "advanced_example"
    web.save_json("simple_example_2")

    # Launch webbrowser with result
    web.draw()

def advanced_example():
    # Build a few networks
    snake_adacency_list = [[i, i+1, 1] for i in range(5)]
    starfish_adacency_list = [[0, i+1, 1] for i in range(5)]

    # Instantiate webweb object
    web = webweb()

    # Set Display settings
    # ----------------------------------------
    web.display.w = 200
    web.display.h = 200

    # Increase the charge and the gravity
    web.display.c = 50
    web.display.g = 0.3

    # Give the file a name
    web.display.name = 'Advanced'

    # Name the nodes
    web.display.nodeNames = ['dane','sebastian','manny','brock','ted','donnie']

    # Give the nodes some labels called hunger that are scalars
    web.display.labels.hunger.type = 'scalar'
    web.display.labels.hunger.value = [4,9,2,4,12.1,5]
    # ----------------------------------------

    # Set Networks
    # ----------------------------------------
    # Assign adjaceny lists in network
    web.networks.snake.adj = snake_adacency_list
    web.networks.starfish.adj = starfish_adacency_list

    # Add some labels, binary, categorical, etc...
    web.networks.snake.labels.isHead.type = 'binary'
    web.networks.snake.labels.isHead.value = [0,0,0,0,0,1]
    web.networks.snake.labels.slithering.type = 'categorical'
    web.networks.snake.labels.slithering.value = [1,2,2,3,1,2]
    web.networks.starfish.labels.texture.type = 'categorical'
    web.networks.starfish.labels.texture.value = [1,3,0,2,0,1]
    web.networks.starfish.labels.texture.categories = ['chewy','gooey','crunchy','fishy']
    web.networks.starfish.labels.power.type = 'scalar'
    web.networks.starfish.labels.power.value = [1,3,3.8,0.2,1,3.1415]
    # ----------------------------------------

    # Save as json with name "advanced_example"
    web.save_json("advanced_example")

    # Launch webbrowser with result
    web.draw()

def main():
    examples = {
        "simple" : simple_example,
        "simple_2" : simple_example_2,
        "advanced" : advanced_example
    }

    # Run example
    examples["advanced"]()

if __name__ == '__main__':
    main()
