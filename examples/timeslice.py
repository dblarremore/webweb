from webweb.webweb import webweb
import random

if __name__ == '__main__':
    web = webweb()

    # add the first `frame`
    web.networks.simple.add_frame(
        [[0, 1], [1, 2], [2, 3]],
        {
            'isHead' : {
                'value' : [ False, False, False, True ],
            } 
        },
        4,
    )

    # add the second `frame` 
    # oroboros!
    # the snake is biting it's tail.
    web.networks.simple.add_frame(
        [[0, 1], [1, 2], [2, 3], [3, 0]],
        {
            'isHead' : {
                'value' : [ False, False, False, True ],
            } 
        },
        4,
    )

    # the snake is eating itself. wooo
    web.networks.simple.add_frame(
        [[0, 1], [1, 2], [2, 0]],
        {
            'isHead' : {
                'value' : [ False, False, True ],
            } 
        },
        3,
    )

    web.networks.simple.add_frame(
        [[0, 1], [1, 0]],
        {
            'isHead' : {
                'value' : [ False, True ],
            } 
        },
        2,
    )

    web.networks.simple.add_frame(
        [],
        {
            'isHead' : {
                'value' : [ True ],
            } 
        },
        1,
    )

    # display the first frame first (you could put, say, 1 here and it would display the second)
    web.display.networkFrame = 0

    # color by the head attribute
    web.display.colorBy = 'isHead'

    web.draw()
