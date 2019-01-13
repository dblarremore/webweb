---
nav_order: 4
name: display from weighted adjacency matrix

---

if both edges between two nodes are non-zero in the adjacency matrix, the first edge's weight is used (webweb traverses adjacency matrixes row-wise). i.e., if webweb's given adjacency matrix where ```matrix[0][1] = .1``` and ```matrix[1][0] = 1```, it'll make an edge between nodes 0 and 1 with a weight .1 -- NOT 1, or 1.1
