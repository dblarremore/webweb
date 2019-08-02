import * as widgetDefs from './widget'

export class Menu {
  constructor(settings, callHandler) {
    this.settings = settings
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
  refresh(settings, displayableMetadata) {
    this.settings = settings
    this.settings['metadata'] = displayableMetadata
    this.widgets.forEach((widget) => {
      widget.settings = this.settings
      widget.refresh(settings)
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
        'saveSVG': [widgetDefs.SaveSVGWidget],
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
          let widget = new subwidgetConstructor(this.settings, this.callHandler)
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


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
function changeSizes(sizeBy) {
    webweb.display.sizeBy = sizeBy;

    computeLegend();
    webweb.canvas.redraw();

    var showInvertWidget = webweb.getSizeByType() == 'binary' ? true : false;
    setInvertBinaryWidgetVisibility(showInvertWidget, 'size');
}
function changeColors(colorBy) {
    webweb.display.colorBy = colorBy;
    computeLegend();
    webweb.canvas.redraw();
    var showColorPaletteWidget = webweb.getColorByType() == 'categorical' ? true : false;
    var showInvertWidget = false;

    if (webweb.getColorByType() == 'binary') {
        showColorPaletteWidget = true;
        showInvertWidget = true;
    }
    setColorPaletteMenuVisibility(showColorPaletteWidget);
    setInvertBinaryWidgetVisibility(showInvertWidget, 'color');
}
function setColorPalette(colorPalette) {
    webweb.display.colorPalette = colorPalette;
    computeLegend();
    webweb.canvas.redraw();
}
function getBinaryValue(value, type) {
    var attribute = getBinaryInversionAttributeForType(type);

    if (webweb.display[attribute]) {
        return value ? false : true;
    }
    else {
        return value;
    }
}
function getBinaryValues(type) {
    return [getBinaryValue(false, type), getBinaryValue(true, type)];
}
function getBinaryInversionAttributeForType(type) {
    if (type == 'color') {
        return 'invertBinaryColors';
    }
    else if (type == 'size') {
        return 'invertBinarySizes';
    }
}
function setColorPaletteMenuVisibility(visible) {
    var visibility = visible ? 'inline' : 'none';
    document.getElementById('colorPaletteSelect-widget').parentElement.style.display = visibility;
}
