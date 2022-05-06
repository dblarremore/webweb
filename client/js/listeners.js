export class GlobalListeners {
  constructor(webweb) {
    const _this = this
    this.webweb = webweb
    this.settings = this.webweb.controller.settings

    const eventKeyCodeListeners = {
      'keydown': {
        // binds the up/down arrow keys to change networks
        // up arrow
        38: (settings) => _this.gotoPreviousNetworkListener(settings),
        // down arrow
        40: (settings) => _this.gotoNextNetworkListener(settings),
        // binds the left/right arrow keys to change layers
        // left arrow
        39: (settings) => _this.switchToAdjacentLayer(settings, _this.previousLayer),
        // right arrow
        39: (settings) => _this.switchToAdjacentLayer(settings, _this.nextLayer),
        // space
        32: (settings) => _this.playNetworkLayers(settings),
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

  get currentLayer() { return this.webweb.controller.settings.layer }
  get nextLayer() { return this.currentLayer + 1 }
  get previousLayer() { return this.currentLayer - 1 }

  switchToAdjacentNetwork(settings, networkIndex) {
    if (networkIndex == undefined) {
      return
    }
    if ((0 <= networkIndex) && (networkIndex < this.webweb.networkNames.length)) {
      settings.networkName = this.webweb.networkNames[networkIndex]
      this.webweb.callHandler('display-network', settings)
    }
  }

  switchToAdjacentLayer(settings, layer) {
    if (this.webweb.getNetwork(settings.networkName).layerIsValid(layer)) {
      settings.layer = layer
      this.webweb.network.callHandler('change-layer', settings)
    }
  }

  playNetworkLayers() {
    if (this.webweb.network.layerIsValid(this.nextLayer)) {
      window.setTimeout(() => {
          this.switchToAdjacentLayer(this.webweb.controller.settings, this.nextLayer)
          this.playNetworkLayers()
      }, 1000)
    }
  }
}

