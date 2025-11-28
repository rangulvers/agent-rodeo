# Lego City 3D Builder

A browser-based 3D city builder where you can place different block types on a grid to create a Lego-style city.

## How to run

1. Open `index.html` in any modern web browser
2. No installation or build process required
3. Works offline after initial CDN library load

## Usage

### Block Placement
- Click on any block type button in the top toolbar (House, Road, Tree, Water, Empty)
- Click on the 3D grid to place the selected block
- Select "Empty" and click to remove blocks

### Camera Controls
- **Left Mouse Click**: Place selected block on grid
- **Right Mouse Drag**: Rotate camera around the city
- **Mouse Wheel**: Zoom in/out

### Block Types
- 🏠 **House**: Red tall blocks representing residential buildings
- 🛣️ **Road**: Gray flat blocks for pathways
- 🌳 **Tree**: Green cone-shaped blocks for parks
- 💧 **Water**: Blue flat blocks for lakes/rivers
- ❌ **Empty**: Remove blocks from the grid

### City Rules
The rules panel automatically checks your city layout:
- **Houses must connect to roads**: Each house should have at least one adjacent road
- **Water limit**: Water blocks should not exceed 30% of total blocks
- **Trees cannot be on water**: Trees and water cannot occupy the same position

Rules update live as you place or remove blocks.

### Save & Load
- **Save City**: Saves current city to browser localStorage and displays JSON in textarea
- **Load City**: Loads city from JSON in textarea (or falls back to localStorage if textarea is empty)
- Copy/paste JSON between textarea and external files for sharing

Data works offline and can be shared via JSON copy/paste.

## Assumptions

- Grid size is fixed at 15x15 units
- Only one block can occupy a grid position at a time
- "Connected to road" means orthogonally adjacent (not diagonal)
- Save/load uses browser localStorage (works offline)
- Camera rotation is centered at origin (0,0,0)

## Limitations

- No undo/redo functionality
- No multi-select or copy/paste
- Camera cannot pan horizontally (only rotate and zoom)
- Rules are visual warnings only (no enforcement)
- localStorage is limited to single browser/device
