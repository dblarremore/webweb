import * as shapes from './shapes'

export class Tutorial {
    get linkColor() { return '#449ef3' }
    get gray() { return '#5E5E5E' }
    get blue() {
        const attribute = this.controller.collections['visualization'].attributeParameters.edgeColor.attribute
        return attribute.getColorValue(.875)
    }
    get red() {
        const attribute = this.controller.collections['visualization'].attributeParameters.edgeColor.attribute
        return attribute.getColorValue(.125)
    }

    get steps() {
        return [
            {
                'edges': [],
                'nodeLabels': [
                    {
                        'index': 0,
                        'text': 'university A',
                    },
                    {
                        'index': 1,
                        'text': 'university B',
                    },
                    {
                        'index': 2,
                        'text': 'university C',
                    },
                    {
                        'index': 3,
                        'text': 'etc',
                    },
                ],
                'text': [
                    "Each arc segment is",
                    "a university in the field.",
                ],
                'showLegend': false,
            },
            {
                'edges': [],
                'nodeLabels': [
                    {
                        'index': 4,
                        'text': 'highly productive',
                    },
                    {
                        'index': 5,
                        'text': 'less productive',
                    },
                ],
                'text': [
                    "The size of a university's arc segment",
                    "is proportional to the number of",
                    "in-field faculty it produced.",
                ],
                'showLegend': false,
            },
            {
                'edges': [],
                'nodeLabels': [
                    {
                        'index': 0,
                        'text': 'highest prestige',
                    },
                    {
                        'index': 1,
                        'text': '2nd highest prestige',
                    },
                    {
                        'index': -1,
                        'text': 'lowest prestige',
                        'rotate': -1,
                    },
                ],
                'text': [
                    "Universities are arranged around the circle",
                    "in clockwise order by prestige,",
                    "from most prestigious to least.",
                ],
                'showLegend': false,
                'arc': {
                    'label': 'decreasing prestige',
                    'startAngle': -65 * (Math.PI / 180),
                    'endAngle': -35 * (Math.PI / 180),
                },
            },
            {
                'showEdges': true,
                // 'edges': [
                //     {
                //         "source": 0,
                //         "target": 2,
                //     },
                //     {
                //         "source": 4,
                //         "target": 3,
                //     },
                // ],
                'nodeLabels': [],
                'text': [
                    "Universities are connected by a chord",
                    "when at least one of the two employs",
                    "the other's graduates.",
                ],
                'showLegend': false,
            },
            {
                'showEdges': true,
                // 'edges': [
                //     {
                //         "source": 0,
                //         "target": 2,
                //     },
                //     {
                //         "source": 4,
                //         "target": 3,
                //     },
                // ],
                'nodeLabels': [],
                'text': [
                    "Chords are colored by the direction of flow:",
                    "Chords are blue when higher prestige PhDs",
                    "take less prestigious faculty jobs.",
                    "These faculty moved “down” the prestige hierarchy.",
                    "Chords are red when lower prestige PhDs",
                    "take more prestigious faculty jobs.",
                    "These faculty moved “up” the prestige hierarchy.",
                ],
                'textColors': [
                    'black',
                    '#648DBA',
                    '#648DBA',
                    'black',
                    '#BB6161',
                    '#BB6161',
                    'black',
                ],
                'showLegend': true,
            },
            {
                'edges': [],
                'nodeLabels': [],
                'text': ["that's it!"],
                'showLegend': true,
            },
        ]
    }

    constructor(webweb) {
        this.webweb = webweb
        this.stepNumber = 2
        this.listen = true

        this.controller = this.webweb.controller
        this.canvas = this.controller.canvas
        this.addListeners(this.canvas)

        // TODO: set network to tutorial network
        // this.webweb.controller.canvas.listen = false
        this.displayStep()
    }

    get listeners() {
        return {
            "keydown": this.getKeydownListener(),
            "mousemove": this.getMouseMoveListener(),
            "mousedown": this.getMouseDownListener(),
        }
    }

    addListeners(canvas) {
        for (let [event, eventFunction] of Object.entries(this.listeners)) {
            window.addEventListener(event, eventFunction)
        }
    }

    getMouseMoveListener() {
        return (event) => {
            if (this.listen) {
                this.canvas.setMouseState(event)
                this.setButtonStates()
            }
        }
    }

    getKeydownListener() {
        return (event) => {
            if (this.listen) {
                let fn = this.keydownListeners[event.keyCode]

                if ((fn !== undefined) && (this.listen)) {
                    fn()
                }
            }
        }
    }

    getMouseDownListener() {
        return (event) => {
            if (this.listen) {
                this.buttons.forEach(button => {
                    if (button.isMouseOver === true) {
                        button.onclick()
                    }
                })
            }
        }
    }

    hasNextStep() { return this.stepNumber + 1 < this.steps.length }
    hasPrevStep() { return this.stepNumber - 1 >= 0 }

    quit() {
        this.listen = false

        // TODO: reset network
        this.canvas.listen = true

        this.webweb.network.displayLayer()
        let viz = this.webweb.network.visualization
        viz.makeLegendElements()
        this.canvas.resetObjectsToDraw()
    }

    progress() {
        if (this.hasNextStep()) {
            this.stepNumber += 1
            this.displayStep()
        } else {
            this.quit()
        }
    }

    regress() {
        if (this.hasPrevStep()) {
            this.stepNumber -= 1
            this.displayStep()
        } else {
            this.quit()
        }
    }

    get keydownListeners() {
        return {
            // left arrow
            37: _ => this.regress(),
            // right arrow
            39: _ => this.progress(),
            // escape
            27: _ => this.quit(),
        }
    }

    get stepFontSize() {
        let canvas = this.webweb.network.visualization.controller.canvas
        let width = canvas.width

        if (width < 400) {
            return 11
        }
        else if (width < 600) {
            return 14
        }
        else if (width < 800) {
            return 16
        }
        else {
            return 17
        }
    }

    get nodeTextFontSize() {
        let canvas = this.webweb.network.visualization.controller.canvas
        let width = canvas.width

        if (width < 400) {
            return 8
        }
        else if (width < 600) {
            return 9
        }
        else if (width < 800) {
            return 10
        }
        else {
            return 11
        }
    }

    get visualization() {
        return this.webweb.network.visualization
    }

    setEdges() {
        let reverseNodeSortMap = this.visualization.reverseNodeSortMap

        let minNodeWithEdgeToNodeOne = 10000000000
        let minNodeWithEdgeToNodeTwo = 10000000000

        for (let [i, chord] of Object.entries(this.visualization.chords)) {
            this.visualization.edgesToDraw[i].opacity = 0

            const source = reverseNodeSortMap[chord.source.index]
            const target = reverseNodeSortMap[chord.target.index]

            if ((source === 0) && (target < minNodeWithEdgeToNodeOne)) {
                minNodeWithEdgeToNodeOne = target
            }

            if ((source === 1) && (target < minNodeWithEdgeToNodeTwo)) {
                if (target > source) {
                    minNodeWithEdgeToNodeTwo = target
                }
            }
        }
        
        if (this.steps[this.stepNumber].showEdges === true) {
            for (let [i, chord] of Object.entries(this.visualization.chords)) {
                const source = reverseNodeSortMap[chord.source.index]
                const target = reverseNodeSortMap[chord.target.index]

                if ((source === 0) && (target === minNodeWithEdgeToNodeOne)) {
                    this.visualization.edgesToDraw[i].opacity = this.visualization.opacities.default
                    this.visualization.edgesToDraw[i].color = this.blue
                }

                if ((source === 1) && (target === minNodeWithEdgeToNodeTwo)) {
                    this.visualization.edgesToDraw[i].opacity = this.visualization.opacities.default
                    this.visualization.edgesToDraw[i].color = this.red
                }
            }
        }
    }

    displayStep() {
        const step = this.steps[this.stepNumber]

        this.webweb.network.displayLayer()
        let viz = this.webweb.network.visualization

        this.canvas.resetObjectsToDraw()

        viz.listen = false

        if (step.showLegend) {
            viz.makeLegendElements()
        }
        else {
            viz.legendTexts = []
            viz.legendNodes = []
        }

        viz.setNodesToDraw()
        viz.setEdgesToDraw()

        viz.setTexts()

        let texts = []
        step.nodeLabels.forEach(nodeLabel => {
            let index = nodeLabel.index

            if (index < 0) {
                index = viz.texts.length + index
            }

            let text = viz.texts[viz.reverseNodeSortMap[index]]
            text.value = nodeLabel.text
            text.font = this.nodeTextFontSize + "px"

            if (nodeLabel.rotate !== undefined) {
                text.rotate *= nodeLabel.rotate
                text.textAlign = 'left'
            }

            texts.push(text)
        })
        viz.texts = texts

        viz.focalNode = undefined
        viz.focalEdge = undefined
        viz.exteriorAnnotationLabels = []

        viz.updateFocusedElements()

        this.setEdges()
        // for (let [i, chord] of Object.entries(viz.chords)) {
        //     const source = viz.reverseNodeSortMap[chord.source.index]
        //     const target = viz.reverseNodeSortMap[chord.target.index]
        //
        //     let hide = true
        //     step.edges.forEach(edge => {
        //         if ((viz.reverseNodeSortMap[edge.source] === source) && (viz.reverseNodeSortMap[edge.target] === target)) {
        //             hide = false
        //         }
        //     })
        //
        //     if (hide) {
        //         viz.edgesToDraw[i].opacity = 0
        //     }
        // }

        let totalHeight = this.stepFontSize * step.text.length
        let y = 0 - (totalHeight / 2)

        let i = 0
        step.text.forEach(text => {
            let color = step.textColors !== undefined ? step.textColors[i] : 'black'

            let t = new shapes.Text(
                text,
                0,
                y,
                this.stepFontSize + 'px',
                'center',
                color,
                0,
            )

            t.textAlign = 'center'

            viz.textsToDraw.push(t)

            y += this.stepFontSize
            i += 1
        })

        let textYEnd = y

        if (step.arc) {
            let radius = viz.objectSettings.radius.outside + viz.objectSettings.radius.pad * 1
            let angle = -50 * (Math.PI / 180)
            let x = Math.cos(angle) * radius
            let y = Math.sin(angle) * radius

            let t = new shapes.Text(
                "decreasing prestige",
                x,
                y,
                this.nodeTextFontSize + 'px',
                'center',
                'black',
                40 * (Math.PI / 180),
            )
            t.textAlign = 'center'

            viz.textsToDraw.push(t)
        }

        this.canvas.redraw()

        let context = this.canvas.context
        if (step.arc) {
            let radius = viz.objectSettings.radius.outside + viz.objectSettings.radius.pad * .5

            let lineWidth = context.lineWidth

            context.moveTo(Math.cos(step.arc.startAngle) * radius, Math.sin(step.arc.startAngle) * radius)

            context.color = 'black'
            context.arc(0, 0, radius, step.arc.startAngle, step.arc.endAngle)
            context.stroke()

            let x = Math.cos(step.arc.endAngle) * radius
            let y = Math.sin(step.arc.endAngle) * radius

            let otherAngle = -34.9 * (Math.PI / 180)
            let oX = Math.cos(otherAngle) * radius
            let oY = Math.sin(otherAngle) * radius
            let dx = oX - x
            let dy = oY - y
            let angle = Math.atan2(dy, dx);

            let headlen = 10

            const o = Math.PI / 6
            context.moveTo(x, y)
            context.lineTo(x - headlen * Math.cos(angle - o), y - headlen * Math.sin(angle - o))
            context.moveTo(x, y)
            context.lineTo(x - headlen * Math.cos(angle + o), y - headlen * Math.sin(angle + o))
            context.stroke()
        }

        this.addButtons(textYEnd)
    }

    addButtons(yStart) {
        let yMargin = 2
        let yPad = 5
        let height = this.stepFontSize + 2 * yMargin
        let width = 75
        let quitWidth = 60

        let spaceBetween = 5
        let halfSpaceBetween = spaceBetween / 2

        this.buttons = [
            {
                'text': 'exit tutorial',
                'x1': - (quitWidth / 2),
                'x2': quitWidth / 2,
                'width': quitWidth,
                'y1': yStart + height + yPad,
                'y2': yStart + height + yPad + height,
                'height': height,
                'onclick': _ => this.quit(),
                'isMouseOver': false,
            }
        ]

        if (this.stepNumber === 0) {
            this.buttons.push({
                'text': 'next step',
                'x1': - (width / 2),
                'x2': width / 2,
                'width': width,
                'y1': yStart,
                'y2': yStart + height,
                'height': height,
                'onclick': _ => this.progress(),
                'isMouseOver': false,
            })
        }
        else if (this.stepNumber === this.steps.length - 1) {
            this.buttons.push({
                'text': 'previous step',
                'x1': - (width / 2),
                'x2': width / 2,
                'width': width,
                'y1': yStart,
                'y2': yStart + height,
                'height': height,
                'onclick': _ => this.regress(),
                'isMouseOver': false,
            })
        }
        else {
            this.buttons.push({
                'text': 'previous step',
                'x1': 0 - halfSpaceBetween - width,
                'x2': 0 - halfSpaceBetween,
                'width': width,
                'y1': yStart,
                'y2': yStart + height,
                'height': height,
                'onclick': _ => this.regress(),
                'isMouseOver': false,
            })

            this.buttons.push({
                'text': 'next step',
                'x1': halfSpaceBetween,
                'x2': halfSpaceBetween + width,
                'width': width,
                'y1': yStart,
                'y2': yStart + height,
                'height': height,
                'onclick': _ => this.progress(),
                'isMouseOver': false,
            })
        }

        this.buttons.forEach(button => this.drawButton(button))
    }

    drawButton(button, clear) {
        let color = button.isMouseOver === true ? this.linkColor : this.gray

        if (clear === true) {
            color = 'white'
        }

        let rectangle = new shapes.Rectangle(
            button.x1,
            button.y1,
            button.width,
            button.height,
            1,
            'white',
            color,
        )

        rectangle.setCanvasContextProperties(this.canvas.context)
        rectangle.write(this.canvas.context)
        this.canvas.context.lineWidth = this.canvas.context.lineWidth * 1.5
        this.canvas.context.stroke(rectangle.path)
        this.canvas.context.fill(rectangle.path)

        let text = new shapes.Text(
            button.text,
            (button.x1 + button.x2) / 2,
            (button.y1 + button.y2) / 2,
            this.nodeTextFontSize + "px",
            'center',
            this.linkColor,
        )

        text.textAlign = 'center'
        text.setCanvasContextProperties(this.canvas.context)
        text.write(this.canvas.context)
    }

    setButtonStates() {
        this.buttons.forEach(button => {
            this.drawButton(button, true)

            let mouseX = this.canvas.mouseState.x
            let mouseY = this.canvas.mouseState.y

            button.isMouseOver = (
                (button.x1 <= mouseX)
                &&
                (mouseX <= button.x2)
                &&
                (button.y1 <= mouseY)
                &&
                (mouseY <= button.y2)
            )
            
            this.drawButton(button)
        })
    }
}
