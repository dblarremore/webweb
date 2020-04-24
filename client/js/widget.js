import { UserColorAttribute } from './attribute'

export class Widget {
  get type() { return 'input' }
  get elementType() { return this.inline ? 'span' : 'div' }
  get elementDisplay() { return this.inline ? 'inline' : 'block' }
  get events() { return ['change'] }
  get defaults() { return {} }

  constructor(settings, properties={}) {
    this.settings = settings
    this.inline = true

    Object.assign(this, this.defaults)
    Object.assign(this, properties)

    this.update(this.settings)
  }

  update(settings) {
    this.settings = settings
    this.syncTo(this.SettingValue)
    this.setVisibility()
  }

  call() {
    if (this.setHandler !== undefined && this.callHandler !== undefined) {
      this.callHandler(this.setHandler, this.settings)
    }
  }

  get containerKey() {
    return this.displayWith || this.settingName
  }

  set visible(value) { this._value = value }
  get visible() { 
    if (this._value === undefined) {
      this._value = true
    }

    return this._value
  }

  setVisibility() {
    const visible = this.alwaysVisible ? true : this.visible
    this.container.style.display = visible ? this.elementDisplay : 'none'
  }

  get container() {
    if (this._container === undefined) {
      this._container = document.createElement(this.elementType)

      if (this.text !== undefined) {
        this._container.innerHTML = this.text
      }
      this._container.append(this.HTML)

      // only need listeners if we ever display this
      this.addListeners(this.HTML)
    }

    return this._container
  }

  get HTML() {
    if (this._HTML === undefined) {
      this._HTML = document.createElement('input')
      this._HTML.type = this.type || 'text'
      this._HTML.size = this.size || 3
    }

    return this._HTML
  }

  addListeners(HTML) {
    const _this = this
    this.events.forEach(eventName => {
      HTML.addEventListener(eventName, (event) => {
        let value = event.target.value
        if (_this.type !== undefined && _this.type == 'checkbox') {
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

  get HTMLValue() { return this.HTML.value }
  set HTMLValue(value) { this.HTML.value = value }

  get SettingValue() {
    if (this.settingName !== undefined) {
      return this.settings[this.settingName] 
    }
  }

  set SettingValue(value) {
    if (this.settingName !== undefined) {
      this.settings[this.settingName] = value
    }

    this.call()
  }

  change(value) { this.syncTo(value) }
  input(value) { this.syncTo(value) }
}

export class CheckboxWidget extends Widget {
  get type() { return 'checkbox' }
  get defaults() { return {'size': 10} }

  get HTMLValue() { return this.HTML.checked ? true : false }
  set HTMLValue(value) { this.HTML.checked = value ? true : false }
}

export class SelectWidget extends Widget {
  get type() { return 'select' }
  get defaults() { return {'options': []} }

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

  get HTML() {
    if (this._HTML === undefined) {
      this._HTML = document.createElement('select')
      this.setSelectOptions(this._HTML, this.options)
    }

    return this._HTML
  }

  get HTMLValue() {
    if (this.HTML.options !== undefined) {
      let index = this.HTML.selectedIndex

      if (this.HTML.options[index] !== undefined) {
        return this.HTML.options[index].text
      }
    }

    return undefined
  }

  set HTMLValue(value) {
    for (let i = 0; i < this.HTML.options.length; i++) {
      if (this.HTML.options[i].innerHTML == value) {
        this.HTML.selectedIndex = i
      }
    }
  }

  set options(options) {
    this._options = options
    this.setSelectOptions(this.HTML, this._options)
    this.visible = this._options.length > 1
  }

  get options() { return this._options }
}

export class ButtonWidget extends Widget {
  get type() { return 'button' }
  get events() { return ['click'] }

  get HTML() {
    if (this._HTML === undefined) {
      this._HTML = document.createElement('button')
      this._HTML.type = 'button'
      this._HTML.size = this.size || 3
      this._HTML.innerHTML = this.value
    }

    return this._HTML
  }

  click() { this.call() }
}

export class TextWidget extends Widget {
  get events() { return ['input'] }
}
