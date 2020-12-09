Curreently we have the following structure:
- webweb: app entry point
- menu

Network Representation:
- network
  - layer

what should a settingsHandler do?
- holds:
  - settings
  - parameters
  - menu object
  - call handler?
  - canvas?
- has subnamespaces for:
  - definitions
- what does the above buy us?
  - make one settings handler
  - under a namespace:
    - add:
      - definitions (with widgets)
      - call handlers
      - listeners?
    - remove:
      - definitions (with widgets)
      - call handlers
      - listeners?


attribute.js
canvas.js
coloror.js
layer.js
legend.js
listeners.js
menu.js
network.js
parameters.js
scale.js
settings.json
settings_handler.js
shapes.js
svg_utils.js
todo.md
Untitled.ipynb
utils.js
visualizations/*
webweb.js
widget.js
