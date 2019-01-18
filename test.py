from webweb import Web

adjacency = [[0 for __ in range(10)] for _ in range(10)]

adjacency[1][2] = 1
adjacency[2][1] = 1
adjacency[3][1] = 1

web = Web(adjacency=adjacency)

web.draw()
