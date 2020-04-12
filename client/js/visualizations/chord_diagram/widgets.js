import { SelectWidget, CheckboxWidget } from '../../widget'
import { DiveringColoror } from '../../coloror'

export function chordDiagramWidgets() {
  return {
    'left': {
      'nodeSort': [
        [
          SelectWidget,
          {
            'text': "Sort nodes by ",
            'settingName': 'sortNodesBy',
            'setHandler': 'redraw',
            'options': ['out degree', 'in degree'],
          },
        ],
      ],
      'nodeColor': [
        ColorNodesSelectWidget,
        NodeColorPaletteSelectWidget,
        FlipNodeColorScaleWidget,
      ],
      'nodeSize': [
        SizeNodesSelectWidget,
        FlipNodeSizeScaleWidget,
      ],
      'edges': [
        [
          CheckboxWidget,
          {
            'text': 'Color edges ',
            'settingName': 'colorEdges',
            'setHandler': 'redraw',
          }
        ],
        EdgeColorPaletteSelectWidget,
        FlipEdgeColorScaleWidget,
      ],
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Edge Coloring
////////////////////////////////////////////////////////////////////////////////
class EdgeColorPaletteSelectWidget extends SelectWidget {
  setProperties() {
    this.text = " with color palette "
    this.settingName = 'edgeColorPalette'
    this.setHandler = 'redraw'
  }

  get options() { return DiveringColoror.palettes }
  get visible() { return super.visible && this.settings.colorEdges }
}

class FlipEdgeColorScaleWidget extends CheckboxWidget {
  setProperties() {
    this.text = " flip colors "
    this.settingName = 'flipEdgeColorScale'
    this.setHandler = 'redraw'
  }

  get visible() { return super.visible && this.settings.colorEdges }
}

////////////////////////////////////////////////////////////////////////////////
// Node Coloring
////////////////////////////////////////////////////////////////////////////////
class ColorNodesSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Color nodes by "
    this.settingName = 'colorNodesBy'
    this.setHandler = 'redraw'
  }

  get options() { return Object.keys(this.attributes.color) }
}

class NodeColorPaletteSelectWidget extends SelectWidget {
  setProperties() {
    this.text = " with color palette "
    this.settingName = 'nodeColorPalette'
    this.setHandler = 'redraw'
  }

  get options() {
    return this.attributes.color[this.settings.colorNodesBy].colorPalettes
  }
}

class FlipNodeColorScaleWidget extends CheckboxWidget {
  setProperties() {
    this.text = " flip colors "
    this.settingName = 'flipNodeColorScale'
    this.setHandler = 'redraw'
  }

  get visible() { return super.visible && this.settings.colorNodesBy !== 'none' }
}


////////////////////////////////////////////////////////////////////////////////
// Node Size
////////////////////////////////////////////////////////////////////////////////
class SizeNodesSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Scale node sizes by "
    this.settingName = 'sizeNodesBy'
    this.setHandler = 'redraw'
  }

  get options() { return Object.keys(this.attributes.size) }
}

class FlipNodeSizeScaleWidget extends CheckboxWidget {
  setProperties() {
    this.text = " flip sizes "
    this.settingName = 'flipNodeSizeScale'
    this.setHandler = 'redraw'
  }

  get visible() { return super.visible && this.settings.sizeNodesBy !== 'none' }
}

