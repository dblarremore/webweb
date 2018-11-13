from webweb.webweb import webweb
import random

if __name__ == '__main__':
    # Build a simple network
    N = 100
    adjaceny_list = [[random.randint(0, N-1), random.randint(0, N-1), 1] for _ in range(N)]

    # Instantiate webweb object
    web = webweb()

    # Assign adjaceny lists in network
    web.networks.simple.add_frame(adjaceny_list)

    # Launch webbrowser with result
    web.draw()
