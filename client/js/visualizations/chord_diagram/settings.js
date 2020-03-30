import { SettingsObject } from '../../settings_object'

export class ChordDiagramSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      "colorNodesBy": "none",
      "nodeColorPalette": undefined,
      "flipNodeColorScale": false,

      "colorEdges": true,
      "edgeColorPalette": undefined,
      "flipEdgeColorScale": false,

      "sortNodesBy": "out degree",
      "sortNodes": 'descending',

      // so far these don't exist
      // "sizeNodesBy": "none",
      // "flipNodeSizeScale": false,
      // "nodeSizeScaleRange": [0.5, 1],
      // "nodesToShow": -1,
    }
  }

  static get settingSynonyms() {
    return {
      'colorBy': { 'aliasOf': 'colorNodesBy' },
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
      'edgeColor': {
        'flip': 'flipEdgeColorScale',
        'colorPalette': 'edgeColorPalette',
        'on': 'colorEdges',
        'from': 'visualization',
      },
    }
  }
}
