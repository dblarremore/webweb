import { SettingsObject } from '../../settings_object'

export class ForceDirectedSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      "sizeNodesBy": "none",
      "colorNodesBy": "none",
      // node settings
      'charge' : 60,
      'radius' : 5,
      'colorPalette' : undefined,

      // "colorEdges": true,

      "flipNodeSizeScale": false,
      "flipNodeColorScale": false,

      "nodeSizeScaleRange": [0.5, 1],
      "linkWidthScaleRange": [0.5, 1],
      "linkOpacityScaleRange": [0.5, 1],

      "nodeColorPalette": true,

      'gravity' : 0.1,
      'linkStrength' : 1,
      'linkLength' : 20,
      'scaleLinkWidth' : false,
      'scaleLinkOpacity' : false,
      'nameToMatch' : "",
      'freezeNodeMovement' : false,
      'showLegend': true,
      'showNodeNames': false,
    }
  }

  static get scales() {
    return [
      'nodeSizeScaleRange'
    ]
  }

  static get settingSynonyms() {
    return {
      'g' : { 'aliasOf': 'gravity', },
      'h' : { 'aliasOf': 'height', },
      'w': { 'aliasOf': 'width', },
      'l': { 'aliasOf': 'linkLength', },
      'c': { 'aliasOf': 'charge', },
      'r': { 'aliasOf': 'radius', },
      'sizeBy': { 'aliasOf': 'sizeNodesBy' },
      'colorBy': { 'aliasOf': 'colorNodesBy' },
    }
  }
}
