# before 'go live':
- documentation:
    - Table of Contents
        - 
    - images of graphs
    - installation:
        - python:
            - pip
            - git
        - matlab
    - basic use case:
        - "I have an adjacency, how do I display it?"
        - python
        - matlab
    - example code gallery
    - document adjacency list behavior
        - eg, 3 edge adjacency lists will be treated like matrixes
            - can explicitly specify they are lists by passing "adjacency_type='list'"
- examples:
    - add code to generate at top
#- 'viz-only' mode
    - hides menus
#- append_to_node
    - pass id to append it to
    - requires filename (for webweb.json)
    - will create the element on the body if one does not exist
- document named nodes behavior

# Features in descending order of priority (highest priority first)

# client:
- resizability
    - add toggle for `autoresize` window
    - see dan/faculty
- edge scaling:
    - scale strength/length with weight of edge
- edge loading:
    - add different formats?
        - gml?
        - others?
- documentation:
    - add hyperlinks between stuff
- bundle functions for UI elements
    - keep things synced between:
        1. display parameters
        2. html inputs
        3. responders
    - eg, if there's menu named `X`:
        - have a dict for:
            - write
            - update
            - toggle/change
        - this way we don't have to repeat element id code
- add network- and layer-level display settings
    - eg:
        - network.networkname.display.w = 100
        - network.networkname.layers[0].display.w = 100
- change label/node representation:
    - future:
        - display.labelTypes = { label: type }
        - network.netname.display.labelTypes = { label : type }
    - make nodes!
        - web.nodes = [{ 'name' : 'xyz', 'hunger' : 10 }]
        - web.network.netname.add_layer(adj, nodes)
- ditch the global namespace entirely
- gif of layers?
    - this is actually really difficult
    - (would basically require abandoning the global namespace)
- svg --> canvas
- bundling:
    - use hotlinks?
    - spit all of it into the html file?

# python:
- put up on pip
- allow user to write the outpath
    - let them write json OR draw
