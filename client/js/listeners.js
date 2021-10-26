export class GlobalListeners {
  constructor(webweb) {
    const _this = this
    this.webweb = webweb

    const eventKeyCodeListeners = {
      'keydown': {
        // binds the up/down arrow keys to change networks
        // up arrow
        38: (settings) => _this.gotoPreviousNetworkListener(settings),
        // down arrow
        40: (settings) => _this.gotoNextNetworkListener(settings),
        // binds the left/right arrow keys to change layers
        // left arrow
        37: (settings) => _this.gotoPreviousLayerListener(settings),
        // right arrow
        39: (settings) => _this.gotoNextLayerListener(settings),
      }
    }

    for (let [eventName, keyCodeToListener] of Object.entries(eventKeyCodeListeners)) {
      window.addEventListener(eventName, (event) => {
        let keyCode = event.keyCode
        let listener = keyCodeToListener[keyCode]
        if (listener !== undefined) {
            listener(_this.webweb.controller.settings)
        }
      })
    }
  }

  gotoPreviousNetworkListener(settings) {
    let currentNetworkIndex = this.webweb.networkNames.indexOf(settings.networkName)
    this.switchToAdjacentNetwork(settings, currentNetworkIndex - 1)
  }

  gotoNextNetworkListener(settings) {
    let currentNetworkIndex = this.webweb.networkNames.indexOf(settings.networkName)
    this.switchToAdjacentNetwork(settings, currentNetworkIndex + 1)
  }

  switchToAdjacentNetwork(settings, networkIndex) {
    if (networkIndex == undefined) {
      return
    }
    if ((0 <= networkIndex) && (networkIndex < this.webweb.networkNames.length)) {
      settings.networkName = this.webweb.networkNames[networkIndex]
      this.webweb.callHandler('display-network', settings)
    }
  }

  gotoNextLayerListener(settings) {
    this.switchToAdjacentLayer(settings, settings.layer + 1)
  }

  gotoPreviousLayerListener(settings) {
    this.switchToAdjacentLayer(settings, settings.layer - 1)
  }

  switchToAdjacentLayer(settings, layer) {
    if (layer === undefined) {
      return
    }

    const network = this.webweb.getNetwork(settings.networkName)
    const layerCount = network.layers.length

    if ((0 <= layer) && (layer < layerCount)) {
      settings.layer = parseInt(layer)
      this.webweb.callHandler('display-network', settings)
    }
  }
}

// function playNetworkLayers() {
//   window.setTimeout(function() {
//     changeNetworkLayerListener({'keyCode' : 39})
//     playNetworkLayers()
//   }, 1000)
// }
