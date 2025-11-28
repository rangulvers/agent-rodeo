# Lego City 3D Builder

A simple 3D Lego-style city builder that runs fully in the browser with no build step. Place houses, roads, trees, and water on a grid; erase to remove. Live rule checks guide your layout.

## How to run
- Open `index.html` in a modern desktop browser (Chrome, Edge, Safari, Firefox).
- First load requires internet for Three.js from CDN; afterwards, the page still opens offline from your clone.

## Usage
- Select a block type from the left toolbar (or use hotkeys H, R, T, W, E).
- Left-click a tile to place the selected block. Choosing "Erase" removes the tile.
- Camera: right-drag (or Alt/Option + drag) to orbit, middle-drag to pan, scroll to zoom. Use "Reset Camera" to reset view.
- Toggle wireframe to inspect shapes.

### City rules (live)
- Every house must be directly adjacent to a road (up/down/left/right). Violations are shown.
- Trees must not touch water (no direct up/down/left/right adjacency). Placement on water is prevented.
- Warning if water covers more than 25% of tiles.
- Warning if no roads exist yet.

### Save & Load
- Click "Save" to store the layout in `localStorage` under the key `lego-city-grid-v1`.
- Click "Load" to restore.
- You can also Export to JSON (copies to the textarea and clipboard) and Import from JSON by pasting into the textarea and clicking Import.

## Assumptions
- Deterministic behavior; no randomness used.
- Basic models use simple primitives for speed and clarity.
- Grid size is fixed to 16x16 for performance and simplicity.

## Limitations
- No pathfinding; house-road rule checks only direct adjacency.
- Single save slot via localStorage.
