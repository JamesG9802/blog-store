import matplotlib.pyplot as plt
import numpy as np

def generate_hex_grid(rows, cols, size):
    """Generate the centers of a hexagonal grid."""
    centers = []
    for row in range(rows):
        for col in range(cols):
            x = col * 1.5 * size  # Horizontal spacing between hexagons
            y = row * np.sqrt(3) * size  # Vertical spacing
            if col % 2 == 1:
                y += np.sqrt(3) * size / 2  # Offset for odd columns
            centers.append((x, y))
    return centers

def find_adjacent_centers(centers, size):
    """Find pairs of adjacent centers in the hexagonal grid."""
    adjacency = []
    for i, (x1, y1) in enumerate(centers):
        for j, (x2, y2) in enumerate(centers):
            if i != j:
                # Check if two centers are within the distance of one hex side
                distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                if np.isclose(distance, np.sqrt(3) * size):
                    adjacency.append(((x1, y1), (x2, y2)))
    return adjacency

def plot_center_points_and_lines(centers, adjacency):
    """Plot only the red center points and green lines connecting them."""
    fig, ax = plt.subplots(figsize=(10, 10))
    
    # Plot lines between adjacent hexagon centers
    for (x1, y1), (x2, y2) in adjacency:
        ax.plot([x1, x2], [y1, y2], color='green', linewidth=0.8)
    
    # Plot center points
    for center in centers:
        ax.plot(center[0], center[1], 'ro')  # Red center point
    
    ax.set_aspect('equal')
    ax.set_axis_off()
    plt.show()

# Parameters
rows = 7  # Number of rows
cols = 7  # Number of columns
hex_size = 1  # Size of the hexagon (distance from center to vertex)

# Generate hexagonal grid and adjacency list
hex_centers = generate_hex_grid(rows, cols, hex_size)
adjacency = find_adjacent_centers(hex_centers, hex_size)

# Plot centers and connections
plot_center_points_and_lines(hex_centers, adjacency)
