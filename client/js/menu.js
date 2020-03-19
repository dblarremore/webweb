import * as widgetDefs from './widget'

export class Menu {
  constructor(settings, attributes) {
    this.settings = settings

    if (! this.settings.hideMenu) {
      this.attributes = attributes
      this.makeHTML()
      this.makeWidgets()
    }
    else {
      this.HTML = document.createElement('div')
      this.HTML.style = "display: none;"
    }
  }

  makeHTML() {
    this.HTML = document.createElement('div')
    this.HTML.classList.add('webweb-menu')
    this.HTML.style.display = this.settings.hideMenu == true ? 'none' : 'flex'
  }

  // when the network changes, we will re-inject the settings, and this should
  // percolate up to the html
  refresh(settings, attributes, callHandler) {
    if (settings.hideMenu) {
      return
    }

    this.settings = settings
    this.widgets.forEach((widget) => {
      widget.settings = this.settings
      widget.refresh(settings, attributes, callHandler)
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
    for (let [sideClass, sideWidgets] of Object.entries(rawWidgets)) {
      let sideMenu = document.createElement('div')
      sideMenu.classList.add(sideClass)

      Object.values(sideWidgets).forEach((widgetList) => {
        let subwidgets = []

        for (let subwidgetConstructor of widgetList) {
          let widget = new subwidgetConstructor(this.settings, this.attributes)
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
