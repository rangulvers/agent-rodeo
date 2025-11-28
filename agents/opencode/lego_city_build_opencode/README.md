# Lego City 3D Builder

## How to run
Open `index.html` in a browser.

## Usage
- **Camera Controls**: 
  - Left-click + drag to rotate the view
  - Right-click + drag to pan
  - Scroll to zoom in/out

- **Block Placement**:
  - Select a block type from the left toolbar
  - Click on the grid to place the selected block
  - Select "Empty" to remove blocks

- **Block Types**:
  - House (Red blocks)
  - Road (Gray blocks)
  - Tree/Park (Green blocks)
  - Water (Blue blocks)
  - Empty (Eraser tool)

## City Rules
The application enforces several city planning rules:
1. Every house must be connected to a road
2. Trees must not be placed on water
3. Warning if too many blocks are water (more than 30%)
4. Warning if no roads exist but there are other blocks

## Save & Load
- Click "Save City" to generate a JSON representation of your city
- Copy the JSON text and save it to restore your city later
- To load a city, paste the JSON text into the text area and click "Load City"

## Assumptions
- The grid is 20x20 units with a height of 10 units
- All blocks are placed at ground level (height 0)
- Blocks are 1x1x1 units in size
- The implementation uses Three.js for 3D rendering

## Limitations
- No multi-level building support
- Simple rule checking (not spatially aware for connections)
- Basic block types with solid colors only
- No texture mapping or complex models