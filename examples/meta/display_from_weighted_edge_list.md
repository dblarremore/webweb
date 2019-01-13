---
nav_order: 3
name: display from weighted edge list

---

if there are multiple edges between two nodes, the first edge's weight is used.

In other words, if you give webweb an edge list like `[[0, 1, .1], [0, 1, 1]]`, it'll make an edge between nodes `0` and `1` with a weight `.1`, not `1`, or `1.1` (this would also be the case for the edge list `[[0, 1, .1], [1, 0, 1]]`)
