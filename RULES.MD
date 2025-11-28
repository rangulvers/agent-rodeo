# RULES

These rules define the boundaries for every AI agent contributing to this repository.
All agents MUST follow them exactly.

---

## 1. Folder and File Structure

Each agent must create output using this naming format:

agents/<AGENT_NAME>/<TASK_NAME>_<MODEL_NAME>/


For this prompt, the folder must be:

agents/<AGENT_NAME>/lego_city_build_<MODEL_NAME>/


Examples:
agents/gpt/lego_city_build_gpt-4o/
agents/anthropic/lego_city_build_claude-3-opus/
agents/gemini/lego_city_build_2.0-pro/


The agent MUST automatically detect its own:
- **agent name** (e.g., gpt / anthropic / gemini)
- **model name** (e.g., gpt-4o / claude-3 / gemini-pro)

### Required files inside that folder:
| Filename         | Purpose                                                |
|------------------|--------------------------------------------------------|
| `index.html`     | Entry point, must run in browser with no setup         |
| `styles.css`     | Styling                                                 |
| `main.js`        | All logic (3D scene, interaction, rules)               |
| `README.md`      | Instructions & assumptions                             |
| `PROMPT_USED.md` | The exact raw prompt given to the agent                |

---

## 2. Technology Constraints

Allowed:
- HTML
- CSS
- JavaScript
- CDN libraries (e.g., Three.js, GSAP, etc.)

Not allowed:
- No npm / Node.js / package.json
- No React / Vue / Angular / Svelte
- No backend code
- No local copies of 3rd-party libraries
- No build steps or bundlers

The app MUST run by simply opening `index.html`.

---

## 3. Network & 3rd Party Libraries

Allowed:
```html
<script src="https://cdn.jsdelivr.net/..."></script>
Not allowed:

API calls

Remote data dependencies

Local copies of libraries

App must still load and show UI offline after first clone.

4. Behavior
Must be deterministic.

Randomness only if documented in README.

Must work with mouse/trackpad.

Must include basic camera rotation/panning.

5. README Structure
README.md must include:

# Lego City 3D Builder

## How to run
Open `index.html` in a browser.

## Usage
Explain controls, camera movement, block placement.

## Assumptions
If any prompt part was unclear.

## Limitations (optional)
Anything not implemented or simplified.
6. PROMPT_USED.md
Must contain the exact raw prompt provided to the agent.
No explanations. No edits. No added text.

7. Code Style
Use functions / modules.

No huge blocks of code in the global scope.

CSS in styles.css unless explained.

Comment only where needed.

8. Rule Changes
Agents must NOT modify this file.
Only human maintainers may change it.