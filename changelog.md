## 20200000 - 0.0.39

- multiple visualization types.
  - Chord Diagram.
- webweb tries to align text intelligently (away from the center of the visualization)
- performance improvements:
  - initialization of networks, layers, and attributes is on demand
  - canvas performance significantly improved

## 20191207 - 0.0.38

- save as png
- highlight multiple node names by comma separating them
- added a `webweb` commandline tool. give it a file name and it'll try to open it up.
- attempts to remember last state for networks
- if a node has a `url` attribute, clicking it will open the link
- add a `color` attribute to all nodes ('#11aa22' format) to define your own color scheme
- unit tested (somewhat)

new parameters:
- `scales`: you can now supply a `min`/`max` value for how nodes will be scaled. The scales you can customize are: `nodeSize`; `scalarColors`; `linkWidth`; `linkOpacity`

## 20190607 - 0.0.37

- improved docstring [(issue)](https://github.com/dblarremore/webweb/issues/47)
- changed import of `pygmlion` from relative to absolute so documentation can be properly generated
- added hash to webweb file names so multiple can be shown at once [(issue)](https://github.com/dblarremore/webweb/issues/50).
- fix link width scaling. (oops.)
- add `__authors__` and `__version__` to the package

## 20190607 - 0.0.36

- fixed bug introduced in `0.0.33` on linux where files won't pop up

## 20190607 - 0.0.35

- put `Show node names` widget above of `Highlight nodes named` widget

## 20190606 - 0.0.34

- fixed bug where links opacity and width were scaled without taking into account repeated edges. [issue](https://github.com/dblarremore/webweb/issues/43)
- fixed loading of development client resources (non-user facing issue)

## 20190605 - 0.0.33

- automated testing for python
- node names will be displayed at a slightly higher simulation temperature

## 20190526 - 0.0.32

- added `display.showLegend` which defaults to = `True`. If `True`, will draw the legend.

## 20190206 - canvas!

- webweb now renders with canvas! It’s faster and able to support larger networks.
- Legends are labeled with what they make legendary.

## 20190130 - 0.0.5

- Documentation is live!
- webweb is on pip!
- matlab is completely rewritten!
- webweb visualizations have no dependencies
- drag&drop and json saving removed
- all node names can be shown
- interactive menus can be hidden
- binary colors and sizes can be inverted
- nodes can be strings (python)
- webweb is responsive (mostly)

## 20181125 - 0.0.4

Merged fork from Hunter Wapman

- supports multi-layer networks
- all display parameters can be set
- saveable json
- color palette can be changed

## 20180123 - 0.0.3.4

Merged a fork from Michael Iuzzolino

- SVG saving
- drag and drop file loading
- standard file loading.

## 20150522 - 0.0.3.3

- pause/play node movement

## 20140516 - 0.0.3.2

- link opacity defaults to checked
- charge selection bugfix
- link strength can be changed
- webweb now runs on Windows

## 20131222 - 0.0.3.1

- accepts a single sparse matrix as input

## 20131010 - webweb is featured in a publication!

in [PLoS Computational Biology](http://www.ploscompbiol.org/article/info:doi/10.1371/journal.pcbi.1003268), along with [interactive versions of all published figures](http://danlarremore.com/var).

## 20130826 - 0.0.3

a new and improved version of webweb!

## 2013087 - 0.0.3

a new and improved version of webweb!
