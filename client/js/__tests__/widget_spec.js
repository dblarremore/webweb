import { Widget, SelectWidget } from '../widget'

describe("widget object", () => {
  it("tests init of HTML", () => {
    let widget = new Widget()
    widget.init({})

    let result = widget.HTML

    expect(result.id).toStrictEqual(widget.HTMLId)
  })

  it("tests init of Container", () => {
    let widget = new Widget()
    widget.init({})

    let result = widget.container

    expect(result.ContainerId).toStrictEqual(widget.ContainerId)
  })

  it("tests sync to", () => {
    let widget = new Widget()
    widget.init({})

    widget.syncTo(1)

    expect(parseInt(widget.HTMLValue)).toBe(widget.SettingValue)
  })

  it("tests showOrHide, show", () => {
    let widget = new Widget()
    widget.init({})

    widget.showOrHide()

    let actual = widget.container.style.display
    let expected = 'block'

    expect(actual).toBe(expected)
  })
  it("tests showOrHide, hide", () => {
    let widget = new Widget()
    widget.init({})
    widget.shouldBeVisible = x => false

    widget.showOrHide()

    let actual = widget.container.style.display
    let expected = 'none'

    expect(actual).toBe(expected)
  })
})

describe("selectwidget object", () => {
  it("tests settings of the options", () => {
    let widget = new SelectWidget()
    widget.init({})
    widget.setSelectOptions(widget.HTML, [1,2,3])

    let actual = widget.HTML.options.length
    let expected = 3

    expect(actual).toStrictEqual(expected)

    widget.setSelectOptions(widget.HTML, [0,1,4])
    actual = widget.HTML.selectedIndex
    expected = 1

    expect(actual).toStrictEqual(expected)
  })
})
