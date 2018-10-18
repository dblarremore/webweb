from webweb.webweb import webweb
import random

if __name__ == '__main__':
    # Build a simple network
    N = 100
    adjaceny_list = [[random.randint(0, N-1), random.randint(0, N-1), 1] for _ in range(100)]

    # Instantiate webweb object
    web = webweb(num_nodes=N)

    # Assign adjaceny lists in network
    web.networks.simple.adj = adjaceny_list

    # Launch webbrowser with result
    web.draw()
