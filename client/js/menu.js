import * as widgetDefs from './widget'

export class Menu {
  constructor(hideMenu) {
    this.HTML = document.createElement('div')
    this.HTML.classList.add('webweb-menu')
    this.HTML.style = 'display: ' + hideMenu ? 'none' : 'flex' + ';'
    this.sides = {}
    this.hideMenu = hideMenu
    this.widgets = {
      'left': {},
      'right': {},
    }
  }

  getSettingWidget(settingName, storeKey) {
    for (let side of Object.keys(this.widgets)) {
      const sideWidgets = this.widgets[side][storeKey] || []
      const matches = sideWidgets.filter(widget => widget.settingName === settingName)
      if (matches.length) {
        return matches[0]
      }
    }
    return undefined
  }

  updateWidgets(settings, storeKey) {
    for (let side of Object.keys(this.widgets)) {
      const sideWidgets = this.widgets[side][storeKey] || []
      sideWidgets.forEach(widget => widget.refresh(settings))
    }
  }

  addWidgets(storeKey, side, widgetsToAdd, settings, callHandler, attributes) {
    if (this.hideMenu) {
      return
    }

    const sideElement = this.getSideElement(side)
    let widgets = []
    for (let [category, widgetList] of Object.entries(widgetsToAdd)) {
      let subwidgets = []
      for (let args of widgetList) {
        let Constructor = args
        let properties = undefined
        if (args instanceof Array) {
          [Constructor, properties] = args
        }

        subwidgets.push(new Constructor(settings, callHandler, properties, attributes))
      }

      const container = document.createElement('div')

      subwidgets.forEach(subwidget => {
        container.append(subwidget.container)
      })

      sideElement.append(container)

      widgets = widgets.concat(subwidgets)
    }

    this.widgets[side][storeKey] = widgets

    let widgetSettings = new Map()
    for (let widget of widgets) {
      if (widget.settingName) {
        widgetSettings.set(widget.settingName, widget.HTMLValue)
        settings[widget.settingName] = widget.HTMLValue
      }
    }
  }

  removeWidgets(storeKey) {
    for (let side of ['left', 'right']) {
      const sideWidgets = this.widgets[side][storeKey] || []
      sideWidgets.forEach(widget => widget.container.remove())
      delete this.widgets[side][storeKey]
    }
  }

  getSideElement(side) {
    if (this.sides[side] == undefined) {
      let element = document.createElement('div')
      element.classList.add('webweb-menu-' + side)
      this.sides[side] = element
      this.HTML.append(element)
    }

    return this.sides[side]
  }
}
