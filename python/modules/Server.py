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
                    <title> {} Vis </title>
                    <meta charset="utf-8">

                    <!-- PNG SAVER -->
                    <!-- ======================== -->
                    <script src="static/js/Blob.min.js"></script>
                    <script src="static/js/FileSaver.min.js"></script>
                    <!-- ======================== -->

                    <!-- ==================================================================== -->
                    <!-- =================              CSS                 ================= -->
                    <!-- ==================================================================== -->

                    <!-- Custom Style Sheets -->
                    <!-- =================== -->
                    <link rel="stylesheet" href="static/css/style.css">

                    <!-- ==================================================================== -->
                    <!-- =================          JAVASCRIPT              ================= -->
                    <!-- ==================================================================== -->

                    <!-- Library JS scripts -->
                    <!-- ================== -->
                    <script src="static/js/jquery-3.2.1.min.js"></script>
                    <script src="static/js/d3.v3.min.js"></script>

                    <!-- Custom JS scripts -->
                    <!-- ================= -->
                    <script src="static/js/initialize.js"></script>
                    <script src="static/js/menus.js"></script>
                    <script src="static/js/helpers.js"></script>
                    <script src="static/js/webweb.v3.js"></script>

                </head>
                <body>
                    <!-- JSON -->
                    <script type="text/javascript"  src="data/{}.json"></script>;
                </body>

            </html>
        """.format(self.network_name.capitalize(), self.network_name)

        with open("index.html", "w") as outfile:
            outfile.write(html_str)
