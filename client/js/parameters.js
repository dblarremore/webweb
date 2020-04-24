import * as widgets from './widget'

export const CommonParameters = {
  "networkName": {
    "text": "Display data from ",
    "setHandler": "display-network",
    "alwaysVisible": true,
    "widgetClass": widgets.SelectWidget,
  },
  "HTMLParentElementId": {
    "default": undefined,
    "aliases": ["attachWebwebToElementWithId"], 
  },
  "saveSVG": {
    'text': 'Save as ',
    'size': 10,
    'value': 'SVG',
    'setHandler': 'save-svg',
    'widgetClass': widgets.ButtonWidget,
  },
  "savePNG": {
    'size': 10,
    'value': 'PNG',
    'setHandler': 'save-canvas',
    'widgetClass': widgets.ButtonWidget,
    "displayWith": "saveSVG",
  },
}

export const NetworkParameters = {
  "layer": {
    "default": 0,
    "text": " layer ",
    "aliases": ["networkLayer"],
    "widgetClass": widgets.SelectWidget,
    "displayWith": "networkName",
    "setHandler": 'change-layer',
  },
  "showLegend":    { "default": true, },
  "plotType": {
    'text': "Visualization type ",
    "widgetClass": widgets.SelectWidget,
    "setHandler": 'change-visualization',
    'options': [
      'Force Directed',
      'Chord Diagram',
      'Adjacency Matrix',
    ]
  },
}

export const CanvasParameters = {
  "width":  { "default": undefined, "aliases": ["w"], },
  "height": { "default": undefined, "aliases": ["h"], },
}

export const MenuParameters = {
  "showNodeNames": {
    "default": false,
  },
  "nameToMatch": {
    "default": "",
  },
  "hideMenu": {
    "default": false,
  },
}

export const ChordDiagramParameters = {
  "nodeColor": {
    "object": "node",
    "type": "color",
    "Attribute": {
      "text": "Color nodes by ",
      "aliases": ["colorBy", "colorNodesBy"]
    },
    "Range": true,
    "Palette": true,
    "Flip": true,
  },
  "nodeSize": {
    "object": "node",
    "type": "scalar",
    "Attribute": {
      "default": "strength",
      "text": "Size nodes by ",
      "aliases": ["sizeBy", "sizeNodesBy"]
    },
    "Flip": true
  },
  "nodeSort": {
    "object": "node",
    "type": "scalar",
    "Attribute": {
      "text": "Sort nodes by ",
      "aliases": ["sortBy", "sortNodesBy"]
    },
    "Flip": true
  },
  "edgeColor": {
    "object": "edge",
    "type": "color",
    "Attribute": {
      "text": "Color edges by ",
      "aliases": ["colorEdgesBy", "colorLinksBy"]
    },
    "Range": true,
    "Flip": true,
    "Palette": true
  },
}

export const ForceDirectedParameters = {
  "nodeColor": {
    "type": "color",
    "object": 'node',
    "Attribute": {
      "text": "Color nodes by ", 
      "aliases": ["colorBy", "colorNodesBy"],
    },
    "Range": true,
    "Flip": true,
    "Palette": true,
  },
  "nodeSize": {
    "type": "scalar",
    "object": 'node',
    "Attribute": {
      "text": "Size nodes by ",
      "aliases": ["sizeBy", "sizeNodesBy"],
    },
    "Range": {
      "default": [0.5, 1.5],
    },
    "Flip": true,
  },
  "edgeWidth": {
    "type": "scalar",
    "object": "edge",
    "side": "right",
    "Attribute": {
      "default": "weight",
      "aliases": ["scaleEdgeWidthBy"],
      "visible": false,
    },
    "Enabled": {
      "text": "Scale link width ",
      "aliases": ["scaleLinkWidth", "scaleEdgeWidth"],
    },
    "Range": {
      "default": [0.5, 1],
      "aliases": ["linkWidthScaleRange"],
    },
  },
  "edgeOpacity": {
    "type": "scalar",
    "object": "edge",
    "side": "right",
    "Attribute": {
      "default": "weight",
      "aliases": ["scaleEdgeOpacityBy"],
      "visible": false,
    },
    "Enabled": {
      "text": " Opacity ",
      "shareDisplay": "edgeWidthEnabled",
      "aliases": ["scaleLinkOpacity", "scaleEdgeOpacity"],
    },
    "Range": {
      "default": [0.5, 1],
      "aliases": ["linkOpacityScaleRange"],
    },
  },
  "charge": {
    "default": 60,
    "text": "Node charge ",
    "aliases": ["c"],
    "side": "right",
    "setHandler": 'change-force',
    "widgetClass": widgets.Widget,
  },
  "radius": {
    "default": 5,
    "aliases": ["r"],
    "text": " Radius ",
    "displayWith": "charge",
    "side": "right",
    "setHandler": 'redraw',
    "widgetClass": widgets.Widget,
  },
  "gravity": {
    "default": 0.1,
    "text": "Gravity ",
    "aliases": ["g"],
    "side": "right",
    "setHandler": 'change-force',
    "widgetClass": widgets.Widget,
  },
  "edgeStrength": {
    "default": 1,
    "aliases": ["linkStrength"],
    "visible": false,
    "side": "right",
    "setHandler": 'change-force',
    "widgetClass": widgets.Widget,
  },
  "edgeLength": {
    "default": 20,
    "side": "right",
    "text": "Edge length ",
    "aliases": ["linkLength"],
    "setHandler": 'change-force',
    "widgetClass": widgets.Widget,
  },
  "freezeNodeMovement": {
    "default": false,
    "side": "right",
    "text": "Freeze nodes ",
    "setHandler": 'freeze-simulation',
    "widgetClass": widgets.CheckboxWidget,
  },
}
