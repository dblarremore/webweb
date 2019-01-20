---
name: freezeNodeMovement
type: boolean
default: false

---

If `true`, fixes nodes wherever they are. Drag & drop still works. This is probably not a good idea to set unless we're passing node coordinates as metadata attributes (it'll leave all the nodes at the top left corner of the visualization).
