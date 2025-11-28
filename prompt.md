You are an AI coding agent. Your task is to build a **3D Lego-style city builder** that runs entirely in the browser. The user should be able to place different block types on a 3D grid and create a simple city layout.

Your solution must use **only HTML, CSS, JavaScript, and external CDN libraries** (if needed). No build step. Must run offline after cloning the repository.

## Goal 
Build a **3D Lego-style city builder** that runs entirely in the browser. The user should be able to place different block types on a 3D grid and create a simple city layout.


## RULES Read the RULES.MD file carefully to understand the requirements and constraints for this project.
---

## Core Requirements

### 1. 3D Environment
- Display a **3D grid** the user can build on.
- A visible camera setup is required.
- The user must be able to rotate and pan the view.

### 2. Block Types
Must include **at least**:
- House
- Road
- Tree / Park
- Water
- Empty (erase)

Each block must have a 3D representation (color or simple model).

### 3. Interaction
- User selects a block type from a toolbar.
- Clicking on the grid places that block in 3D space.
- Selecting “Empty” should remove blocks.
- Immediate result—no extra apply button.

### 4. City Rules Panel
Implement **at least two rule checks**. Example rules:
- Every house must be connected to a road.
- Trees must not be placed on water.
- Warn if too many blocks are water.
- Warn if no roads exist.

The rules **must update live** when the scene changes.

### 5. Save & Load
- Must work offline.
- Either localStorage OR copy/paste JSON.
- Instructions must be shown in the UI (e.g., `README.md`).

---

## Tech Rules

- Must run just by opening `index.html`.
- No build step.
- Only CDN libraries allowed (e.g. Three.js).
- Must work offline after initial load.

---

## Output Format

Your output must include exactly:
1. `index.html`
2. `styles.css`
3. `main.js`
4. `README.md`
5. `PROMPT_USED.md`

The app must work by double-clicking `index.html`. No server required.

Do not explain your reasoning. Do not include meta text. Just output the files needed.
