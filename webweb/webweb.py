# Python version of webweb was originally created by Michael Iuzzolino
# Cleaned up and harmonized with existing versions by Daniel Larremore
# Altered significantly by Hunter Wapman
# version 4
#
# Daniel Larremore + Contributors
# January 10, 2019
# daniel.larremore@colorado.edu
# http://github.com/dblarremore/webweb Comments and suggestions always welcome.

import os
import copy
import json
import webbrowser
import requests
from collections import defaultdict

GITURL = "https://raw.githubusercontent.com/dblarremore/webweb/master"

class Web(dict):
    """a webweb object. 
    a collection of named webweb Network objects, a set of display parameters, and a title
    """
    def __init__(self, adjacency=None, title="webweb", display={}, **kwargs):
        """parameters:
        - adjacency: adjacency to make a visulization from. see `Network.add_layer`
        - title: string. Will set the html title of the visualization if display.attachWebwebToElementWithId = None
        - display: dictionary of display parameters
        - see `Network.add_layer` for all other parameters."""
        self.title = title
        self.display = Display(display)
        self.networks = Networks()

        # if we have an adjacency, add it into the networks object
        if adjacency or kwargs.get('nx_G'):
            kwargs['adjacency'] = adjacency
            getattr(self.networks, self.title)(**kwargs)

    @property
    def base_path(self):
        return os.path.dirname(os.path.realpath(__file__))


    @property
    def client_path(self):
        return os.path.abspath(os.path.join(self.base_path, 'client'))

    def get_client_content(self, dir_name, file_name):
        if not os.path.isdir(self.client_path):
            os.mkdir(self.client_path)

        dir_dir = os.path.join(self.client_path, dir_name)

        if not os.path.isdir(dir_dir):
            os.mkdir(dir_dir)

        content_path = os.path.join(dir_dir, file_name)
        if not os.path.exists(content_path):
            github_file_url = "/".join([GITURL, 'client', dir_name, file_name])
            content = requests.get(github_file_url).text

            with open(content_path, 'w') as f:
                f.write(content)
                return content
        else:
            with open(content_path, 'r') as f:
                content = f.read()

            return content

    def show(self):
        """display the webweb visualization.
        - creates the html file
        - opens the web browser
        """
        with open(self.html_file, 'w') as f:
            f.write(self.html)

        webbrowser.open_new("file://" + self.html_file)

    def save(self, path):
        """saves the webweb visualization to the specified path

        parameters: 
        - path: the path to save to.
        """
        with open(path, 'w') as f:
            f.write(self.html)

    @property
    def html_file(self):
        return os.path.join(self.base_path, "{}.html".format(self.title))

    @property
    def json(self, title=None):
        return json.dumps({
            "display" : vars(self.display),
            'networks' : { name : vars(data) for name, data in vars(self.networks).items()},
            "title" : self.title,
        })

    @property
    def html(self):
        return """
            <html>
                <head>
                    <script>{d3js}</script>
                    <style>{style}</style>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                    <script type="text/javascript">{colorsjs}</script>
                    <script type="text/javascript">{blobjs}</script>
                    <script type="text/javascript">{filesaverjs}</script>
                    <script type="text/javascript">var wwdata = {json};</script>
                    <script type="text/javascript">{webwebjs}</script>
                </body>
            </html>
        """.format(
            title=self.title,
            d3js=self.get_client_content('js', 'd3.v5.min.js'),
            style=self.get_client_content('css', 'style.css'),
            colorsjs=self.get_client_content('js', 'colors.js'),
            blobjs=self.get_client_content('js', 'Blob.js'),
            filesaverjs=self.get_client_content('js', 'FileSaver.min.js'),
            json=self.json,
            webwebjs=self.get_client_content('js', 'webweb.v5.js'),
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
    def __init__(self):
        self.layers = []

    def __call__(self, **kwargs):
        """see `add_layer`"""
        # if we have an adjacency, add it into the networks object
        if kwargs.get('adjacency'):
            self.add_layer(**kwargs)
        elif kwargs.get('nx_G'):
            self.add_layer(**kwargs)

    def add_layer(self, adjacency=None, adjacency_type=None, nodes=None,  metadata=None, nx_G=None):
        """adds a layer to the network.

        - adjacency: edge list or adjacency matrix
        - adjacency_type: string. 'matrix' or 'edge list'. Supply if passing an adjacency matrix with fewer than 3 nodes
        - nodes: dict of node attribute dicts
        - metadata: dict of vectorized metadata and display information. 
        ```{
            'attribute' : {
                'values' : [ "attribute_value", ...],
                'categories' : ["category1", "category2", ...] (supply if values is categorical but contains numbers; values in the `values` array will be used as indexes to this array)
                'type' : string. Only necessary if displaying binary information with 0/1 and not True/False.
            }
        }```
        - nx_G: a networkx graph.

        call with at least one of:
        - adjacency
        - nodes
        - metadata
        - nx_G
        """
        if nx_G:
            adjacency, nodes = self.get_adjacency_and_nodes_from_networkx_graph(nx_G)
        else:
            if not adjacency_type:
                if len(adjacency) and len(adjacency) > 3:
                    # we use a dumb heuristic here:
                    # if the length of the list is the same as the length of the first
                    # element in the list, it's a matrix
                    if len(adjacency) == len(adjacency[0]):
                        adjacency_type = "matrix"

            if adjacency_type == 'matrix':
                adjacency_length = len(adjacency)
                adjacency = self.convert_adjacency_matrix_to_list(adjacency)

                if not nodes:
                    nodes = {}

                for i in range(adjacency_length):
                    if not nodes.get(i, None):
                        nodes[i] = {}

        self.layers.append({
            'edgeList' : copy.deepcopy(adjacency),
            'nodes' : nodes,
            'metadata' : metadata,
        })

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

    def adjacency_matrix_is_symmetric(self, matrix):
        for i in range(len(matrix)):
            for j in range(len(matrix)):
                if matrix[i][j] != matrix[j][i]:
                    return False
        return True

    def get_adjacency_and_nodes_from_networkx_graph(self, G):
        """loads the edges and attributes from a networkx graph"""
        import networkx as nx
        adj = []

        for u, v, d in G.edges(data=True):
            edge = [u, v]
            if d.get('weight'):
                edge.append(d['weight'])
            adj.append(edge)

        nodes = { node : G.nodes[node] for node in G.nodes }

        for node, metadata in nodes.items():
            nodes[node]['name'] = metadata.get('name', node)

        return adj, nodes
