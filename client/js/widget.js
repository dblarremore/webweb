import { UserColorAttribute } from './attribute'

export class Widget {
  get type() { return 'input' }
  get elementType() { return this.inline ? 'span' : 'div' }
  get elementDisplay() { return this.inline ? 'inline' : 'block' }
  get visible() { return true }
  get events() { return ['change'] }
  get options() { return [] }

  constructor(settings, callHandler, attributes) {
    this.settings = settings
    this.callHandler = callHandler
    this.attributes = attributes
    this.inline = true

    this.setProperties()
    this.init()
  }

  setProperties() {
    this.text = ''
    this.size = undefined
    this.settingName = undefined
    this.setHandler = undefined
  }

  init() {
    this.HTML = this.getHTML()
    this.container = this.getContainer()

    this.syncTo(this.SettingValue)
    this.setVisibility()
  }

  refresh(settings) {
    this.settings = settings
    this.setVisibility()
  }

  setVisibility() {
    this.container.style.display = this.visible ? this.elementDisplay : 'none'
  }

  getContainer() {
    let container = document.createElement(this.elementType)

    if (this.text !== undefined) {
      container.innerHTML = this.text
    }
    container.append(this.HTML)
    return container
  }

  createHTMLElement() {
    let HTML = document.createElement('input')
    HTML.type = this.type || 'text'
    HTML.size = this.size || 3
    return HTML
  }

  getHTML() {
    let HTML = this.createHTMLElement()
    this.addListeners(HTML)
    return HTML
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

  get SettingValue() {
    if (this.settingName !== undefined) {
      return this.settings[this.settingName] 
    }
  }

  set SettingValue(value) {
    if (this.settingName !== undefined) {
      this.settings[this.settingName] = value
    }

    this.postValueSet()

    if (this.setHandler !== undefined) {
      if (this.callHandler !== undefined) {
        this.callHandler(this.setHandler, this.settings)
      }
    }
  }

  postValueSet() {
    return
  }

  // called at input
  change(value) {
    this.syncTo(value)
  }
}
export class CheckboxWidget extends Widget {
  get type() { return 'checkbox' }

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
  get type() { return 'select' }
  get visible() { return this.options.length > 1 ? true : false }

  init() {
    super.init()
    this.setSelectOptions(this.HTML, this.options)
    this.HTMLValue = this.SettingValue
  }

  setSelectOptions(HTML, options) {
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

  createHTMLElement() {
    let HTML = document.createElement('select')
    this.setSelectOptions(HTML, this.options)
    return HTML
  }

  get HTMLValue() {
    if (this.HTML !== undefined) {
      if (this.HTML.options !== undefined) {
        let index = this.HTML.selectedIndex

        if (this.HTML.options[index] !== undefined) {
          return this.HTML.options[index].text
        }
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
  get type() { return 'button' }
  get events() { return ['click'] }

  createHTMLElement() {
    let HTML = document.createElement('button')
    HTML.type = 'button'
    HTML.size = this.size || 3
    HTML.innerHTML = this.value
    return HTML
  }
}

////////////////////////////////////////////////////////////////////////////////
//
//
// Instantiated Widgets
//
//
////////////////////////////////////////////////////////////////////////////////
export class NetworkSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Display data from "
    this.settingName = 'networkName'
    this.setHandler = 'display-network'
  }

  get visible() { return true }
  get options() { return this.settings.networkNames }
  postValueSet() { this.settings.networkLayer = 0 }
}

export class NetworkLayerSelectWidget extends SelectWidget {
  setProperties() {
    this.text = " layer "
    this.settingName = 'networkLayer'
    this.setHandler = 'display-network'
  }

  get layerCount() {
    return this.settings.networkLayers[this.settings.networkName]
  }

  get options() {
    return [...Array(this.layerCount).keys()]
  }
}

export class SaveSVGWidget extends ButtonWidget {
  setProperties() {
    this.size = 10
    this.text = 'Save as '
    this.value = 'SVG'
  }

  click() {
    this.callHandler('save-svg', this.settings)
  }
}

export class SaveCanvasWidget extends ButtonWidget {
  setProperties() {
    this.size = 10
    this.value = 'PNG'
  }

  click() {
    this.callHandler('save-canvas', this.settings)
  }
}

export class VisualizationSelectWidget extends SelectWidget {
  setProperties() {
    this.text = "Visualization type "
    this.settingName = 'plotType'
    this.setHandler = 'display-network'
  }

  get options() {
    return ['Force Directed', 'Chord Diagram']
  }
}
