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

  addWidgets(storeKey, side, widgetsToAdd, settings, callHandler, attributes) {
    if (this.hideMenu) {
      return
    }

    const sideElement = this.getSideElement(side)
    let widgets = []
    for (let [category, widgetList] of Object.entries(widgetsToAdd)) {
      let subwidgets = widgetList.map(Constructor => new Constructor(settings, callHandler, attributes))

      let container = document.createElement('div')

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
