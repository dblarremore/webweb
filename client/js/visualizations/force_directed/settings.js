import { SettingsObject } from '../../settings_object'

export class ForceDirectedSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      // node settings
      'charge' : 60,
      'radius' : 5,
      'gravity' : 0.1,
      'linkStrength' : 1,
      'linkLength' : 20,
      'freezeNodeMovement' : false,

      "sizeNodesBy": "none",
      "flipNodeSizeScale": false,
      "nodeSizeScaleRange": [0.5, 1.5],

      "colorNodesBy": "none",
      "flipNodeColorScale": false,
      "nodeColorPalette": undefined,

      'scaleLinkWidth' : false,
      "linkWidthScaleRange": [0.5, 1],

      'scaleLinkOpacity' : false,
      "linkOpacityScaleRange": [0.5, 1],

      'showLegend': true,
      'nameToMatch' : "",
      'showNodeNames': false,
    }
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
      'colorPalette': { 'aliasOf': 'nodeColorPalette' },
    }
  }

  static get attributes() {
    return {
      'nodeColor': {
        'input': 'colorNodesBy',
        'flip': 'flipNodeColorScale',
        'colorPalette': 'nodeColorPalette',
        'type': 'color',
        'from': 'layer',
      },
      'nodeSize': {
        'input': 'sizeNodesBy',
        'flip': 'flipNodeSizeScale',
        'range': "nodeSizeScaleRange",
        'from': 'layer',
        'type': 'size',
      },
      'linkWidth': {
        'on': 'scaleLinkWidth',
        'range': "linkWidthScaleRange",
        'from': 'visualization',
      },
      'linkOpacity': {
        'on': 'scaleLinkOpacity',
        'range': "linkOpacityScaleRange",
        'from': 'visualization',
      },
    }
  }
}
