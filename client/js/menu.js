import * as widgetDefs from './widget'
import { MenuParameters } from './parameters'
import { SettingsHandler } from './settings_handler'

export class Menu {
  constructor(settings, box) {
    this.settingHandler = new SettingsHandler(MenuParameters, settings)
    this.HTML = this.makeHTML(this.settingHandler.settings, box)

    this.widgetsByKey = {}
    this.widgetSidesByKey = {}
    this.sides = {}
  }

  makeHTML(settings, box) {
    const HTML = document.createElement('div')
    HTML.classList.add('webweb-menu')
    HTML.style = 'display: flex;'

    if (! settings.hideMenu) {
      box.append(HTML)
    }

    return HTML
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

  addWidgets(widgets) {
    widgets.forEach(widget => {
      const key = widget.settingName
      this.widgetsByKey[key] = widget
      this.widgetSidesByKey[key] = widget.side || "left"
    })
    this.displayWidgets()
  }

  removeWidgets(widgets) {
    widgets.forEach(widget => {
      const key = widget.settingName
      this.widgetsByKey[key].container.innerHTML = ""
      delete this.widgetsByKey[key]
      delete this.widgetSidesByKey[key]
    })
  }

  displayWidgets() {
    const containersByKey = {}

    let remaps = {}
    Object.entries(this.widgetsByKey).forEach(([key, widget]) => {
      remaps[key] = widget.containerKey
    })

    remaps = this.flattenContainerRemaps(remaps)

    Object.entries(remaps).forEach(([from, to]) => {
      if (containersByKey[to] === undefined) {
        containersByKey[to] = document.createElement('div')
      }
      containersByKey[to].append(this.widgetsByKey[from].container)
    })

    // will need to reset the sides
    Object.entries(containersByKey).forEach(([key, container]) => {
      const side = this.widgetSidesByKey[key]

      if (side) {
        this.getSideElement(side).append(container)
      }
    })
  }

  // recursive bullshit :(
  flattenContainerRemaps(remaps) {
    const beingRemapped = new Set(Object.keys(remaps))
    for (let [from, to] of Object.entries(remaps)) {
      if (from === to || remaps[to] === to) {
        continue
      }

      if (beingRemapped.has(to)) {
        remaps[from] = remaps[to]
        return this.flattenContainerRemaps(remaps)
      }
    }
    return remaps
  }
}
