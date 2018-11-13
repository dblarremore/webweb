from webweb.webweb import webweb
import random

if __name__ == '__main__':
    N = 100
    adjaceny_list = [[random.randint(0, N), random.randint(0, N), 1] for _ in range(N)]
    node_names = ["example class {}".format(node_i) for node_i in range(N)]

    # Instantiate webweb object
    web = webweb()

    # Assign adjaceny lists in network
    web.networks.simple.add_frame(adjaceny_list)

    # Assign node names
    web.display.nodeNames = node_names

    # Launch webbrowser with result
    web.draw()
