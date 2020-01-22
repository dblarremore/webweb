import { colorbrewer } from './colors'
import { UserColorAttribute } from './attribute'

export class Widget {
  constructor(settings, attributes, callHandler) {
    this.settings = settings
    this.attributes = attributes
    this.callHandler = callHandler
    this.id = 'NONE'
    this.inline = false
  }

  init() {
    this.HTMLId = this.id + '-widget'
    this.HTML = this.getHTML()

    this.containerId = this.HTMLId + '-container'
    this.container = this.getContainer()
    this.showOrHide()

    this.syncTo(this.SettingValue)
  }

  get type() {
    return 'input'
  }

  refresh(settings, attributes) {
    if (settings !== undefined) {
      this.settings = settings
    }
    if (attributes !== undefined) {
      this.attributes = attributes
    }
    this.HTMLValue = this.SettingValue
    this.showOrHide()
  }

  showOrHide() {
    let visibility = 'none'
    if (this.shouldBeVisible()) {
      visibility = this.elementDisplayType
    }
    this.container.style.display = visibility
  }

  get elementType() {
    return this.inline ? 'span' : 'div'
  }

  get elementDisplayType() {
    if (this.inline) {
      return 'inline'
    }
    else {
      return 'block'
    }
  }

  getContainer() {
    let container = document.createElement(this.elementType)
    container.id = this.containerId

    if (this.text !== undefined) {
      container.innerHTML = this.text
    }
    container.append(this.HTML)
    return container
  }

  shouldBeVisible() {
    return true
  }

  createHTMLElement() {
    let HTML = document.createElement('input')
    HTML.type = this.type || 'text'
    HTML.size = this.size || 3
    return HTML
  }

  getHTML() {
    let HTML = this.createHTMLElement()
    HTML.id = this.HTMLId
    this.addListeners(HTML)
    return HTML
  }

  setSelectOptions(HTML, options) {
    options = options || this.options

    let lastValue = HTML.value
    if (HTML.options !== undefined) {
      HTML.options.length = 0
    }

    if (options !== undefined) {
      for (let _option of options) {
        let option = document.createElement('option')
        option.innerHTML = _option
        HTML.add(option)
      }
    }

    if (lastValue !== undefined) {
      for (let i = 0; i < HTML.options.length; i++) {
        if (HTML.options[i].innerHTML == lastValue) {
          HTML.selectedIndex = i
        }
      }
    }
  }

  addListeners(HTML) {
    if (HTML == undefined) {
      return
    }
    let _this = this
    this.events.forEach((eventName) => {
      HTML.addEventListener(eventName, function (event) {
        let value = event.target.value
        if (this.type !== undefined && this.type == 'checkbox') {
            value = event.target.checked
        }

        _this[eventName](value)
      })
    })
  }

  syncTo(value) {
    if (this.SettingValue !== value) {
      this.SettingValue = value
    }
    if (this.HTMLValue !== value) {
      this.HTMLValue = value
    }
  }

  get HTMLValue() {
    if (this.HTML !== undefined) {
      return this.HTML.value
    }
    return undefined
  }

  set HTMLValue(value) {
    if (this.HTML !== undefined) {
      this.HTML.value = value
    }
  }

  get SettingValue() { return this.value }
  set SettingValue(value) { this.value = value }

  // called at input
  change(value) {
    this.syncTo(value)
  }

  get options() {
    return []
  }

  refresh(settings, attributes) {
    if (settings !== undefined) {
      this.settings = settings
    }
    if (attributes !== undefined) {
      this.attributes = attributes
    }
    this.syncTo(this.SettingValue)
    this.showOrHide()
  }

  get events() {
    return ['change']
  }
}
export class CheckboxWidget extends Widget {
  get type() {
    return 'checkbox'
  }

  get HTMLValue() {
    if (this.HTML !== undefined) {
      return this.HTML.checked ? true : false
    }
    return undefined
  }
  set HTMLValue(value) {
    if (this.HTML !== undefined) {
      this.HTML.checked = value ? true : false
    }
  }

}

export class SelectWidget extends Widget {
  get type() {
    return 'select'
  }

  shouldBeVisible() {
    return this.options.length > 1 ? true : false
  }

  createHTMLElement() {
    let HTML = document.createElement('select')
    this.setSelectOptions(HTML, this.options)
    return HTML
  }

  refresh(settings, attributes) {
    if (settings !== undefined) {
      this.settings = settings
    }
    if (attributes !== undefined) {
      this.attributes = attributes
    }
    this.setSelectOptions(this.HTML, this.options)
    this.HTMLValue = this.SettingValue
    this.showOrHide()
  }

  get HTMLValue() {
    if (this.HTML !== undefined) {
      if (this.HTML.options !== undefined) {
        let index = this.HTML.selectedIndex
        return this.HTML.options[index]
      }
    }
    return undefined
  }

  set HTMLValue(value) {
    if (this.HTML !== undefined) {
      for (let i = 0; i < this.HTML.options.length; i++) {
        if (this.HTML.options[i].innerHTML == value) {
          this.HTML.selectedIndex = i
        }
      }
    }
  }
}
export class ButtonWidget extends Widget {
  get type() {
    return 'button'
  }

  shouldBeVisible() {
    return true
  }

  createHTMLElement() {
    let HTML = document.createElement('button')
    HTML.type = 'button'
    HTML.size = this.size || 3
    HTML.innerHTML = this.value
    return HTML
  }

  get events() {
    return ['click']
  }

}
export class NetworkSelectWidget extends SelectWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'networkSelect'
    this.text = "Display data from "
    this.inline = true

    this.init()
  }

  shouldBeVisible() {
    return true
  }

  get options() {
    if (this.settings !== undefined) {
      return this.settings.networkNames
    }
    return undefined
  }

  get SettingValue() {
    return this.settings.networkName
  }

  set SettingValue(value) {
    this.settings.networkName = value
    this.settings.networkLayer = 0
    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}

export class NetworkLayerSelectWidget extends SelectWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'layerSelect'
    this.text = " layer "
    this.inline = true

    this.init()
  }

  get layerCount() {
    return this.settings.networkLayers[this.settings.networkName]
  }

  get options() {
    return [...Array(this.layerCount).keys()]
  }

  get SettingValue() {
    return this.settings.networkLayer
  }

  set SettingValue(value) {
    this.settings.networkLayer = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}

export class SizeSelectWidget extends SelectWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'sizeSelect'
    this.text = "Scale node sizes by "
    this.inline = true

    this.init()
  }

  get options() {
    return Object.keys(this.attributes.size)
  }

  get SettingValue() {
    return this.settings.sizeBy
  }

  set SettingValue(value) {
    this.settings.sizeBy = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}
export class InvertBinarySizesWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'invertBinarySizes'
    this.text = "' invert '"
    this.inline = true

    this.init()
  }

  get SettingValue() {
    return this.settings.invertBinarySizes
  }

  set SettingValue(value) {
    this.settings.invertBinarySizes = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }

  // only show this widget when we're sizing by something binary
  shouldBeVisible() {
    let sizingBy = this.settings.sizeBy
    if (sizingBy == undefined) {
      return false
    }

    let sizingAttribute = this.attributes.size[sizingBy]

    if (sizingAttribute == undefined) {
      return false
    }

    if (sizingAttribute.constructor.TYPE == 'binary') {
      return true
    }

    return false
  }
}
export class ColorSelectWidget extends SelectWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'colorSelect'
    this.text = "Color nodes by "
    this.inline = true

    this.init()
  }
  
  get options() {
    return Object.keys(this.attributes.color) 
  }

  get SettingValue() {
    return this.settings.colorBy
  }

  set SettingValue(value) {
    this.settings.colorBy = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}
                  
export class ColorPaletteSelectWidget extends SelectWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'colorPaletteSelect'
    this.text = " with color palette "
    this.inline = true

    this.init()
  }

  get options() {
    return Object.keys(colorbrewer)
  }

  get SettingValue() {
    return this.settings.colorPalette
  }

  set SettingValue(value) {
    this.settings.colorPalette = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }

  shouldBeVisible() {
    let coloringBy = this.settings.colorBy
    if (coloringBy == undefined) {
      return false
    }
    console.log('here')

    let coloringAttribute = this.attributes.color[coloringBy]

    if (coloringAttribute == undefined) {
      return false
    }
    console.log('there')

    if (coloringAttribute instanceof UserColorAttribute) {
      return false
    }
    else if (coloringAttribute.constructor.TYPE == 'binary') {
      return true
    }
    else if (coloringAttribute.constructor.TYPE == 'categorical') {
      if (! coloringAttribute.isScalarCategorical) {
        return true
      }
    }

    return false
  }
}
export class InvertBinaryColorsWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'invertBinaryColors'
    this.text = ' invert '
    this.inline = true

    this.init()
  }

  get SettingValue() {
    return this.settings.invertBinaryColors
  }

  set SettingValue(value) {
    this.settings.invertBinaryColors = value
    this.callHandler('display-network', this.settings)
    this.refresh()
  }

  shouldBeVisible() {
    let coloringBy = this.settings.colorBy
    if (coloringBy !== undefined) {
      let coloringAttribute = this.attributes.color[coloringBy]

      if (coloringAttribute !== undefined) {
        if (coloringAttribute.constructor.TYPE === 'binary') {
          return true
        }
      }

    }
    return false
  }
}
export class ScaleLinkWidthWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'scaleLinkWidth'
    this.text = 'Scale link width '
    this.size = 10

    this.init()
  }

  get SettingValue() {
    return this.settings.scaleLinkWidth
  }

  set SettingValue(value) {
    this.settings.scaleLinkWidth = value
    let range = value ? [0.5, 2] : [1, 1]

    this.settings.scales.linkWidth.min = range[0]
    this.settings.scales.linkWidth.max = range[1]

    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}
export class ScaleLinkOpacityWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'scaleLinkOpacity'
    this.text = 'Scale link opacity '
    this.size = 10

    this.init()
  }

  get SettingValue() {
    return this.settings.scaleLinkOpacity
  }

  set SettingValue(value) {
    this.settings.scaleLinkOpacity = value
    let range = value ? [0.3, 0.9] : [1, 1]

    this.settings.scales.linkOpacity.min = range[0]
    this.settings.scales.linkOpacity.max = range[1]

    this.callHandler('display-network', this.settings)
    this.refresh()
  }
}

export class FreezeNodesWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'freezeNodes'
    this.text = 'Freeze nodes '
    this.size = 10

    this.init()
  }

  get SettingValue() {
    return this.settings.freezeNodeMovement
  }

  set SettingValue(value) {
    this.settings.freezeNodeMovement = value
    this.callHandler('freeze-nodes', this.settings)
    this.refresh()
  }
}
export class SaveSVGWidget extends ButtonWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'saveSVG'
    this.size = 10
    this.text = 'Save as'
    this.value = 'SVG'
    this.inline = true

    this.init()
  }

  click() {
    this.callHandler('save-svg', this.settings)
  }
}
export class SaveCanvasWidget extends ButtonWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'saveCanvas'
    this.size = 10
    this.value = 'PNG'
    this.inline = true

    this.init()
  }

  click() {
    this.callHandler('save-canvas', this.settings)
  }
}

export class ChargeWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'charge'
    this.text = 'Node charge: '

    this.init()
  }

  get SettingValue() {
    return this.settings.c
  }

  set SettingValue(value) {
    this.settings.c = value

    //this.updateSimulation("charge");
    this.callHandler('update-sim', this.settings)
    this.refresh()

  }

  change(value) {
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Repulsion must be nonnegative.")
    }
  }
}
export class LinkLengthWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'linkLength'
    this.text = 'Link length: '
    this.inline = false

    this.init()
  }

  get SettingValue() {
    return this.settings.l
  }

  set SettingValue(value) {
    this.settings.l = value

    // this.updateSimulation("link");
    this.callHandler('update-sim', this.settings)
    this.refresh()

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

export class LinkStrengthWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'linkStrength'
    this.text = 'Link strength: '

    this.init()
  }

  get SettingValue() {
    return this.settings.linkStrength
  }

  set SettingValue(value) {
    this.settings.linkStrength = value

    // this.updateSimulation("link");
    this.callHandler('update-sim', this.settings)
    this.refresh()

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
export class GravityWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'gravity'
    this.text = 'Gravity: '

    this.init()
  }

  get SettingValue() {
    return this.settings.g
  }

  set SettingValue(value) {
    this.settings.g = value

    // this.updateSimulation("gravity-x");
    // this.updateSimulation("gravity-y");
    this.callHandler('update-sim', this.settings)
    this.refresh()

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
export class RadiusWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'radius'
    this.text = 'Node radius: '
    this.inline = false

    this.init()
  }

  get SettingValue() {
    return this.settings.r
  }

  set SettingValue(value) {
    this.settings.r = value

    this.callHandler('display-network', this.settings)
    this.refresh()
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
export class ShowNodeNamesWidget extends CheckboxWidget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'showNodeNames'
    this.text = 'Show node names '
    this.size = 10
    this.inline = false

    this.init()
  }

  get SettingValue() {
    return this.settings.showNodeNames
  }

  set SettingValue(value) {
    this.settings.showNodeNames = value

    this.callHandler('redraw', this.settings)
    this.refresh()
  }
}
export class NameToMatchWidget extends Widget {
  constructor(settings, attributes, callHandler) {
    super(settings, attributes, callHandler)
    this.id = 'nameToMatch'
    this.text = 'Highlight nodes named: '
    this.size = 10
    this.inline = false

    this.init()
  }

  get SettingValue() {
    return this.settings.nameToMatch
  }

  set SettingValue(value) {
    this.settings.nameToMatch = value

    this.callHandler('redraw', this.settings)
    this.refresh()
  }

  get events() {
    return ['input']
  }

  input(value) {
    this.syncTo(value)
  }
}
