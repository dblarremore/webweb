from webweb import Web

# we can add node names by setting the 'nodes' attribute in the `display`
# variable
# a node in the adjacency list (e.g., 0 here) will have the metadata of the
# entry under the same key in the 'nodes' dictionary (if one exists)
web = Web(
    adjacency=[[0, 1], [1, 2]],
    display={
        'nodes' : {
            0 : {
                'name' : 'Huberg',
            },
            1 : {
                'name' : 'Pierot',
            },
            2 : {
                'name' : 'Slartibertfast',
            },
        },
    },
)

web.draw()
