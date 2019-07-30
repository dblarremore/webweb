import { Webweb } from '../webweb.v6'

describe("network object metadata regularization", () => {
  const webjson = {"display": {"scaleLinkWidth": true, "colorBy": "degree"}, "networks": {"webweb": {"layers": [{"edgeList": [[0, 1], [0, 1], [1, 2], [2, 3]], "nodes": {"0": {"name": 0}, "1": {"name": 1}, "2": {"name": 2}, "3": {"name": 3}}, "metadata": null}]}}, "title": "webweb"}

  it("tests that webweb loads title properly", () => {
    let web = new Webweb(webjson)
    expect(web.title).toStrictEqual('webweb')
  })

  it("tests `webweb` settings loaded properly", () => {
    let web = new Webweb(webjson)
    expect(web.state.global.settings).toStrictEqual({
      "freezeNodeMovement": false,
      "hideMenu": false,
      'showLegend': true,
      "metadata": {},
      "g": 0.1,
      "nameToMatch": "",
      "networkNames": [
        "webweb",
      ],
      "networkName": "webweb",
      'w': 1000,
      'h': 600,
      'height': undefined,
      'width': undefined,
      "networkLayer": 0,
      "sizeBy": "none",
      "colorBy": "degree",
      'c' : 60,
      'r' : 5,
      'colorPalette' : 'Set1',
      'invertBinaryColors' : false,
      'invertBinarySizes' : false,
      'linkStrength' : 1,
      'l' : 20,
      'scaleLinkWidth' : true,
      'scaleLinkOpacity' : false,
      'scales': {
        'linkWidth' : {
          'min': 1,
          'max': 1,
          'type': 'linear',
        },
        'linkOpacity' : {
          'min': 0.4,
          'max': 0.9,
          'type': 'linear',
        },
        "categoricalColors": {
          "max": 1,
          "min": 1,
          'type': 'ordinal',
        },
        "scalarColors": {
          "max": 1,
          "min": 1,
          'type': 'linear',
        },
        "nodeSize": {
          "max": 1,
          "min": 1,
          'type': 'linear',
        },
      }
    })
  })

  // put the max of a value to 2
  const webjson_2 = {"display": {"scaleLinkWidth": true, "colorBy": "degree", "scales": {"categoricalColors": {"max": 2}}}, "networks": {"webweb": {"layers": [{"edgeList": [[0, 1], [0, 1], [1, 2], [2, 3]], "nodes": {"0": {"name": 0}, "1": {"name": 1}, "2": {"name": 2}, "3": {"name": 3}}, "metadata": null}]}}, "title": "webweb"}

  it("tests `node` settings loaded properly", () => {
    let web = new Webweb(webjson_2)
    expect(web.state.global.settings).toStrictEqual({
      "freezeNodeMovement": false,
      "hideMenu": false,
      'showLegend': true,
      "metadata": {},
      "g": 0.1,
      "nameToMatch": "",
      "networkNames": [
        "webweb",
      ],
      "networkName": "webweb",
      'w': 1000,
      'h': 600,
      'width': undefined,
      'height': undefined,
      "networkLayer": 0,
      "sizeBy": "none",
      "colorBy": "degree",
      'c' : 60,
      'r' : 5,
      'colorPalette' : 'Set1',
      'invertBinaryColors' : false,
      'invertBinarySizes' : false,
      'linkStrength' : 1,
      'l' : 20,
      'scaleLinkWidth' : true,
      'scaleLinkOpacity' : false,
      'scales': {
        'linkWidth' : {
          'min': 1,
          'max': 1,
          'type': 'linear',
        },
        'linkOpacity' : {
          'min': 0.4,
          'max': 0.9,
          'type': 'linear',
        },
        "categoricalColors": {
          "max": 2,
          "min": 1,
          'type': 'ordinal',
        },
        "scalarColors": {
          "max": 1,
          "min": 1,
          'type': 'linear',
        },
        "nodeSize": {
          "max": 1,
          "min": 1,
          'type': 'linear',
        },
      }
    })
  })
})

describe("network state construction", () => {
  const webjson = {"display": {"scaleLinkWidth": true, "colorBy": "degree"}, "networks": {"webweb": {"layers": [{"edgeList": [[0, 1], [0, 1], [1, 2], [2, 3]], "nodes": {"0": {"name": 0}, "1": {"name": 1}, "2": {"name": 2}, "3": {"name": 3}}, "metadata": null}]}}, "title": "webweb"}

  it("tests that the states are different and don't modify each other", () => {
    let web = new Webweb(webjson)

    expect(web.networks.webweb.state.node).toStrictEqual(web.state.global.node)

    web.state.global.colorBy = 'NOTHING AT ALL'
    web.networks.webweb.state.colorBy = 'SOMETHING AT ALL'

    expect(web.state.global.colorBy).toStrictEqual('NOTHING AT ALL')

    let web2 = new Webweb(webjson)

    web2.networks.webweb.state.colorBy = 'SOMETHING AT ALL'
    web2.state.global.colorBy = 'NOTHING AT ALL'

    expect(web2.networks.webweb.state.colorBy).toStrictEqual('SOMETHING AT ALL')
  })

})
