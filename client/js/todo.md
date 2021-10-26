# Performance:
> - don't initialize attributes
> - don't initialize layers
- require cursor to pause before evaluating chord diagram overlay

# bugs/outstanding:
> - listener removal (I think)
> - widget removal
- add validators for settings
> - freeze nodes
> - force diagram isn't dealing with undirected
> - fix settings to not be gibberish
>   - single place to define default + complex attributes
> - chord diagram mouseover should use centroids and "if within the circumference, highlight nearest"
> - node hightlighting for force directed
> - fix layer switching
> - global listeners

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
    - edge attributes
    - legend
    - settings:
      - radiuses
      - spacers
    - hover events
      - state edge weights
      - hide other edges when over-overed
      - only highlight edges when nodes
    - reverse is broken (only for some?)
