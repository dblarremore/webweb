from webweb import Web
import json

with open('test_data.json', 'r') as f:
    test_content = json.load(f)

layers = test_content.pop('layers')
metadata = test_content.pop('metadata')

web = Web(**test_content)

for layer in layers:
    web.networks.test_visualization.add_layer(adjacency=layer, metadata=metadata)

web.show()
