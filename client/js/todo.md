# Bugs:
- fix layer switching
- listener removal
- chord diagram mouseover should use centroids and "if within the circumference, highlight nearest"

# Performance:
- don't initialize attributes
- don't initialize layers

# outstanding unfixed:
- force diagram isn't dealing with undirected
- chord diagram should double down on chords, so that D3 does directed stuff :(
- fix settings to not be gibberish
  - single place to define default + complex attributes

# Features:
- text:
  - parameters:
    - defaultFontSize; default 12
    - nodeNameFontSize; default undefined
    - legendTitleFontSize; default undefined
    - legendContentFontSize; default undefined
    - edgeWeightFontSize; default undefined
      - If any of nodeNameFontSize, legendTitleFontSize, legendContentFontSize, or edgeWeightFontSize is undefined, then defaultFontSize will apply.
- settings:
  - naming layer types
  - naming layers
  - naming network types
- visualizations:
  - settings:
    - node size
    - spacers
    - degree
  - hover events
    - state edge weights
