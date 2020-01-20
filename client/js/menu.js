import * as widgetDefs from './widget'

export class Menu {
  constructor(settings, attributes, callHandler) {
    this.settings = settings
    this.attributes = attributes
    this.callHandler = callHandler
    this.makeHTML()
    this.makeWidgets()
  }

  makeHTML() {
    this.HTML = document.createElement('div')
    this.HTML.id = 'webweb-menu'
    this.HTML.style.display = this.settings.hideMenu == true ? 'none' : 'flex'
  }

  // when the network changes, we will re-inject the settings, and this should
  // percolate up to the html
  refresh(settings, attributes) {
    this.settings = settings
    this.widgets.forEach((widget) => {
      widget.settings = this.settings
      widget.refresh(settings, attributes)
    }, this)
  }

  makeWidgets(){
    let rawWidgets = {
      'webweb-menu-left': {
        'network': [
          widgetDefs.NetworkSelectWidget,
          widgetDefs.NetworkLayerSelectWidget
        ],
        'size': [
          widgetDefs.SizeSelectWidget,
          widgetDefs.InvertBinarySizesWidget
        ],
        'colors': [
          widgetDefs.ColorSelectWidget,
          widgetDefs.ColorPaletteSelectWidget,
          widgetDefs.InvertBinaryColorsWidget
        ],
        'scaleLinkWidth': [widgetDefs.ScaleLinkWidthWidget],
        'scaleLinkOpacity': [widgetDefs.ScaleLinkOpacityWidget],
        'freezeNodes': [widgetDefs.FreezeNodesWidget],
        'save': [
          widgetDefs.SaveSVGWidget,
          widgetDefs.SaveCanvasWidget
        ],
      },
      'webweb-menu-right': {
        'charge': [widgetDefs.ChargeWidget],
        'linkLength': [widgetDefs.LinkLengthWidget],
        'linkStrength': [widgetDefs.LinkStrengthWidget],
        'gravity' : [widgetDefs.GravityWidget],
        'radius': [widgetDefs.RadiusWidget],
        'showNodeNames': [widgetDefs.ShowNodeNamesWidget],
        'nameToMatch': [widgetDefs.NameToMatchWidget],
      }
    }

    this.widgets = []
    for (let [sideId, sideWidgets] of Object.entries(rawWidgets)) {
      let sideMenu = document.createElement('div')
      sideMenu.id = sideId

      Object.values(sideWidgets).forEach((widgetList) => {
        let subwidgets = []

        for (let subwidgetConstructor of widgetList) {
          let widget = new subwidgetConstructor(this.settings, this.attributes, this.callHandler)
          this.widgets.push(widget)
          subwidgets.push(widget)
        }

        let container = subwidgets[0].container
        if (subwidgets.length > 1) {
          container = document.createElement('div')

          subwidgets.map((subwidget) => {
            container.append(subwidget.container)
          })
        }

        sideMenu.append(container)
      })
      this.HTML.append(sideMenu)
    }
  }
}
