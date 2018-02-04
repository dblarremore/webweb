import os
import json

from webweb.modules.Labels import Labels

class Nets(dict):
    def __init__(self):
        pass

    def __getattr__(self, name):
        if name not in self.__dict__.keys():
            self.__dict__[name] = Net()

        return self.__dict__[name]

    def to_dict(self):
        network_dict = { network_id : network_vals.to_dict() for network_id, network_vals in self.__dict__.items() }
        return network_dict

class Net(dict):
    def __init__(self):
        self._adjList = None
        self.labels = Labels()

    def to_dict(self):
        json_obj = {}
        for key, val in self.__dict__.items():
            if val == None:
                continue

            new_key = "{}".format(str(key).replace("_", ""))
            new_val = val.to_dict() if key == "labels" else val

            json_obj[new_key] = new_val
        return json_obj

    @property
    def adj(self):
        return self._adjList
    @adj.setter
    def adj(self, adj_list):
        if len(adj_list[0]) == 2:
            adj_list = [list([[ele[0], ele[1], 1]]) for ele in adj_list]
        self._adjList = adj_list

    def get_dict(self):
        return { "{}".format(str(key).replace("_", "")) : val for key, val in self.__dict__.items() if val != None }

    def __getattr__(self, name):
        return self.__dict__[name]
