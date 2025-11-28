# Lego City 3D Builder

A browser-based 3D city builder inspired by Lego. Built with vanilla JavaScript and Three.js.

## How to Run
1.  Clone the repository.
2.  Open `index.html` in your web browser.
3.  No build steps or server required.

## Usage

### Controls
*   **Left Click**: Place the selected block on the grid.
*   **Right Click + Drag**: Pan the camera.
*   **Left Click + Drag**: Rotate the camera.
*   **Scroll**: Zoom in/out.

### Tools
Select a tool from the sidebar:
*   **🏠 House**: Places a red house with a roof.
*   **🛣️ Road**: Places a gray road tile.
*   **🌳 Tree**: Places a tree.
*   **💧 Water**: Places a water tile.
*   **❌ Empty**: Removes the block at the clicked position.

### City Rules
The panel on the left shows the status of your city planning:
1.  **Houses connected to road**: Every house must be adjacent to at least one road tile.
2.  **Trees not on water**: Trees cannot be placed adjacent to water tiles (to prevent root rot!).
3.  **Water level safe**: Water tiles must not exceed 40% of the total city area.
4.  **No roads built yet**: Warns if you have built houses but no roads.

### Save & Load
*   **Save**: Click "Save to JSON" to generate a text representation of your city in the text area. Copy this text to save it externally.
*   **Load**: Paste a valid JSON string into the text area and click "Load from JSON" to restore your city.

## Assumptions & Implementation Details
*   The grid is fixed at 20x20 size.
*   Blocks are placed on a single layer (ground level).
*   "Trees not on water" is interpreted as "Trees cannot be adjacent to water" for this single-layer implementation.
*   Uses Three.js (via CDN) for 3D rendering.
*   Uses OrbitControls for camera interaction.

## Limitations
*   No multi-story buildings.
*   Simple block geometries.
*   No complex road auto-tiling (roads are simple squares).
