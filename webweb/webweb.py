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
from collections import defaultdict

class Web(dict):
    def __init__(self, adjacency=None, adjacency_type=None, nodes=None, title="webweb", display={}, nx_G=None, metadata=None):
        self.title = title
        self.display = Display(display)
        self.networks = Networks()

        # if we have an adjacency, add it into the networks object
        if adjacency:
            getattr(self.networks, self.title).add_layer(adjacency, adjacency_type=adjacency_type, nodes=nodes, metadata=metadata)
        elif nx_G:
            getattr(self.networks, self.title).add_layer(nx_G=nx_G)

    @property
    def base_path(self):
        return os.path.dirname(os.path.realpath(__file__))

    @property
    def client_path(self):
        parent = os.path.abspath(os.path.join(self.base_path, os.pardir))
        return os.path.join(parent, "client")

    def get_client_content(self, dir_name, file_name):
        content_path = os.path.join(self.client_path, dir_name, file_name)

        with open(content_path, 'r') as f:
            content = f.read()

        return content


    def draw(self):
        """
        1. saves the html file
        2. opens the web browser
        """
        with open(self.html_file, 'w') as f:
            f.write(self.html)

        webbrowser.open_new("file://" + self.html_file)

    @property
    def html_file(self):
        return os.path.join(self.base_path, "{}.html".format(self.title))

    @property
    def json(self, title=None):
        return json.dumps({
            "display" : vars(self.display),
            'networks' : { name : vars(data) for name, data in vars(self.networks).items()},
        })

    @property
    def html(self):
        return """
            <html>
                <head>
                    <title>webweb {title}</title>
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

        # self.N = num_nodes
        # self.name = name
        # self.w = w
        # self.h = h
        # self.l = l
        # self.r = r
        # self.c = c
        # self.g = g
        # self.nodeNames = nodeNames
        # self.metadata = {}
        # self.showWebOnly = showWebOnly

class Networks(dict):
    def __getattr__(self, name, **kwargs):
        if not self.__dict__.get(name):
            self.__dict__[name] = Network(**kwargs)

        return self.__dict__[name]

class Network(dict):
    def __init__(self, adjacency=None, nodes=None, adjacency_type=None, metadata=None, nx_G=None):
        self.layers = []

    def __call__(self, **kwargs):
        # if we have an adjacency, add it into the networks object
        if kwargs.get('adjacency'):
            self.add_layer(**kwargs)
        elif kwargs.get('nx_G'):
            self.add_layer(**kwargs)

    def add_layer(self, adjacency=None, nodes=None, adjacency_type=None, nx_G=None, metadata=None):
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
                    nodes[i] = {}

        self.layers.append({
            'edgeList' : copy.deepcopy(adjacency),
            'nodes' : nodes,
            'metadata' : metadata,
        })

    def convert_adjacency_matrix_to_list(self, matrix):
        adjacency_list = []

        matrix_len = len(matrix)

        for n1 in range(matrix_len):
            for n2 in range(matrix_len):
                if n1 == n2:
                    continue

                weight = matrix[n1][n2]

                if weight:
                    adjacency_list.append([n1, n2, weight])
        
        return adjacency_list


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
