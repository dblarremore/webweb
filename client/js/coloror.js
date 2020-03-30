import * as d3 from 'd3'

export class Coloror {
  static get colorScalePrefix() { return 'interpolate' }
  static get defaultColor() { return d3.rgb(128, 128, 128) }

  constructor(values) {
    this.values = values
    this.setPalette()
  }

  static paletteAcessor(palette) {
    return this.colorScalePrefix + palette
  }

  color(value) {
    return d3[this.constructor.paletteAcessor(this.palette)](value)
  }

  setPalette(palette) {
    if (! this.constructor.palettes.includes(palette)) {
      palette = this.constructor.defaultPalette
    }
    this.palette = palette
  }

  static get palettes() { return [] }

  static get defaultPalette() {
    return this.palettes[0]
  }
}

export class NoneColoror extends Coloror {
  color(value) {
    return this.constructor.defaultColor
  }
}

export class DiveringColoror extends Coloror {
  static get palettes() {
    return [
      "BrBG",
      "PRGn",
      "PiYG",
      "PuOr",
      "RdBu",
      "RdGy",
      "RdYlBu",
      "RdYlGn",
      "Spectral",
    ]
  }
}

export class SequentialColoror extends Coloror {
  static get palettes() {
    return [
      "BuGn",
      "BuPu",
      "GnBu",
      "OrRd",
      "PuBuGn",
      "PuBu",
      "PuRd",
      "RdPu",
      "YlGnBu",
      "YlGn",
      "YlOrBr",
      "YlOrRd",
    ]
  }
}

export class SingleHueColoror extends Coloror {
  static get palettes() {
    return [
      "Blues",
      "Greens",
      "Greys",
      "Oranges",
      "Purples",
      "Reds"
    ]
  }
}

export class MultiHueColoror extends Coloror {
  static get palettes() {
    return [
      "Viridis",
      "Inferno",
      "Magma",
      "Plasma",
      "Warm",
      "Cool",
      "Rainbow",
      "CubehelixDefault",
    ]
  }
}

export class CyclicalColoror extends Coloror {
  static get palettes() {
    return [
      'Rainbow',
      'Sinebow',
    ]
  }
}

export class CategoricalColoror extends Coloror {
  static get colorScalePrefix() { return 'scheme' }

  static get defaultPalette() {
    return Object.keys(this.palettes)[0]
  }

  static palettesValidForSize(size) {
    return Object.keys(this.palettes).filter(palette => size <= this.palettes[palette])
  }

  setPalette(palette) {
    if (! Object.keys(this.constructor.palettes).includes(palette)) {
      palette = this.constructor.defaultPalette
    }
    else if (this.constructor.palettes[palette] < this.values.length) {
      palette = this.getPalettesValidForSize(this.values.length)[0]
    }

    this.palette = palette
  }

  color(value) {
    return d3[this.constructor.paletteAcessor(this.palette)][this.values.indexOf(value)]
  }

  static get palettes() {
    return {
      "Accent": 8,
      "Category10": 10,
      "Dark2": 8,
      "Set1": 9,
      "Set2": 8,
      "Set3": 12,
      "Paired": 12,
      "Pastel1": 9,
      "Pastel2": 8,
    }
  }
}
