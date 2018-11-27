all in descending order of priority (highest priority first)

# client:
- resizability
    - add toggle for `autoresize` window
    - see dan/faculty
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
- add network- and frame-level display settings
    - eg:
        - network.networkname.display.w = 100
        - network.networkname.frames[0].display.w = 100
- change label/node representation:
    - future:
        - display.labelTypes = { label: type }
        - network.netname.display.labelTypes = { label : type }
    - make nodes!
        - web.nodes = [{ 'name' : 'xyz', 'hunger' : 10 }]
        - web.network.netname.add_frame(adj, nodes)
- ditch the global namespace entirely
- gif of frames?
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
- matrix vs list
    - just _know_ which is which
