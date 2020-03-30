import { Coloror, DiveringColoror, CategoricalColoror } from '../coloror'
import * as d3 from 'd3'

describe("Coloror object", () => {
  it("tests the colorScalePrefix accessor", () => {
    expect(Coloror.colorScalePrefix).toStrictEqual('interpolate')
  })

  it("tests the palette accessor", () => {
    expect(Coloror.paletteAcessor('Steve')).toStrictEqual('interpolateSteve')
  })
})

describe("DiveringColoror object", () => {
  it("tests the default palette", () => {
    expect(DiveringColoror.defaultPalette).toStrictEqual('BrBG')
  })

  it("tests the setPalette of a valid palette", () => {
    let coloror = new DiveringColoror()
    coloror.setPalette('PRGn')
    expect(coloror.palette).toStrictEqual('PRGn')
  })

  it("tests the setPalette of an invalid palette", () => {
    let coloror = new DiveringColoror()
    coloror.setPalette('Steve')
    expect(coloror.palette).toStrictEqual('BrBG')
  })

  it("tests coloring", () => {
    let coloror = new DiveringColoror()
    expect(coloror.color(.5)).toStrictEqual("rgb(238, 241, 234)")
  })
})

describe("CategoricalColoror object", () => {
  it("tests the colorScalePrefix accessor", () => {
    expect(CategoricalColoror.colorScalePrefix).toStrictEqual('scheme')
  })

  it("tests the default palette", () => {
    expect(CategoricalColoror.defaultPalette).toStrictEqual('Accent')
  })

  it("tests coloring", () => {
    const coloror = new CategoricalColoror([1, 2, 3])
    coloror.setPalette(coloror.defaultPalette)
    expect(coloror.color(1)).toStrictEqual(d3.schemeAccent[0])
  })

  it("tests getting of valid palette sizes", () => {
    expect(CategoricalColoror.palettesValidForSize(12)).toStrictEqual([
      "Set3",
      "Paired",
    ])
  })
})
