import * as shapes from './shapes'

export class Tutorial {
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
                    "each arc segment is",
                    "a university in the field",
                ],
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
                    "the size of a university's arc segment",
                    "is proportional to the number of",
                    "in-field faculty it produced",
                ],
            },
            {
                'edges': [],
                'nodeLabels': [
                    {
                        'index': 0,
                        'text': 'high prestige',
                    },
                    {
                        'index': -1,
                        'text': 'low prestige',
                    },
                ],
                'text': [
                    "universities are arranged around the circle",
                    "in clockwise order by prestige,",
                    "from most prestigious to least",
                ],
            },
            {
                'edges': [
                    {
                        "source": 0,
                        "target": 2,
                    },
                    {
                        "source": "Wisconsin-Madison (U of)",
                        "target": "Pittsburgh (U of)",
                    },
                ],
                'nodeLabels': [],
                'text': [
                    "universities are connected by an edge",
                    "when at least one of the two employs",
                    "the other's graduates",
                ],
            },
            {
                'edges': [
                    {
                        "source": 0,
                        "target": 2,
                    },
                    {
                        "source": 4,
                        "target": 3,
                    },
                ],
                'nodeLabels': [],
                'text': [
                    "edge colors show whether or not",
                    "the faculty exchanged by the universities",
                    "followed the prestige hierarchy",
                ],
            },
            {
                'edges': [
                    {
                        "source": 0,
                        "target": 2,
                    },
                ],
                'nodeLabels': [],
                'text': [
                    "a blue edge means that more faculty",
                    "moved down (graduated from the higher",
                    "prestige university and were then hired by",
                    "the lower prestige one) than moved up",
                    "(graduated from the lower prestige",
                    "university and were then hired by the higher",
                    "prestige one)",
                ],
            },
            {
                'edges': [
                    {
                        "source": 4,
                        "target": 3,
                    },
                ],
                'nodeLabels': [],
                'text': [
                    "a red edge means that more faculty",
                    "moved up (graduated from the lower",
                    "prestige university and were then hired by",
                    "the higher prestige one) than moved down",
                    "(graduated from the higher prestige",
                    "university and were then hired by the lower",
                    "prestige one)",
                ],
            },
        ]
    }

    constructor(webweb) {
        this.webweb = webweb
        this.stepNumber = 6

        this.displayStep()

        // TODO: set network to tutorial network
        this.webweb.controller.canvas.listen = false
    }

    hasNextStep() { return this.stepNumber + 1 < this.steps.length }
    hasPrevStep() { return this.stepNumber - 1 >= 0 }

    get nextStep() {
        return this.stepNumber + 1
    }

    quit() {
        // TODO: reset network
        this.webweb.controller.canvas.listen = true
        let viz = this.webweb.network.visualization
        viz.controller.canvas.resetObjectsToDraw()
        viz.listen = true
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

    removeCanvasListeners() {
        Object.entries(this.webweb.canvas.canvases).forEach(([canvasKey, canvas]) => {
            this.webweb.controller.canvas.removeListeners(canvas)
        })
    }


    displayStep() {
        const step = this.steps[this.stepNumber]

        let viz = this.webweb.network.visualization
        viz.controller.canvas.resetObjectsToDraw()
        viz.listen = false

        viz.setNodesToDraw()
        viz.setEdgesToDraw()

        viz.setTexts()
        viz.legendTexts = []
        viz.legendNodes = []

        let texts = []
        step.nodeLabels.forEach(nodeLabel => {
            let index = nodeLabel.index

            if (index < 0) {
                index = viz.texts.length + index
            }

            let text = viz.texts[viz.reverseNodeSortMap[index]]
            text.value = nodeLabel.text
            texts.push(text)
        })
        viz.texts = texts

        viz.focalNode = undefined
        viz.focalEdge = undefined
        viz.exteriorAnnotationLabels = []

        viz.updateFocusedElements()

        for (let [i, chord] of Object.entries(viz.chords)) {

            const source = viz.reverseNodeSortMap[chord.source.index]
            const target = viz.reverseNodeSortMap[chord.target.index]

            let hide = true
            step.edges.forEach(edge => {
                if ((viz.reverseNodeSortMap[edge.source] === source) && (viz.reverseNodeSortMap[edge.target] === target)) {
                    hide = false
                }
            })

            if (hide) {
                viz.edgesToDraw[i].opacity = 0
            }
        }

        let height = 14
        let totalHeight = height * step.text.length
        let y = 0 - (totalHeight / 2)

        step.text.forEach(text => {
            let t = new shapes.Text(
                text,
                0,
                y,
                height + 'px',
                'center',
                'black',
                0,
            )

            t.textAlign = 'center'

            viz.textsToDraw.push(t)

            y += height
        })

        viz.controller.canvas.redraw()
    }
}
