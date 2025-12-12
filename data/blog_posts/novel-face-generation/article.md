---
title: "A Novel Approach to Tiling Grids with Planar Graphs"
date: "2025-01-25"
tags: ["Algorithm", "Research"]
summary: "An overview into an efficient way to tile 2D surfaces in a constrained manner."
---

# Introduction

From chess to Sid Meier's Civilization, there are countless games that use squares, hexagons, and triangles (okay maybe not triangles) to build their game grid. And for good reason too—they are the only regular polygons that can be seamlessly tiled to form a [tesselation](https://www.mathsisfun.com/geometry/tessellation.html).

| ![alt text](images/asset1.png) |
|:--:|
| *From [baharna](https://baharna.com/polymad/intro/proem.htm).* |

It makes it very easy to work with this type of grid as you can represent each tile as an index into a 2D array. Navigating through the different tiles can be done in nice straight lines and there are nice symmetries everywhere. There is a clear reason why most grids are either squares or hexagons.

But what if we wanted something more...*interesting*? Something with more unique shapes? The most recent game I can think of that uses a non-regular grid is [Frostpunk 2](https://11bitstudios.com/games/frostpunk-2/) where it mixes hexagons, pentagons, septagons, and even octagons, likely in an attempt to break up player expectations and force them to adapt to the situation. 

As far as I am aware the developers haven't talked about how they made their maps, but I find it likely that they used a [Voronoi diagram](https://builtin.com/data-science/voronoi-diagram) to generate their tiles. It is commonly used for making organic looking tiles and has broader applications besides making grids. This technique works by placing random points on a plane and then mapping the region closest to them. 

| ![alt text](images/asset2.gif) |
|:--:|
| *From [Wikipedia](https://en.wikipedia.org/wiki/Voronoi_diagram#).* |

The tiles can be unevenly sized, so a post-processing step can be done to repeatedly reapply voronoi's algorithm on the cells' centroid, or geometric center.

| ![alt text](images/asset3.gif) |
|:--:|
| *From [Towards Data Science](https://towardsdatascience.com/the-fascinating-world-of-voronoi-diagrams-da8fc700fa1b).* |

If you want a natural-looking grid, you can stop right here and call it a day. But if you want something more structured, you may notice there are several downsides with this approach. 

1. You don't have fine control over where tiles are placed in the grid (they are randomly placed after all) and what tiles they are adjacent to. 
2. It's not trivial to store these tiles in a tidy 2D array as there are no straight columns and rows. 
3. The process of creating the tiles can be computationally expensive to get good results and takes [O(*n*&nbsp;log&nbsp;*n*)](https://en.wikipedia.org/wiki/Fortune%27s_algorithm) time to create a voronoi diagram.

The following is my journey at attempting to making a more structured tiling algorithm, hereafter just referred to as Face Generation Algorithm (FGA), that runs in linear O(*n*) time for hexagonal grids with the key benefit of **being able to specify the adjacencies for every single tile**. With some work, it could be adapted for more exotic tilings.

[Click here if you want to skip to the algorithm](#Face Generation Algorithm),  

# Background Experiments

> Note: to be frank, I didn't actually know about voronoi diagrams and all the related literature until I began writing this blog post. Most of my discoveries have been done through experimentations with different strategies, although the results are affirmed by existing literature. 

## Initial Steps

Since I wanted to work with up to six-sided polygons, I first began reading up on hexagons from the nice [blog post from redblobgames](https://www.redblobgames.com/grids/hexagons/). They detailed several ways for laying out a grid in memory, so I arbitrarily chose the version where every even column is shifted down slightly.

| ![alt text](images/asset4.png) |
|:--:|
| *From [redblobgames](https://www.redblobgames.com/grids/hexagons/).* |

My plan so far was for the user to be able to select the adjacencies of each tile, following some obvious rules:

1. Each tile needs to have at least three neighbors, because polygons have at least three sides.
2. If a tile *A* is adjacent to a tile *B*, then tile *B* is adjacent to tile *A*.

With that said, I began playing around with different ideas to try and generate a valid polygon.

## First Attempt
To make a seamless grid of tiles with no gaps, each tile needs to share vertices with its neighbors. My first such attempt, then, was based on the idea that a hexagon had at most six neighbors. 

Imagine a point at the center of each hexagon. Then for each of its adjacent neighbors, you draw a line through them to form a polygon. 

| ![Hexagon grid](images/asset5.gif) |
|:--:|

You repeat this for every tile until you have a series of overlapping lines. Finding the vertices of a tile's polygon, then, was supposed to be as simple as placing the vertex at the center of all intersecting line segments. This was supposed to make it so that adjacent tiles would also be able to calculate the exact same vertex as well.

| ![alt text](images/asset6.gif) |
|:--:|

The problem with this approach—besides the large number of intersections that need to be calculated—was the assumption that each tile was dependent only on its six nearest neighbors. It would turn out that assumption was very wrong.

Let's look at an example. Because this grid is supposed to handle tiles with three to six adjacencies, it should be able to generate a triangular grid. The following is a simple colored-in example.

| ![alt text](images/asset7.png) |
|:--:|

When transcribed to a hex grid, it would look like this:

| ![alt text](images/asset8.png) |
|:--:|

However, note the pink dot. Despite assuming a tile in a hexagon grid only needs to care about its connections with its neighbors, there are clearly other tiles that can share the same vertex; six different tiles need to be checked for the triangle to create a vertex. It turns out that in order to generate a vertex, you need to examine **every single** connection in the graph. This will be shown in the next approach.

## Second Attempt
My next (and thankfully final) approach was to do away with drawing a line through a tile's neighbors. Instead, you simply draw a line from a tile *to* its neighbors.

This results in this graph structure for a hexagonal grid.
| ![alt text](images/asset9.png) |
|:--:|

You may notice something interesting about this image. There is a polygon formed from the connections of all the green lines (the adjacencies between each tile). In the center of each of these polygons formed is actually a vertex of a hexagon. This forms the basis of this tiling algorithm: by finding the center of each of these polygons, you can turn those centers into the vertices for the tiles. An example of how this would work is shown below for a hexagonal grid: 

| ![alt text](images/asset10.gif) |
|:--:|

For each edge a tile is connected to, there is an associated polygon and centroid/vertex. Each of those vertices can be joined together to form the final polygon.

All the images shown so far are recreations from my own notes when working on the algorithm. These following grids are generated and rendered in [Unity 6](https://unity.com/) showcasing an actual implementation.


| ![alt text](images/asset12.png) |
|:--:|
| A hexagonal grid. |

| ![alt text](images/asset13.png) |
|:--:|
| A quadrilateral grid. |

| ![alt text](images/asset11.png) |
|:--:|
| A triangular grid. |

The results look pretty strange for the square and triangular grids since the coordinate system was for hexagons. In fact, with the intended center of the hexagon's shown, we can see that the tiles' are pretty unevenly sized.

| ![alt text](images/asset16.png) |
|:--:|

I experimented with several ways to improve the tiles from trying to push vertices to their polygon's optimal angle, moving based on the centroid, repeatedly applying the algorithm, etc.

In the end, the best result was to define a minimum radius from the intended center and push the vertices away. Then the center of the tile would be recalculated. This is done over a few iterations to smoothly transition the vertices until the movement becomes minimal.

| ![alt text](images/asset17.gif) |
|:--:|

# Face Generation Algorithm
The crux of the Face Generation Algorithm relies on the fact that the grid of tiles can be represented as a [planar graph](https://cp-algorithms.com/geometry/planar.html). A planar graph is special because it has the property that edges do not intersect except at nodes. Thanks to this fun fact, we can calculate the polygon around each tile in O(*n*) linear time.

| ![alt text](images/asset19.png) |
|:--:|
| *From [Transport Geometry](https://transportgeography.org/contents/methods/graph-theory-definition-properties/planar-non-planar-graph/).* |

This is because we only need to traverse each edge exactly once; you iteratively go through each node and select each edge you haven't explored yet. Then you follow the edges in a clockwise (or counter-clockwise if you prefer) order until you return back to the node. The nodes you traversed through form a region in the graph.

This lets us calculate the "regions", or faces if using planar graph terminology, that a tile is a part of. Each tile can form a polygon where each vertex is the centroid of each region.

| ![alt text](images/asset21.gif) |
|:--:|

Every edge in a planar graph is part of a face. There are two types of faces: **inner** face and a single **outer** face. The outer face is the unbounded surface around the entire graph. In order to ensure each tile in the grid has edges that are part of bounded inner faces, you can just add tiles at the border of the graph. We'll refer to the original tiles as the "inner tiles" and the border tiles as the "outer" tiles.

With all this, we can guarantee that this algorithm always forms a seamless tessellation (provided you haven't created impossible polygons, such as tiles with less than 3 neighbors).

## Proofs
Assumptions:
- Each node has three or more neighbors.
- If node A is adjacent to node B, node B is adjacent to node A.
- There is a 1-tile border around the inner nodes.
- The inner grid is connected (or else you will end up with holes in the grid). 


**A grid of tiles where each tile can be adjacent to only its hexagonal neighbors is a planar graph.**
- Take the simplest hexagonal grid, which can be seen as planar.

| ![alt text](images/asset20.png) |
|:--:|

- If you add a tile anywhere to the grid and connect it with its neighbors, its edges won't intersect with the existing ones.
- Because a hexagonal grid is a periodic tiling, each tile has the exact same neighbor relations as this simplest hexagonal grid.
- Therefore, any sized hexagonal grid is planar.
- Removing adjacencies will not cause edges to intersect.
- Therefore, any-sized hexagonal grid with less adjacencies will also be planar.

**You can calculate a polygon for each inner tile.**
- Each inner tile has at least three neighbors.
- Each inner tile has an edge to its neighbors.
- Each edge is part of a distinct face.
- A vertex of the tile's polygon is generated from the centroid of each of these faces.
- Each tile will have at least three vertices.
- Therefore, a tile will be able to generate a polygon formed by connecting its vertices.

**If an inner tile A is adjacent to inner tile B, then both A and B will share the same vertex.**
- If A is adjacent to B, then there is an edge AB.
- When finding the face of a planar graph, edges are traversed in a clockwise order.
    - Each edge is traversed exactly once.
    - The edges in a face will each generate the same vertex.
    - The edges will eventually return to the starting node through the next clockwise edge.
- Therefore, A and B will generate the same vertex.

- <details><summary>More details</summary>
    <ul>
        <li>This was a summary of the overall proof.
        In actuality, if tile A and tile B are adjacent, they actually will share two vertices.
        This is because an edge AB is not the same as the edge BA.
        </li>
    </ul>
</details>

**Face Generation Algorithm produces a tessellation.**
- If every tile shares a vertex with its adjacent neighbors, then there is no gap between tiles.
- Therefore, Face Generation Algorithm produces a tessellation. 

## Time Complexity

### Creating a Grid
1. Create a [(width + 2), (height + 2)] 2D array of tiles to make room for the outer border of tiles.
2. Set the adjacencies of each of the tiles, taking O(*1*) time for n tiles, resulting in O(*n*) time.

### FGA
1. Create a hash table mapping edges to centroids.
2. Iterate through every single edge following the [planar face algorithm](https://cp-algorithms.com/geometry/planar.html#the-algorithm) to generate a centroid for each face. Since each node has up to six neighbors, there is at most 6\*n edges to process, taking O(*n*) time.
3. Generating a vertex for each tile then requires iterating through each tile and looking up the associated centroid, taking O(*1*) for n tiles for O(*n*) time.

The total time complexity will be O(*n*).

### Post-processing step
1. Iterate through every node's edges. 
2. If the distance is too close, the edge is moved back a small amount. This looks at most 6\*n edges, taking O(*n*) time.

# Relation to Existing Algorithms
It is my opinion that the Face Generation Algorithm is essentially a variant on voronoi diagrams due to the fact that voronoi diagrams are a dual graph of [Delaunay triangulations](https://towardsdatascience.com/the-fascinating-world-of-voronoi-diagrams-da8fc700fa1b#3b2c). Since Delaunay triangulations are also planar graphs, FGA can be seen as a controlled method of creating a voronoi diagram. 

While this version of FGA was proposed for hexagonal grids (since every tile can have up to six neighbors), you can likely use any tiling that forms a planar graph. 

# Conclusion
The Face Generation Algorithm is a viable alternative for creating grids when there is a need to specify the adjacencies of tiles. It runs in linear time complexity and can create decent tiles with a post-processing step that also runs in linear time. 

# Sources
1. [Tessellation](Tessellation)
2. [Polygon Madness](https://baharna.com/polymad/intro/proem.htm)
3. [Frostpunk 2](https://11bitstudios.com/games/frostpunk-2/)
4. [The Fascinating World of Voronoi Diagrams](https://builtin.com/data-science/voronoi-diagram)
5. [Voronoi Diagram](https://en.wikipedia.org/wiki/Voronoi_diagram#)
6. [The fascinating world of Voronoi diagrams](https://towardsdatascience.com/the-fascinating-world-of-voronoi-diagrams-da8fc700fa1b)
7. [Fortune's Algorithm](https://en.wikipedia.org/wiki/Fortune%27s_algorithm)
8. [Hexagon Grids](https://www.redblobgames.com/grids/hexagons/)
9. [Unity 6](https://unity.com/)
10. [Finding faces of a planar graph](https://cp-algorithms.com/geometry/planar.html)
11. [Planar and Non-Planar Graphs](https://transportgeography.org/contents/methods/graph-theory-definition-properties/planar-non-planar-graph/)
