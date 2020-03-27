import { BinaryAttribute } from '../../attribute'
import { Widget, CheckboxWidget, SelectWidget } from '../../widget'

export function forceDirectedWidgets() {
  return {
    'left': {
      'size': [
        SizeNodesSelectWidget,
        FlipNodeSizeScaleWidget,
      ],
      'colors': [
        ColorNodesSelectWidget,
        NodeColorPaletteSelectWidget,
        FlipNodeColorScaleWidget
      ],
    },
    'right': {
      'names': [
        ShowNodeNamesWidget,
        NameToMatchWidget,
      ],
      'scaleLink': [
        ScaleLinkWidthWidget,
        ScaleLinkOpacityWidget,
      ],
      'nodeProperties': [
        ChargeWidget,
        RadiusWidget,
      ],
      'linkLength': [LinkLengthWidget],
      'freezeNodes': [FreezeNodesWidget],
      'gravity' : [GravityWidget],
    }
  }
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
// Node Sizing
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



class ScaleLinkWidthWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link width '
    this.size = 10
    this.settingName = 'scaleLinkWidth'
    this.setHandler = 'redraw'
  }
}

class ScaleLinkOpacityWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link opacity '
    this.size = 10
    this.settingName = 'scaleLinkOpacity'
    this.setHandler = 'redraw'
  }
}

class ShowNodeNamesWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Show node names '
    this.size = 10
    this.settingName = 'showNodeNames'
    this.setHandler = 'redraw'
  }
}

class NameToMatchWidget extends Widget {
  get events() { return ['input'] }

  setProperties() {
    this.text = 'Highlight nodes named: '
    this.size = 10
    this.settingName = 'nameToMatch'
    this.setHandler = 'redraw'
  }

  input(value) { this.syncTo(value) }
}

class ChargeWidget extends Widget {
  setProperties() {
    this.text = 'Node charge: '
    this.settingName = 'charge'
    this.setHandler = 'change-force'
  }

  change(value) {
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Charge must be nonnegative.")
    }
  }
}

class RadiusWidget extends Widget {
  setProperties() {
    this.text = 'Node radius: '
    this.settingName = 'radius'
    this.setHandler = 'redraw'
  }

  change(value) {
    if (value > 0) {
      this.syncTo(value)
    }
    else {
      alert("Radius must be nonzero.")
    }
  }
}

class LinkLengthWidget extends Widget {
  setProperties() {
    this.text = 'Link length: '
    this.settingName = 'linkLength'
    this.setHandler = 'change-force'
  }

  change(value) {
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Distance must be nonnegative.")
    }
  }
}

class FreezeNodesWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Freeze nodes '
    this.size = 10
    this.settingName = 'freezeNodeMovement'
    this.setHandler = 'freeze-simulation'
  }
}

class GravityWidget extends Widget {
  setProperties() {
    this.text = 'Gravity: '
    this.settingName = 'gravity'
    this.setHandler = 'change-force'
  }

  change(value) {
    value = parseFloat(value)
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Gravity must be nonnegative.")
    }
  }
}

