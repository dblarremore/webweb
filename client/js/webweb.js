/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { Menu } from './menu'
import { GlobalListeners } from './listeners'
import { Network } from './network'
import { WebwebCanvas } from './canvas'
import * as utils from './utils'
import { CommonParameters } from './parameters'
import { SettingsHandler } from './settings_handler'

import * as d3 from 'd3'
import { saveAs } from 'file-saver'

import '../css/style.css'

export class Webweb {
  constructor(webwebData) {
    window.addEventListener("load", () => this.init(webwebData))
  }

  init(webwebData) {
    this.raw = webwebData
    this.title = this.raw.title || 'webweb'
    this.networkNames = Object.keys(this.raw.networks) || ['webweb']
    this.networks = {}
    this.global = {
      'nodes': this.raw.display.nodes,
      'metadata': this.raw.display.metadata,
      'settings': this.raw.display,
    }

    console.log(this.global.settings)
    this.menu = new Menu(this.global.settings)

    this.settingsHandler = this.makeSettingsHandler()

    if (! this.menu.settingHandler.settings.hideMenu) {
      this.HTML.append(this.menu.HTML)
    }

    this.canvas = new WebwebCanvas(this.global.settings, this.HTML.clientWidth)
    this.HTML.append(this.canvas.container)

    // listeners isn't going to work right now while we don't have the
    // appropriate layersettings stuff
    // this.listeners = new GlobalListeners(this.callHandler)
    this.displayNetwork(this.settingsHandler.settings.networkName)
  }

  makeSettingsHandler() {
    const definitions = CommonParameters
    definitions.networkName.options = this.networkNames

    return new SettingsHandler(
      definitions,
      this.global.settings,
      this.callHandler,
      this.menu,
    )
  }

  get callHandler() {
    if (this._callHandler === undefined) {
      this._callHandler = utils.getCallHandler({
        'display-network': settings => this.displayNetwork(settings.networkName),
        'save-svg': () => {
          let svg = this.canvas.svgDraw()
          const title = this.settingsHandler.settings.networkName
          svg.setAttribute("title", title)
          svg.setAttribute("version", 1.1)
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")

          try {
            let blob = new Blob([svg.outerHTML], {type: "image/svg+xml"})
            saveAs(blob, title)
          } catch (e) {
            alert("can't save :(")
          }
        },
        'save-canvas': settings => {
          const link = document.createElement('a')
          link.download = settings.networkName + ".png"
          link.href = this.canvas.HTML.toDataURL()
          link.click()
        }
      })
    }

    return this._callHandler
  }

  getNetwork(name) {
    if (this.networks[name] === undefined) {
      this.networks[name] = new Network(
        this.raw.networks[name],
        this.global,
        this.menu,
        this.canvas,
      )
    }

    return this.networks[name]
  }

  displayNetwork(networkName) {
    const network = this.getNetwork(networkName)
    network.displayLayer(this.settingsHandler.settings.layer)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // HTML Manipulations
  ////////////////////////////////////////////////////////////////////////////////
  get HTML() {
    if (this._HTML === undefined) {
      let HTMLParentElementId = this.settingsHandler.settings.HTMLParentElementId

      if (HTMLParentElementId !== undefined) {
        this._HTML = document.getElementById(HTMLParentElementId)
      }
      else {
        this._HTML = document.createElement('div')
        this._HTML.classList.add('webweb-center')
        document.getElementsByTagName("body")[0].appendChild(this._HTML)

        if (this.title !== undefined) {
          document.title = this.title
        }
      }
    }

    return this._HTML
  }
}
