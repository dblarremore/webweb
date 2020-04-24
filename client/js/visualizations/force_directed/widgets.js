import { BinaryAttribute } from '../../attribute'
import { Widget, CheckboxWidget, SelectWidget, TextWidget } from '../../widget'

export function forceDirectedWidgets() {
  return {
    'right': {
      'names': [
        [
          CheckboxWidget,
          {
            'text': 'Show node names ',
            'settingName': 'showNodeNames',
            'setHandler': 'redraw',
          },
        ],
        NameToMatchWidget,
      ],
      'nodeProperties': [
        ChargeWidget,
        RadiusWidget,
      ],
      'linkLength': [LinkLengthWidget],
      'freezeNodes': [
        [
          CheckboxWidget,
          {
            'text': 'Freeze nodes ',
            'size': 10,
            'settingName': 'freezeNodeMovement',
            'setHandler': 'freeze-simulation',
          }
        ],
      ],
      'gravity' : [GravityWidget],
    }
  }
}

class RadiusWidget extends Widget {
  setProperties() {
    this.text = 'Node radius: '
    this.settingName = 'radius'
    this.setHandler = 'redraw'
  }

  change(value) {
    if (value > 0) {
      this.syncTo(value)
    }
    else {
      alert("Radius must be nonzero.")
    }
  }
}

class ChargeWidget extends Widget {
  setProperties() {
    this.text = 'Node charge: '
    this.settingName = 'charge'
    this.setHandler = 'change-force'
  }

  change(value) {
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Charge must be nonnegative.")
    }
  }
}

class LinkLengthWidget extends Widget {
  setProperties() {
    this.text = 'Link length: '
    this.settingName = 'linkLength'
    this.setHandler = 'change-force'
  }

  change(value) {
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Distance must be nonnegative.")
    }
  }
}

class GravityWidget extends Widget {
  setProperties() {
    this.text = 'Gravity: '
    this.settingName = 'gravity'
    this.setHandler = 'change-force'
  }

  change(value) {
    value = parseFloat(value)
    if (value >= 0) {
      this.syncTo(value)
    }
    else {
      alert("Gravity must be nonnegative.")
    }
  }
}
