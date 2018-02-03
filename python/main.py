# import local_dev_scripts.helper as helper
from modules.webweb import webweb

def dans_advanced_test():
    N = 6

    # Instantiate webweb object
    web = webweb(N)

    web.display.w = 100;
    web.display.h = 100;
    # Increase the charge and the gravity
    web.display.c = 100;
    web.display.g = 0.3;
    # Give the file a name
    web.display.name = 'Advanced';
    # Name the nodes
    web.display.nodeNames = ['dane','sebastian','manny','brock','ted','donnie'];
    # Give the nodes some labels called hunger that are scalars
    web.display.labels.hunger.type = 'scalar';
    web.display.labels.hunger.value = [4,9,2,4,12.1,5];

    # Build a few networks
    snake_adacency_list = [[i, i+1, 1] for i in range(N-1)]
    starfish_adacency_list = [[0, i+1, 1] for i in range(N-1)]


    # put them into netObjects
    web.networks.snake.adj = snake_adacency_list;
    web.networks.starfish.adj = starfish_adacency_list;

    # Add some labels, binary, categorical, etc...
    web.networks.snake.labels.isHead.type = 'binary';
    web.networks.snake.labels.isHead.value = [0,0,0,0,0,1];
    web.networks.snake.labels.slithering.type = 'categorical';
    web.networks.snake.labels.slithering.value = [1,2,2,3,1,2];
    web.networks.starfish.labels.texture.type = 'categorical';
    web.networks.starfish.labels.texture.value = [1,3,0,2,0,1];
    web.networks.starfish.labels.texture.categories = ['chewy','gooey','crunchy','fishy'];
    web.networks.starfish.labels.power.type = 'scalar';
    web.networks.starfish.labels.power.value = [1,3,3.8,0.2,1,3.1415];

    web.save_json("dan")

    web.draw()

def main():
    dans_advanced_test()

if __name__ == '__main__':
    main()
