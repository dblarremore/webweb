from webweb import Web
import json
import tempfile
from pathlib import Path
import networkx as nx


def webweb_path():
    return Path(__file__).resolve().parent.parent.joinpath('webweb')


def data_path():
    return Path.cwd().joinpath('tests', 'data')


def test_base_path():
    expected_path = webweb_path()
    actual_path = Web().base_path()
    assert actual_path == expected_path


def test_development_client_path():
    expected_path = webweb_path().joinpath('client')
    actual_path = Web().development_client_path()
    assert actual_path == expected_path


def test_client_path():
    expected_path = webweb_path().joinpath('client')
    actual_path = Web().client_path()
    assert actual_path == expected_path


def test_client_file_path():
    expected_path = webweb_path().joinpath('client', 'css', 'style.css')
    actual_path = Web().client_file_path('css', 'style.css')
    assert actual_path == expected_path


def test_client_file_content():
    expected_content = Web().client_file_path('css', 'style.css').read_text()
    actual_content = Web().get_client_file_content('css', 'style.css')
    assert expected_content == actual_content


def test_html_path():
    expected_path = Path(tempfile.gettempdir()).joinpath('webweb.html')
    actual_path = Web().html_path()
    assert actual_path == expected_path


def test_add_by_gml():
    gml_file_path = data_path().joinpath('gml_example.gml')
    web = Web(title="test adding a gml file", gml_file=str(gml_file_path))
    assert web.json == json.dumps({
        'display': {},
        'networks': {
            'test adding a gml file': {
                "layers": [
                    {
                        "edgeList": [[1, 2], [1, 3]],
                        "nodes": {
                            "1": {
                                "name": "1"
                            },
                            "2": {
                                "name": "2"
                            },
                            "3": {
                                "name": "3"
                            }
                        },
                        "metadata": None
                    }
                ]
            }
        },
        'title': 'test adding a gml file'
    })


def test_add_by_networkx():
    edges = [[0, 1], [1, 2]]
    nodes = {
        0: {
            'name': 'Huberg',
        },
        1: {
            'name': 'Pierot',
        },
        2: {
            'name': 'Slartibertfast',
        },
    }
    G = nx.Graph()
    G.add_edges_from(edges)

    for node in nodes:
        G.nodes[node]['name'] = nodes[node]['name']

    web = Web(title='test add from networkx', adjacency=edges, nodes=nodes)

    assert web.json == json.dumps({
        "display": {},
        "networks": {
            'test add from networkx': {
                "layers": [
                    {
                        "edgeList": edges,
                        "nodes": nodes,
                        "metadata": None
                    }
                ]
            }
        },
        "title": "test add from networkx"
    })


def test_general():
    edges = [[0, 1, 2], [1, 2, 3]]
    nodes = {
        0: {
            'name': 'Dan',
        },
        1: {
            'name': 'Hunter',
        },
        2: {
            'name': 'Steve',
        },
    }
    web = Web(title='test_visualization', adjacency=edges)

    web.networks.test_visualization.layers[0]['nodes'] = nodes

    assert web.json == json.dumps({
        "display": {},
        "networks": {
            "test_visualization": {
                "layers": [
                    {
                        "edgeList": edges,
                        "nodes": nodes,
                        "metadata": None
                    }
                ]
            }
        },
        "title": "test_visualization"
    })
