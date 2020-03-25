import { BinaryAttribute } from '../../attribute'
import { Widget, CheckboxWidget, SelectWidget } from '../../widget'

////////////////////////////////////////////////////////////////////////////////
// Node Coloring
////////////////////////////////////////////////////////////////////////////////
export class ColorNodesSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Color nodes by "
    this.settingName = 'colorNodesBy'
    this.setHandler = 'redraw'
  }
  
  get options() { return Object.keys(this.attributes.color) }
}
                  
export class NodeColorPaletteSelectWidget extends SelectWidget {
  setProperties() {
    this.text = " with color palette "
    this.settingName = 'nodeColorPalette'
    this.setHandler = 'redraw'
  }

  get options() {
    const attribute = this.attributes.color[this.settings.colorNodesBy]

    // this won't work with categorical
    return attribute.coloror.constructor.palettes
  }
}

export class FlipNodeColorScaleWidget extends CheckboxWidget {
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
export class SizeNodesSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Scale node sizes by "
    this.settingName = 'sizeNodesBy'
    this.setHandler = 'redraw'
  }

  get options() { return Object.keys(this.attributes.size) }
}

export class FlipNodeSizeScaleWidget extends CheckboxWidget {
  setProperties() {
    this.text = " flip sizes "
    this.settingName = 'flipNodeSizeScale'
    this.setHandler = 'redraw'
  }

  get visible() { return super.visible && this.settings.sizeNodesBy !== 'none' }
}



export class ScaleLinkWidthWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link width '
    this.size = 10
    this.settingName = 'scaleLinkWidth'
    this.setHandler = 'redraw'
  }
}

export class ScaleLinkOpacityWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link opacity '
    this.size = 10
    this.settingName = 'scaleLinkOpacity'
    this.setHandler = 'redraw'
  }
}

export class ShowNodeNamesWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Show node names '
    this.size = 10
    this.settingName = 'showNodeNames'
    this.setHandler = 'redraw'
  }
}

export class NameToMatchWidget extends Widget {
  get events() { return ['input'] }

  setProperties() {
    this.text = 'Highlight nodes named: '
    this.size = 10
    this.settingName = 'nameToMatch'
    this.setHandler = 'redraw'
  }

  input(value) { this.syncTo(value) }
}

export class ChargeWidget extends Widget {
  setProperties() {
    this.text = 'Node charge: '
    this.settingName = 'charge'
    this.setHandler = 'update-sim'
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

export class RadiusWidget extends Widget {
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

export class LinkLengthWidget extends Widget {
  setProperties() {
    this.text = 'Link length: '
    this.settingName = 'linkLength'
    this.setHandler = 'update-sim'
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

export class FreezeNodesWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Freeze nodes '
    this.size = 10
    this.settingName = 'freezeNodeMovement'
    this.setHandler = 'freeze-nodes'
  }
}

export class GravityWidget extends Widget {
  setProperties() {
    this.text = 'Gravity: '
    this.settingName = 'gravity'
    this.setHandler = 'update-sim'
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

