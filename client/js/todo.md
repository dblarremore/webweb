# Performance:
> - don't initialize attributes
> - don't initialize layers

# bugs/outstanding:
- node hightlighting for force directed
- fix layer switching
- listener removal
- widget removal
- global listeners
- add validators for settings
> - freeze nodes
> - force diagram isn't dealing with undirected
> - fix settings to not be gibberish
>   - single place to define default + complex attributes
> - chord diagram mouseover should use centroids and "if within the circumference, highlight nearest"

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
  - chord diagram:
    - legend
    - settings:
      - radiuses
      - spacers
    - hover events
      - state edge weights
