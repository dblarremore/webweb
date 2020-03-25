import { Coloror, DiveringColoror } from '../coloror'

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
    let coloror = new DiveringColoror('PRGn')
    expect(coloror.palette).toStrictEqual('PRGn')
  })

  it("tests the setPalette of an invalid palette", () => {
    let coloror = new DiveringColoror('Steve')
    expect(coloror.palette).toStrictEqual('BrBG')
  })

  it("tests coloring", () => {
    let coloror = new DiveringColoror()
    expect(coloror.color(.5)).toStrictEqual("rgb(238, 241, 234)")
  })
})


