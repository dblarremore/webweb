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
        [
          CheckboxWidget,
          {
            'text': 'Show node names ',
            'settingName': 'showNodeNames',
            'setHandler': 'redraw',
          },
        ],
        NameToMatchWidget,
      ],
      'scaleLink': [
        [
          CheckboxWidget,
          {
            'text': 'Scale link width ',
            'settingName': 'scaleLinkWidth',
            'setHandler': 'redraw',
          }
        ],
        [
          CheckboxWidget,
          {
            'text': 'Scale link opacity ',
            'settingName': 'scaleLinkOpacity',
            'setHandler': 'redraw',
          }
        ]
      ],
      'nodeProperties': [
        ChargeWidget,
        RadiusWidget,
      ],
      'linkLength': [LinkLengthWidget],
      'freezeNodes': [
        [
          CheckboxWidget,
          {
            'text': 'Freeze nodes ',
            'size': 10,
            'settingName': 'freezeNodeMovement',
            'setHandler': 'freeze-simulation',
          }
        ],
      ],
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

class NameToMatchWidget extends Widget {
  get events() { return ['input'] }

  setProperties() {
    this.text = 'Highlight nodes named: '
    this.size = 10
    this.settingName = 'nameToMatch'
    this.setHandler = 'redraw'
  }
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
