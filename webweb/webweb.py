# Python version of webweb originally created by Michael Iuzzolino
# Cleaned up and harmonized with existing versions by Daniel Larremore
# Altered significantly and maintained by Hunter Wapman
#
# Daniel Larremore + Contributors
# January 10, 2019
# daniel.larremore@colorado.edu
# http://github.com/dblarremore/webweb Comments and suggestions always welcome.


import copy
import json
import webbrowser
import tempfile
import numpy as np
from pathlib import Path
import uuid
import sys

sys.path.append(str(Path(__file__).parent))

import pygmlion


class Web(dict):
    """a webweb object:
    a collection of:
    - named webweb Network objects
    - a set of display parameters
    - and (optionally) a title
    """

    def __init__(
        self,
        adjacency=[],
        title="webweb",
        display={},
        adjacency_type=None,
        nodes={},
        metadata=None,
        nx_G=None,
        gml_file=None,
        path=None,
    ):
        """
        usage:
        - `web = Web(adjacency=[[0, 1]], title='a web woohoo')`

        parameters:
        - `adjacency`: edge list or adjacency matrix
        - `title`: string. Will set the html title of the visualization if
          `display.attachWebwebToElementWithId = None`
        - `display`: dictionary of display parameters
        - `adjacency_type`: string. 'matrix' or 'edge list'
        - `nodes`: dict of node attribute dicts
        ```json
        {
            'key1': {
                'attribute1': 'value1',
                ...
            },
            ...
        }
        ```
        - `metadata`: dict of vectorized metadata and display information.
        ```python
        {
            'attribute': {
                'values': [ "attribute_value", ...],

                # `categories` only needs to be supplied if `values` holds
                # categorical data that is represented by numbers.
                # the values in the `values` array will be used as indexes to
                # this array.
                'categories': ["category1", "category2", ...]

                # `type` only needs to be set if you're displaying binary
                # information with 0/1 instead of True/False
                'type': 'binary',
            }
        }
        ```
        - `nx_G`: a networkx graph.
        - `gml_file`: path to a gml file

        ---

        nodes which appear in both the adjacency and as keys in the `nodes`
        dictionary will be given the values of the attributes under their
        corresponding key in the `nodes` dictionary

        `adjacency_type` only needs to be supplied if your adjacency is
        represented as a matrix and that matrix has 3 or fewer nodes
        """
        self.title = title
        self.display = Display(display)
        self.networks = Networks()

        self.ipython_display = self.in_ipython_frontend()

        # if we have an adjacency, add it into the networks object
        if len(adjacency) or nx_G or gml_file:
            getattr(self.networks, self.title)(
                adjacency=adjacency,
                adjacency_type=adjacency_type,
                nodes=nodes,
                metadata=metadata,
                nx_G=nx_G,
                gml_file=gml_file,
            )
        elif path:
            g = self.attempt_to_read(path)

            if g:
                getattr(self.networks, self.title)(
                    nodes=nodes,
                    metadata=metadata,
                    nx_G=g,
                )

    @staticmethod
    def in_ipython_frontend():
        """
        Check if we're inside an an IPython zmq frontend.

        Returns
        -------
        bool

        CREDIT: PANDAS
        """
        try:
            ip = get_ipython()  # noqa
            return "zmq" in str(type(ip)).lower()
        except NameError:
            pass

        return False

    @staticmethod
    def attempt_to_read(path):
        nx_methods = [
            'read_edgelist',
            'read_weighted_edgelist',
            'read_adjlist',
            'read_multiline_adjlist',
            'read_gexf',
            'read_gml',
            'read_gpickle',
            'read_graphml',
            'node_link_data',
            'node_link_graph',
            'adjacency_data',
            'adjacency_graph',
            'cytoscape_data',
            'cytoscape_graph',
            'tree_data',
            'tree_graph',
            'jit_data',
            'jit_graph',
            'read_leda',
            'read_yaml',
            'read_pajek',
            'read_shp',
        ]

        for method in nx_methods:
            try:
                import networkx.readwrite
                return getattr(networkx.readwrite, method)(path)
            except:
                pass

    @staticmethod
    def base_path():
        return Path(__file__).resolve().parent

    @classmethod
    def production_client_path(cls):
        return cls.base_path().joinpath('client')

    @classmethod
    def development_client_path(cls):
        return cls.base_path().parent.joinpath('client')

    @classmethod
    def client_path(cls):
        """
        there are two cases:
        1. where the client directory is local to this file's directory (when
           we distribute via pip)
        2. where the client directory is in the parent directory (local development)
        """
        production_client_path = cls.production_client_path()
        development_client_path = cls.development_client_path()

        if development_client_path.exists():
            client_path = development_client_path
        else:
            client_path = production_client_path

        return client_path

    @classmethod
    def client_file_path(cls, dir_name, file_name):
        return cls.client_path().joinpath(dir_name, file_name)

    @classmethod
    def get_client_file_content(cls, dir_name, file_name):
        return cls.client_file_path(dir_name, file_name).read_text()

    @staticmethod
    def html_path(unique=True):
        filename = str(uuid.uuid4()) + '-' if unique else ''
        filename += 'webweb.html'
        return Path(tempfile.gettempdir()).joinpath(filename)

    def show(self):
        """display the webweb visualization.
        - creates the html file
        - opens the web browser
        """

        if self.ipython_display:
            path = Path.cwd().joinpath(self.html_path().name)
            path.write_text(self.html)

            import IPython.display
            return IPython.display.IFrame(src=str(path.name), width=800, height=800)
        else:
            path = self.html_path()
            path.write_text(self.html)
            webbrowser.open_new("file://" + str(path))

    def save(self, path):
        """saves the webweb visualization to the specified path

        parameters:
        - path: the path to save to.
        """
        with open(path, 'w') as f:
            f.write(self.html)

    @property
    def json(self):
        data = {
            "display": vars(self.display),
            'networks': {name: vars(data) for name, data in
                         vars(self.networks).items()},
            "title": self.title,
        }

        return json.dumps(self.safe_serialize(data))

    def safe_serialize(self, data):
        """try to handle numpy datatypes gracefully"""
        if type(data) == list:
            return [self.safe_serialize(x) for x in data]
        elif type(data) == dict:
            return {self.safe_serialize(key): self.safe_serialize(val) for
                    key, val in data.items()}
        else:
            if type(data) in [str, int, float]:
                return data
            else:
                if hasattr(data, 'item'):
                    return data.item()
                else:
                    return data

    @property
    def html(self):
        return """
            <html>
                <head>
                    <script type="text/javascript">{webwebbundlejs}</script>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                    <script type="text/javascript">
                        var web = new Webweb.Webweb({json});
                    </script>
                </body>
            </html>
        """.format(
            json=self.json,
            webwebbundlejs=self.get_client_file_content('js', 'webweb.bundle.js'),
        )


class Display(dict):
    def __init__(self, kwargs):
        for key, val in kwargs.items():
            setattr(self, key, val)


class Networks(dict):
    def __getattr__(self, name, **kwargs):
        if not self.__dict__.get(name):
            self.__dict__[name] = Network(**kwargs)

        return self.__dict__[name]


class Network(dict):
    """a webweb Network object"""

    def __init__(self, **kwargs):
        """calling a `webweb.Network` object sets the first layer of that
        `webweb.Network` object using the parameters passed.

        if the object already had layers, those layers will be removed.

        see `add_layer` for parameter information
        """
        self.layers = []

        if len(kwargs.keys()):
            self.__call__(**kwargs)

    @staticmethod
    def get_gml_graphs(gml_file):
        return pygmlion.get_gml(gml_file).pop('graph', [])

    def __call__(self, **kwargs):
        # treat calling the object as resetting it
        self.layers = []

        gml_file = kwargs.pop('gml_file', '')
        if gml_file:
            for graph in self.get_gml_graphs(gml_file):
                kwargs['adjacency'], kwargs[
                    'nodes'] = self.read_graph_from_gml(graph)
                self.add_layer(**kwargs)
        elif len(kwargs.keys()):
            self.add_layer(**kwargs)

    def add_layer(
            self,
            adjacency=[],
            adjacency_type=None,
            nodes={},
            metadata=None,
            nx_G=None,
            gml_file=None
    ):
        """adds a layer to the network.

        parameters:
        - `adjacency`: edge list or adjacency matrix
        - `adjacency_type`: string. 'matrix' or 'edge list'
        - `nodes`: dict of node attribute dicts
        ```json
        {
            'key1': {
                'attribute1': 'value1',
                ...
            },
            ...
        }
        ```
        - `metadata`: dict of vectorized metadata and display information.
        ```python
        {
            'attribute': {
                'values': [ "attribute_value", ...],

                # `categories` only needs to be supplied if `values` holds
                # categorical data that is represented by numbers.
                # the values in the `values` array will be used as indexes to
                # this array.
                'categories': ["category1", "category2", ...]

                # `type` only needs to be set if you're displaying binary
                # information with 0/1 instead of True/False
                'type': 'binary',
            }
        }
        ```
        - `nx_G`: a networkx graph.
        - `gml_file`: path to a gml file

        ---

        nodes which appear in both the adjacency and as keys in the `nodes`
        dictionary will be given the values of the attributes under their
        corresponding key in the `nodes` dictionary

        `adjacency_type` only needs to be supplied if your adjacency is
        represented as a matrix and that matrix has 3 or fewer nodes

        no layer will be made without at least one of:
        - adjacency
        - nodes
        - metadata
        - nx_G
        - gml_file
        """
        if len(adjacency) and isinstance(adjacency, np.ndarray):
            new_adjacency = []
            for i, row in enumerate(adjacency.tolist()):
                new_adjacency.extend([[i, j, v] for j, v in enumerate(row) if v])

            adjacency = new_adjacency

        if nx_G:
            adjacency, nodes = self.get_adjacency_and_nodes_from_networkx_graph(
                nx_G)
        elif gml_file:
            graphs = self.get_gml_graphs(gml_file)

            if graphs:
                adjacency, nodes = self.read_graph_from_gml(graphs[0])
        elif adjacency:
            if not adjacency_type:
                adjacency_type = self.get_adjacency_type(adjacency)

            if adjacency_type == 'matrix':
                adjacency = self.convert_adjacency_matrix_to_list(adjacency)

        if adjacency or nodes or metadata:
            self.layers.append({
                'edgeList': copy.deepcopy(adjacency),
                'nodes': copy.deepcopy(nodes),
                'metadata': copy.deepcopy(metadata),
            })

    @staticmethod
    def get_adjacency_type(adjacency):
        """
        we use a dumb heuristic here:
        if the length of the list is the same as the length of the first
        element in the list, it's a matrix

        things are also only an adjacency if all elements in the first element are the same type
        """
        if len(adjacency) and len(adjacency) > 3:
            if len(adjacency) == len(adjacency[0]):
                if len({type(a) for a in adjacency[0]}) == 1:
                    return "matrix"

        return 'list'

    def convert_adjacency_matrix_to_list(self, matrix):
        edge_list = []

        # if the matrix is symmetric, only examine the upper triangular
        is_symmetric = self.adjacency_matrix_is_symmetric(matrix)

        for i in range(len(matrix)):
            for j in range(len(matrix)):
                if i == j:
                    continue

                if is_symmetric and j >= i:
                    continue

                weight = matrix[i][j]

                if weight:
                    edge_list.append([i, j, weight])

        return edge_list

    @staticmethod
    def adjacency_matrix_is_symmetric(matrix):
        for i in range(len(matrix)):
            for j in range(len(matrix)):
                if matrix[i][j] != matrix[j][i]:
                    return False
        return True

    @staticmethod
    def get_adjacency_and_nodes_from_networkx_graph(G):
        """loads the edges and attributes from a networkx graph"""
        adj = []

        for u, v, d in G.edges(data=True):
            edge = [u, v]
            if d.get('weight'):
                edge.append(d['weight'])
            adj.append(edge)

        nodes = {node: G.nodes[node] for node in G.nodes}

        for node, metadata in nodes.items():
            nodes[node]['name'] = metadata.get('name', node)

        return adj, nodes

    @staticmethod
    def get_name_from_gml_object(attribute, default=0):
        name_priorities = ['id', 'label', 'name']
        name = default
        for key in name_priorities:
            value = attribute.get(key)

            if value:
                name = value

        return str(name)

    def read_graph_from_gml(self, gml):
        gml_nodes = gml.get('node', [])
        node_ids = {n.get('id') for n in gml_nodes}

        unused_node_id = max(list(node_ids)) + 1
        nodes = {}
        for node in gml_nodes:
            # try to find a name
            _id = node.get('id', None)

            if _id is None:
                _id = unused_node_id
                unused_node_id += 1

            nodes[_id] = {
                'name': self.get_name_from_gml_object(node, default=_id)
            }

            for key, value in node.items():
                # this currently doesn't do graphical attributes like `x` and `y`
                if type(value) in [str, float, int]:
                    if key not in ['id', 'label']:
                        nodes[_id][key] = value
                elif key == 'graphics':
                    for subvalue in value:
                        if type(subvalue) == dict:
                            for subkey, subsubvalue in subvalue.items():
                                if subkey in ['x', 'y']:
                                    nodes[_id][subkey] = subsubvalue

        adjacency = []
        for edge in gml.get('edge', []):
            source = edge.get('source')
            target = edge.get('target')

            if source and target:
                _edge = [source, target]

                weight = edge.get('weight')

                if weight:
                    _edge.append(weight)

                adjacency.append(_edge)

        return adjacency, nodes
