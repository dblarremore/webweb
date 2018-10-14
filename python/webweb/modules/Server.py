import webbrowser
import os

class Server(object):
    def __init__(self, network_name="network"):
        self._network_name = network_name.replace(".json", "")
        self._html_main = "{}.html".format(self._network_name)

    @property
    def html_main(self):
        return self._html_main
    @html_main.setter
    def html_main(self, new_html_main):
        self._html_main = new_html_main

    @property
    def network_name(self):
        return self._network_name
    @network_name.setter
    def network_name(self, new_network_name):
        self._network_name = new_network_name
        self._html_main = "{}.html".format(self._network_name)

    def launch(self):
        # if _network_name:
        #     self._network_name = _network_name

        self.build_html()
        webbrowser.open_new("file://" + os.path.realpath(self.html_main))

    def build_html(self):
        html_str = """
            <html>
                <head>
                    <title> webweb {} </title>
                    <script src="webwebStuff/d3.v3.min.js"></script>
                    <link type="text/css" rel="stylesheet" href="webwebStuff/style.css"/>
                    <script type="text/javascript" src="{}.json"></script>
                </head>
                <body>
                    <script type="text/javascript" src ="webwebStuff/Blob.js"></script>
                    <script type="text/javascript" src ="webwebStuff/FileSaver.min.js"></script>
                    <script type="text/javascript" src ="webwebStuff/webweb.v3.js"></script>
                </body>

            </html>
        """.format(self._network_name, self._network_name)
        with open("{}.html".format(self._network_name), "w") as outfile:
            outfile.write(html_str)
