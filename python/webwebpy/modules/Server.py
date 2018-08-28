import webbrowser
import os

class Server(object):
    def __init__(self, network_name="network"):
        self.html_main = "index.html"
        self.network_name = network_name.replace(".json", "")

    def launch(self, network_name=None):
        if network_name:
            self.network_name = network_name

        self.build_index_html()
        webbrowser.open("file://" + os.path.realpath(self.html_main))

    def build_index_html(self):
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
        """.format(self.network_name, self.network_name)
        with open("{}.html".format(self.network_name), "w") as outfile:
            outfile.write(html_str)
