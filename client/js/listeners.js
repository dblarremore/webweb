export class GlobalListeners {
  constructor(settings, callHandler) {
    const _this = this
    this.settings = settings
    this.callHandler = callHandler

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
            listener(_this.settings)
        }
      })
    }
  }

  gotoPreviousNetworkListener(settings) {
    let currentNetworkIndex = settings.networkNames.indexOf(settings.networkName)
    this.switchToAdjacentNetwork(settings, currentNetworkIndex - 1)
  }

  gotoNextNetworkListener(settings) {
    let currentNetworkIndex = settings.networkNames.indexOf(settings.networkName)
    this.switchToAdjacentNetwork(settings, currentNetworkIndex + 1)
  }

  switchToAdjacentNetwork(settings, networkIndex) {
    if (networkIndex == undefined) {
      return
    }
    if ((0 <= networkIndex) && (networkIndex < settings.networkNames.length)) {
      settings.networkName = settings.networkNames[networkIndex]
      this.callHandler('display-network', settings)
    }
  }
  gotoNextLayerListener(settings) {
    this.switchToAdjacentLayer(settings, settings.networkLayer + 1)
  }
  gotoPreviousLayerListener(settings) {
    this.switchToAdjacentLayer(settings, settings.networkLayer - 1)
  }

  switchToAdjacentLayer(settings, layerIndex) {
    if (layerIndex == undefined) {
      return
    }
    const layerCount = settings.networkLayers[settings.networkName]
    if ((0 <= layerIndex) && (layerIndex < layerCount)) {
      settings.networkLayer = layerIndex
      this.callHandler('display-network', settings)
    }
  }
  addEventListeners() {
    let _this = this
    for (let [eventName, keyCodeToListener] of Object.entries(this.eventTokeyCodesToListeners)) {
      window.addEventListener(eventName, (event) => {
        let keyCode = event.keyCode
        let listener = keyCodeToListener[keyCode]
        if (listener !== undefined) {
            listener(_this.settings, event)
        }
      })
    }
  }
}
function playNetworkLayers() {
    window.setTimeout(function() {
        changeNetworkLayerListener({'keyCode' : 39});
        playNetworkLayers();
    }, 1000);
}
