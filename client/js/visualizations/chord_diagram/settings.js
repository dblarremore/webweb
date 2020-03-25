import { SettingsObject } from '../../settings_object'

export class ChordDiagramSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      "colorNodesBy": "none",
      "nodeColorPalette": true,
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

  static get scales() {
    return [
      'nodeSizeScaleRange'
    ]
  }

  static get settingSynonyms() {
    return {
      'sizeBy': { 'aliasOf': 'sizeNodesBy' },
      'colorBy': { 'aliasOf': 'colorNodesBy' },
    }
  }
}
