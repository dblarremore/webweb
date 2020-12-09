/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { GlobalListeners } from './listeners'
import { Network } from './network'
import { WebwebCanvas } from './canvas'
import * as utils from './utils'
import { GlobalParameters } from './parameters'
import { Controller } from './settings_handler'

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

    this.controller = new Controller(this.global.settings)

    // Parameter Collection
    const definitions = GlobalParameters
    definitions.networkName.options = this.networkNames

    this.controller.addParameterCollection('global', definitions, this.callHandler)

    if (! this.controller.settings.hideMenu) {
      this.HTML.append(this.menu.HTML)
    }

    this.controller.canvas = new WebwebCanvas(this.controller, this.HTML.clientWidth)
    this.HTML.append(this.controller.canvas.container)

    // listeners isn't going to work right now while we don't have the
    // appropriate layersettings stuff
    // this.listeners = new GlobalListeners(this.callHandler)
    this.displayNetwork(this.controller.settings.networkName)
  }

  get callHandler() {
    if (this._callHandler === undefined) {
      this._callHandler = utils.getCallHandler({
        'display-network': settings => this.displayNetwork(settings.networkName),
        'save-svg': () => {
          let svg = this.controller.canvas.svgDraw()
          const title = this.controller.settings.networkName
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
          link.href = this.controller.canvas.HTML.toDataURL()
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
        this.controller,
      )
    }

    return this.networks[name]
  }

  displayNetwork(networkName) {
    this.controller.settings.networkName = networkName
    this.getNetwork(networkName).displayLayer(this.controller.settings.layer)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // HTML Manipulations
  ////////////////////////////////////////////////////////////////////////////////
  get HTML() {
    if (this._HTML === undefined) {
      let HTMLParentElementId = this.controller.settings.HTMLParentElementId

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
