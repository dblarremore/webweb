import json

from modules.Display import Display
from modules.Networks import Net, Nets
from modules.Server import Server

class webweb(dict):

    def __init__(self, N, save_name="network.json"):
        self._display = Display(N)
        self._networks = Nets()
        self._save_name = save_name
        self._web_server = Server(network_name=save_name)

    @property
    def networks(self):
        return self._networks
    @networks.setter
    def networks(self, new_networks):
        self._networks = new_networks

    @property
    def display(self):
        return self._display
    @display.setter
    def display(self, new_display):
        self._display = new_display

    def __getattr__(self, name):
        if name in self._networks.keys():
            return self._networks[name]
        else:
            return self.__dict__[name]

    def draw(self):
        self.save_json()
        self._web_server.launch(self._save_name)

    def save_json(self, save_name=None):

        # Reset save name
        self._save_name = save_name if save_name else self._save_name
        self._save_name.replace(".json", "")

        network_json = {
            "display" : { disp_key : disp_val for disp_key, disp_val in self._display.to_dict().items() },
            "network" : { nets_key : nets_val for nets_key, nets_val in self._networks.to_dict().items() }
        }

        with open("data/{}.json".format(self._save_name), "w") as outfile:
            outfile.write("var current_network = ")
            json.dump(network_json, outfile)
