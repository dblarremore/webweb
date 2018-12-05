# Python version of webweb was originally created by Michael Iuzzolino
# Cleaned up and harmonized with existing versions by Daniel Larremore
# version 3.4
#
# Daniel Larremore + Contributors
# August 29, 2018
# daniel.larremore@colorado.edu
# http://github.com/dblarremore/webweb Comments and suggestions always welcome.

import os
import copy
import json
import webbrowser
from collections import defaultdict

class webweb(dict):
    def __init__(self, title="webweb", *args, **kwargs):
        self.title = title
        self.display = Display(*args, **kwargs)
        self.networks = Nets()

    @property
    def base_path(self):
        return os.path.dirname(os.path.realpath(__file__))

    def draw(self):
        """ driver for the whole thing:
        1. saves the html file
        2. saves the js data file
        3. opens the web browser
        """
        with open(self.html_file, 'w') as f:
            f.write(self.html)

        with open(self.data_file, 'w') as f:
            f.write(f"var wwdata = {self.json};")

        webbrowser.open_new("file://" + self.html_file)

    @property
    def html_file(self):
        return os.path.join(self.base_path, f"{self.title}.html")

    @property
    def data_file(self):
        return os.path.join(self.base_path, f"{self.title}.json")

    @property
    def json(self, title=None):
        return json.dumps({
            "display" : get_dict_from_labeled_obj(self.display),
            "network" : { key : get_dict_from_labeled_obj(val) for key, val in vars(self.networks).items()}
        })

    @property
    def html(self):
        return f"""
            <html>
                <head>
                    <title>webweb {self.title}</title>
                    <script src="client/js/d3.v5.min.js"></script>
                    <link type="text/css" rel="stylesheet" href="client/css/style.css"/>
                    <script type="text/javascript" src="{self.data_file}"></script>
                </head>
                <body>
                    <script type="text/javascript" src="client/js/colors.js"></script>
                    <script type="text/javascript" src ="client/js/Blob.js"></script>
                    <script type="text/javascript" src ="client/js/FileSaver.min.js"></script>
                    <script type="text/javascript" src ="client/js/webweb.v5.js"></script>
                </body>
            </html>
        """

class Display(dict):
    def __init__(self, num_nodes=None, name=None, w=None, h=None, l=None, r=None, c=None, g=None, nodeNames=None):
        self.N = num_nodes
        self.name = name
        self.w = w
        self.h = h
        self.l = l
        self.r = r
        self.c = c
        self.g = g
        self.nodeNames = nodeNames
        self.labels = Labels()

def get_dict_from_labeled_obj(obj):
    """this function converts an object which might have subobjects (labels)
    into a dictionary. It looks complicated, but really all it is doing is
    making two nested calls to vars()."""
    _dict = {}
    for key, val in vars(obj).items():
        if val == None:
            continue

        if key == 'labels':
            _dict[key] = { k : vars(v) for k, v in vars(val).items() }
        elif key == 'frames':
            _dict['frames'] = []
            for frame in val:
                _frame = {
                    'adjList' : frame['adjList'],
                    'labels' : frame['labels'],
                }

                if frame.get('nodes'):
                    _frame['nodes'] = frame['nodes']

                _dict['frames'].append(_frame)
        else:
            _dict[key] = val

    return _dict

class Net(dict):
    def __init__(self):
        self.frames = []

    def add_frame(self, adj, labels=None, nodes=None, adjacency_type=None):
        if not adjacency_type:
            if len(adj) and len(adj) > 3:
                # we use a dumb heuristic here:
                # if the length of the list is the same as the length of the first
                # element in the list, it's a matrix
                if len(adj) == len(adj[0]):
                    adjacency_type = "matrix"

        if adjacency_type == 'matrix':
            adj = self.convert_adjacency_matrix_to_list(adj)

        self.frames.append({
            'adjList' : copy.deepcopy(adj),
            'labels' : labels,
            'nodes' : nodes,
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


    def add_frame_from_networkx_graph(self, G):
        """ loads the edges and attributes from a network x graph """
        import networkx as nx
        adj = []

        for u, v, d in G.edges(data=True):
            edge = [u, v]
            if d.get('weight'):
                edge.append(d['weight'])
            adj.append(edge)

        G_labels = defaultdict(list)
        for node in G.nodes:
            for label, val in G.nodes[node].items():
                G_labels[label].append(val)

        labels = {}
        for label, vals in G_labels.items():
            labels[label] = {
                'value' : vals,
            }

        self.add_frame(adj, labels=labels, nodes=len(list(G.nodes())))

    @property
    def adj(self):
        return self.adjList

    @adj.setter
    def adj(self, adjList):
        self.adjList = copy.deepcopy(adjList)

class Nets(dict):
    def __getattr__(self, name):
        if not self.__dict__.get(name):
            self.__dict__[name] = Net()

        return self.__dict__[name]

class Labels(dict):
    def __getattr__(self, name):
        if not self.__dict__.get(name):
            self.__dict__[name] = Label()

        return self.__dict__[name]

class Label(dict):
    """a label has type, values, and possibly categories.
    types:
    1. scalar
    2. categorical
    3. binary

    values:
    - a list of N integers or strings (where N is the number of nodes)

    categories (ignored if `type` is not categorical):
    - a list of strings which will be used to name the categories
    """
    def __init__(self):
        self.type = None
        self.value = None
        self.categories = None
