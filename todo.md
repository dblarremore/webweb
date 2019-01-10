# before 'go live':
- documentation:
    - installation:
        - python:
            - pip
            - git
        - matlab
    - basic use case:
        - "I have an adjacency, how do I display it?"
        - python
        - matlab
    - adjacency list behavior
        - eg, 3 edge adjacency lists will be treated like matrixes
            - can explicitly specify they are lists by passing "adjacency_type='list'"
    - add in stuff about `append to element`
        - document '#' behavior
    - add in stuff about `showWebOnly`
#- 'viz-only' mode
    - hides menus
#- append_to_node
    - pass id to append it to
    - requires filename (for webweb.json)
    - will create the element on the body if one does not exist
- document named nodes behavior

# Features in descending order of priority (highest priority first)

# client:
- "play" frames
    - frames can have a "duration" attribute
        - specifies how many miliseconds or something a frame lasts
        - then fire an event every time
- edge scaling:
    - scale strength/length with weight of edge
- edge loading:
    - add different formats?
        - gml?
        - others?
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
- BUG:
    - weight zero are scaled to zero even when scaleLink is off

# python:
- put up on pip
- allow user to write the outpath
    - let them write json OR draw
