import { SelectWidget, CheckboxWidget } from '../../widget'
import { DiveringColoror } from '../../coloror'

export function chordDiagramWidgets() {
  return {
    'left': {
      'nodeSort': [
        SortNodesByWidget,
        SortNodesWidget,
      ],
      'nodeColor': [
        ColorNodesSelectWidget,
        NodeColorPaletteSelectWidget,
        FlipNodeColorScaleWidget,
      ],
      'edges': [
        ColorEdgesWidget,
        EdgeColorPaletteSelectWidget,
        FlipEdgeColorScaleWidget,
      ],
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Edge Coloring
////////////////////////////////////////////////////////////////////////////////
class ColorEdgesWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Color edges '
    this.size = 10
    this.settingName = 'colorEdges'
    this.setHandler = 'redraw'
  }
}

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
// Sort
////////////////////////////////////////////////////////////////////////////////
class SortNodesByWidget extends SelectWidget {
  setProperties() {
    this.text = "Sort nodes by "
    this.settingName = 'sortNodesBy'
    this.setHandler = 'redraw'
  }

  get options() { return ['out degree', 'in degree'] }
}

class SortNodesWidget extends SelectWidget {
  setProperties() {
    this.text = " "
    this.settingName = 'sortNodes'
    this.setHandler = 'redraw'
  }

  get options() { return ['ascending', 'descending'] }
}
