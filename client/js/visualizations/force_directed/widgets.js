import { BinaryAttribute } from '../../attribute'
import { Widget, CheckboxWidget, SelectWidget } from '../../widget'

export class ScaleLinkWidthWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link width '
    this.size = 10
    this.settingName = 'scaleLinkWidth'
    this.setHandler = 'display-network'
  }

  postValueSet() {
    let [min, max] = this.SettingValue ? [0.5, 2] : [1, 1]

    this.settings.scales.linkWidth.min = min
    this.settings.scales.linkWidth.max = max
  }
}

export class ScaleLinkOpacityWidget extends CheckboxWidget {
  setProperties() {
    this.text = 'Scale link opacity '
    this.size = 10
    this.settingName = 'scaleLinkOpacity'
    this.setHandler = 'display-network'
  }

  postValueSet() {
    let [min, max] = this.SettingValue ? [0.3, 0.9] : [1, 1]

    this.settings.scales.linkOpacity.min = min
    this.settings.scales.linkOpacity.max = max
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
    this.setHandler = 'display-network'
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
    this.settingName = 'l'
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


export class SizeSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Scale node sizes by "
    this.settingName = 'sizeBy'
    this.setHandler = 'display-network'
  }

  get options() { return Object.keys(this.attributes.size) }
}

export class InvertBinarySizesWidget extends CheckboxWidget {
  setProperties() {
    this.text = "' invert '"
    this.settingName = 'invertBinarySizes'
    this.setHandler = 'display-network'
  }

  // only show this widget when we're sizing by something binary
  get visible() {
    let sizingBy = this.settings.sizeBy
    if (sizingBy == undefined) {
      return false
    }

    let sizingAttribute = this.attributes.size[sizingBy]

    if (sizingAttribute == undefined) {
      return false
    }

    if (sizingAttribute instanceof BinaryAttribute) {
      return true
    }

    return false
  }
}

export class ColorSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Color nodes by "
    this.settingName = 'colorBy'
    this.setHandler = 'display-network'
  }
  
  get options() { return Object.keys(this.attributes.color) }
}
                  
export class ColorPaletteSelectWidget extends SelectWidget {
  setProperties() {
    this.text = " with color palette "
    this.settingName = 'colorPalette'
    this.setHandler = 'display-network'
  }

  get options() {
    const attributeName = this.settings.colorBy
    const attribute = this.attributes.color[attributeName]

    return attribute.colorScales
  }
}

export class InvertBinaryColorsWidget extends CheckboxWidget {
  setProperties() {
    this.text = ' invert '
    this.settingName = 'invertBinaryColors'
    this.setHandler = 'display-network'
  }

  get visible() {
    let coloringBy = this.settings.colorBy
    if (coloringBy !== undefined) {
      let coloringAttribute = this.attributes.color[coloringBy]

      if (coloringAttribute !== undefined) {
        if (coloringAttribute instanceof BinaryAttribute) {
          return true
        }
      }

    }
    return false
  }
}
