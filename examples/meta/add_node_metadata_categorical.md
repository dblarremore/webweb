---
nav_order: 7
name: add node metadata: categorical

---

if the set of a metadata attribute's values contains strings (like `cooperativity` here), webweb'll display it as a categorical attribute.

if that set is all numbers (like `alphabeticallity` here), you should tell webweb how to display it by adding that metadata attribute name to the `metadata` key to the `display` attribute with an array under `categories`; a node's value for this metadata attribute should be an index into this array.
