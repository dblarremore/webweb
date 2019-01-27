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
- ditch the global namespace entirely
- svg --> canvas
- BUG:
    - weight zero are scaled to zero even when scaleLink is off
