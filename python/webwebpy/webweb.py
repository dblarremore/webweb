import os
import json

webweb_dir_path = os.path.dirname(os.path.realpath(__file__))
os.chdir(webweb_dir_path)

from modules.Display import Display
from modules.Networks import Net, Nets
from modules.Server import Server

# This code defines the webweb dict
# Brief descriptions below.
class webweb(dict):

    def __init__(self, title="webweb", *args, **kwargs):
        self._display = Display(*args, **kwargs)
        self._networks = Nets()
        self._title = title
        self._web_server = Server(network_name=title)

    # A webweb class need to contain networks
    # Here are its getter and setter
    @property
    def networks(self):
        return self._networks
    @networks.setter
    def networks(self, new_networks):
        self._networks = new_networks

    # A webweb class also contains display data
    # Here are its getter and setter
    @property
    def display(self):
        return self._display
    @display.setter
    def display(self, new_display):
        self._display = new_display

    @property
    def title(self):
        return self._title
    @title.setter
    def title(self, new_name):
        self._title = new_name

    # This code will return a network with the specified name
    # IF such a network does not exist, return that entry in the dict
    def __getattr__(self, name):
        if name in self._networks.keys():
            return self._networks[name]
        else:
            return self.__dict__[name]

    # Save the JSON 
    # Pass in a title, and then put together the display and network, and save em
    def save_json(self, title=None):

        # Reset save name ??? Why
        self._title = title if title else self._title
        self._title.replace(".json", "")

        network_json = {
            "display" : { disp_key : disp_val for disp_key, disp_val in self._display.to_dict().items() },
            "network" : { nets_key : nets_val for nets_key, nets_val in self._networks.to_dict().items() }
        }

        # Write the filepath. ??? Something goes borked here because 
        # we get filenames like "network.json.json"
        json_filepath = os.path.join("{}.json".format(self._title))

        with open(json_filepath, "w") as outfile:
            outfile.write("var wwdata = ")
            json.dump(network_json, outfile)

    # Draw actually saves the json file and opens the browser.
    # Note that in opening the browser, it points the browser to the newly saved file
    def draw(self):
        self.save_json()
        self._web_server.launch(self._title)
