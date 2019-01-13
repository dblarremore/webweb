---
nav_order: 4
name: display from weighted adjacency matrix

---

if both edges between two nodes are non-zero in the adjacency matrix, the first edge's weight is used (webweb traverses adjacency matrixes row-wise). 

In other words, if you give webweb an adjacency matrix where `matrix[0][1] = .1` and `matrix[1][0] = 1`, it'll make an edge between nodes `0` and `1` with a weight `.1`, and not `1`, or `1.1`
