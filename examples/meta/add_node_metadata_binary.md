---
nav_order: 6
name: add node metadata: binary

---

webweb'll display a metadata attribute as binary if every node's value for that attribute is either `True` or `False`.

`True` values will be "big" and `False` values small, but if we want the opposite, we can do the following:

```web.display.invertBinarySizes = True```
