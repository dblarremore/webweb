from webweb import Web
import json

with open('test_data.json', 'r') as f:
    test_content = json.load(f)

layers = test_content['layers']
display = test_content['display']

web = Web(title='test_visualization', display=display, adjacency=[[0, 1, 2], [1, 2, 3]])

web.networks.test_visualization.layers[0]['nodes'] = {
    0 : {
        'name' : 'Dan',
    },
    1 : {
        'name' : 'Hunter',
    },
    2 : {
        'name' : 'Steve',
    },
}

for layer in layers:
    web.networks.layered_test_visualization.add_layer(adjacency=layer)

web.show()
