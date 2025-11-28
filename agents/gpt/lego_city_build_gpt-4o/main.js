/* Lego City 3D Builder - GPT gpt-4o
   No build step. Three.js r128 + OrbitControls via CDN.
*/
(function(){
  const CANVAS = document.getElementById('scene');
  const WRAP = document.getElementById('canvasWrap');
  const overlayMsg = document.getElementById('overlayMsg');

  // Grid config
  const GRID_SIZE = 16; // tiles per side
  const TILE = 1;       // tile world size
  const HALF = GRID_SIZE / 2;

  // Types
  const TYPES = {
    empty: 0,
    house: 1,
    road: 2,
    tree: 3,
    water: 4,
  };
  const TYPE_KEYS = Object.keys(TYPES);

  // Materials (basic colors)
  const mats = {
    grid: new THREE.MeshBasicMaterial({color: 0x2a335a, wireframe: true}),
    house: new THREE.MeshStandardMaterial({color: 0xff6b6b}),
    road: new THREE.MeshStandardMaterial({color: 0x2d3436}),
    roadStripe: new THREE.MeshStandardMaterial({color: 0xdfe6e9, emissive: 0x222222, emissiveIntensity: 0.4}),
    treeTrunk: new THREE.MeshStandardMaterial({color: 0x8e5b3a}),
    treeLeaf: new THREE.MeshStandardMaterial({color: 0x2ecc71}),
    water: new THREE.MeshStandardMaterial({color: 0x3498db, transparent: true, opacity: 0.9}),
    highlight: new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, opacity: 0.7, transparent: true})
  };

  // Scene setup
  const renderer = new THREE.WebGLRenderer({canvas: CANVAS, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(WRAP.clientWidth, WRAP.clientHeight);
  renderer.setClearColor(0x0a0d1a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, WRAP.clientWidth/WRAP.clientHeight, 0.1, 1000);
  camera.position.set(8, 10, 12);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 0, 0);
  // Use right mouse to orbit so left-click is free to place
  if (THREE.MOUSE) {
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.NONE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };
  }
  let isOrbiting = false;
  controls.addEventListener('start', ()=>{ isOrbiting = true; });
  controls.addEventListener('end', ()=>{ isOrbiting = false; });
  // Prevent context menu when right-dragging to orbit
  renderer.domElement.addEventListener('contextmenu', (e)=> e.preventDefault());

  const hemi = new THREE.HemisphereLight(0xbdd1ff, 0x223355, 0.8);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // Ground base
  const groundGeo = new THREE.PlaneGeometry(GRID_SIZE*TILE, GRID_SIZE*TILE, GRID_SIZE, GRID_SIZE);
  const groundMat = new THREE.MeshStandardMaterial({color: 0x0f1428, side: THREE.DoubleSide});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // Grid helper mesh (wireframe)
  const gridGeo = new THREE.PlaneGeometry(GRID_SIZE*TILE, GRID_SIZE*TILE, GRID_SIZE, GRID_SIZE);
  const grid = new THREE.Mesh(gridGeo, mats.grid);
  grid.rotation.x = -Math.PI/2;
  grid.position.y = 0.002;
  scene.add(grid);

  // State: tile map and meshes
  const map = Array.from({length: GRID_SIZE}, ()=>Array(GRID_SIZE).fill(TYPES.empty));
  const tiles = Array.from({length: GRID_SIZE}, ()=>Array(GRID_SIZE).fill(null));

  // Wireframe toggle affects building meshes
  let wireframeMode = false;

  function makeHouse() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), mats.house);
    base.position.y = 0.3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.4, 4), new THREE.MeshStandardMaterial({color: 0xc0392b}));
    roof.rotation.y = Math.PI/4;
    roof.position.y = 0.8;
    group.add(base, roof);
    return group;
  }

  function makeRoad() {
    const g = new THREE.Group();
    const asphalt = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), mats.road);
    asphalt.position.y = 0.05;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.08), mats.roadStripe);
    stripe.position.y = 0.12;
    g.add(asphalt, stripe);
    return g;
  }

  function makeTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8), mats.treeTrunk);
    trunk.position.y = 0.25;
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), mats.treeLeaf);
    foliage.position.y = 0.8;
    g.add(trunk, foliage);
    return g;
  }

  function makeWater() {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), mats.water);
    slab.position.y = 0.06;
    g.add(slab);
    return g;
  }

  function materialSetWireframe(obj, wf){
    obj.traverse(o=>{
      if(o.material && 'wireframe' in o.material){
        o.material.wireframe = wf;
        o.material.needsUpdate = true;
      }
    });
  }

  function placeMeshAt(type, gx, gz){
    removeMeshAt(gx,gz);
    let mesh = null;
    if(type === TYPES.house) mesh = makeHouse();
    else if(type === TYPES.road) mesh = makeRoad();
    else if(type === TYPES.tree) mesh = makeTree();
    else if(type === TYPES.water) mesh = makeWater();

    if(mesh){
      mesh.position.set((gx - HALF + 0.5)*TILE, 0, (gz - HALF + 0.5)*TILE);
      materialSetWireframe(mesh, wireframeMode);
      scene.add(mesh);
      tiles[gz][gx] = mesh;
    }
  }

  function removeMeshAt(gx, gz){
    const prev = tiles[gz][gx];
    if(prev){ scene.remove(prev); tiles[gz][gx] = null; }
  }

  function setTile(gx, gz, type){
    if(gx<0||gz<0||gx>=GRID_SIZE||gz>=GRID_SIZE) return;
    map[gz][gx] = type;
    if(type === TYPES.empty) removeMeshAt(gx,gz); else placeMeshAt(type, gx, gz);
    updateStats();
    evaluateRules();
  }

  // Raycasting to grid
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function screenToTile(evt){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(ground, false);
    if(!hits.length) return {gx: -1, gz: -1};
    const p = hits[0].point;
    const gx = Math.floor(p.x / TILE + HALF);
    const gz = Math.floor(p.z / TILE + HALF);
    return {gx, gz};
  }

  // Hover highlight (slightly above any tile content)
  let hoverMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.02, 1.02), mats.highlight);
  hoverMesh.visible = false; hoverMesh.position.y = 0.15;
  scene.add(hoverMesh);

  function updateHover(evt){
    const {gx, gz} = screenToTile(evt);
    if(gx>=0&&gz>=0&&gx<GRID_SIZE&&gz<GRID_SIZE){
      hoverMesh.visible = true;
      hoverMesh.position.set((gx - HALF + 0.5)*TILE, 0.01, (gz - HALF + 0.5)*TILE);
    } else {
      hoverMesh.visible = false;
    }
  }

  // Toolbar selection
  const toolbar = document.getElementById('toolbar');
  let currentType = TYPES.house;
  toolbar.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.tool');
    if(!btn) return;
    toolbar.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.type;
    currentType = TYPES[t];
  });

  // Hotkeys
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(k==='h') selectType('house');
    if(k==='r') selectType('road');
    if(k==='t') selectType('tree');
    if(k==='w') selectType('water');
    if(k==='e') selectType('empty');
  });
  function selectType(name){
    const btn = toolbar.querySelector(`[data-type="${name}"]`);
    if(btn){ btn.click(); toast(`Selected: ${name}`); }
  }

  // Place on click
  renderer.domElement.addEventListener('pointermove', updateHover);
  renderer.domElement.addEventListener('pointerleave', ()=> hoverMesh.visible=false);
  renderer.domElement.addEventListener('pointerdown', (e)=>{
    if(e.button!==0) return; // left only
    if(isOrbiting) return; // avoid placing while orbit dragging
    const {gx, gz} = screenToTile(e);
    if(gx<0||gz<0||gx>=GRID_SIZE||gz>=GRID_SIZE) return;

    // Placement rules: trees not on water; erase always allowed
    if(currentType === TYPES.tree && map[gz][gx] === TYPES.water){ toast('Trees cannot be placed on water', 1000); return; }

    setTile(gx, gz, currentType);
  });

  // Stats
  const statsUL = document.getElementById('stats');
  function updateStats(){
    let counts = {empty:0, house:0, road:0, tree:0, water:0};
    for(let z=0; z<GRID_SIZE; z++){
      for(let x=0; x<GRID_SIZE; x++){
        const t = map[z][x];
        if(t===0) counts.empty++; else if(t===1) counts.house++; else if(t===2) counts.road++; else if(t===3) counts.tree++; else if(t===4) counts.water++;
      }
    }
    statsUL.innerHTML = `
      <li>Total tiles: ${GRID_SIZE*GRID_SIZE}</li>
      <li>Houses: ${counts.house}</li>
      <li>Roads: ${counts.road}</li>
      <li>Trees: ${counts.tree}</li>
      <li>Water: ${counts.water}</li>
    `;
  }

  // Rule checks
  const rulesUL = document.getElementById('rules');
  function evaluateRules(){
    const results = [];

    // Rule 1: Every house must be adjacent (4-neigh) to at least one road
    let allHousesConnected = true; let disconnected = 0;
    for(let z=0; z<GRID_SIZE; z++){
      for(let x=0; x<GRID_SIZE; x++){
        if(map[z][x] === TYPES.house){
          const neigh = [ [x+1,z], [x-1,z], [x,z+1], [x,z-1] ];
          const hasRoad = neigh.some(([nx,nz])=> map[nz]?.[nx]===TYPES.road);
          if(!hasRoad){ allHousesConnected=false; disconnected++; }
        }
      }
    }
    results.push({
      ok: allHousesConnected,
      severity: allHousesConnected ? 'ok' : 'bad',
      text: allHousesConnected ? 'All houses connected to roads' : `${disconnected} house(s) not connected to a road`
    });

    // Rule 2: Trees must not touch water (4-neighbor)
    let treesTouchingWater = 0;
    for(let z=0; z<GRID_SIZE; z++){
      for(let x=0; x<GRID_SIZE; x++){
        if(map[z][x] === TYPES.tree){
          const neigh = [ [x+1,z], [x-1,z], [x,z+1], [x,z-1] ];
          const nearWater = neigh.some(([nx,nz])=> map[nz]?.[nx]===TYPES.water);
          if(nearWater) treesTouchingWater++;
        }
      }
    }
    const treesClean = treesTouchingWater===0;
    results.push({ ok: treesClean, severity: treesClean? 'ok':'bad', text: treesClean ? 'Trees not touching water' : `${treesTouchingWater} tree(s) touching water` });

    // Rule 3 (warning): Warn if too many water tiles > 25%
    let waterCount = 0; const total = GRID_SIZE*GRID_SIZE;
    for(let z=0; z<GRID_SIZE; z++) for(let x=0; x<GRID_SIZE; x++) if(map[z][x]===TYPES.water) waterCount++;
    const waterOK = waterCount <= total*0.25;
    results.push({ ok: waterOK, severity: waterOK?'ok':'warn', text: waterOK? 'Water coverage acceptable' : 'High water coverage (>25%)' });

    // Rule 4 (warning): Warn if no roads exist
    let hasRoad = false;
    for(let z=0; z<GRID_SIZE; z++){
      for(let x=0; x<GRID_SIZE; x++){
        if(map[z][x]===TYPES.road){ hasRoad = true; break; }
      }
      if(hasRoad) break;
    }
    results.push({ ok: hasRoad, severity: hasRoad? 'ok':'warn', text: hasRoad? 'Roads present' : 'No roads placed yet' });

    rulesUL.innerHTML = results.map(r=>`<li class="${r.severity}"><span class="dot ${r.severity}"></span>${r.text}</li>`).join('');
  }

  // Save/load/export
  const SAVE_KEY = 'lego-city-grid-v1';
  function serialize(){ return JSON.stringify({ grid: map, size: GRID_SIZE, version: 1 }); }
  function deserialize(json){
    try{
      const data = JSON.parse(json);
      if(!data || !Array.isArray(data.grid) || data.size!==GRID_SIZE) throw new Error('Invalid data');
      // Clear
      for(let z=0; z<GRID_SIZE; z++) for(let x=0; x<GRID_SIZE; x++){ map[z][x]=TYPES.empty; removeMeshAt(x,z); }
      // Fill
      for(let z=0; z<GRID_SIZE; z++) for(let x=0; x<GRID_SIZE; x++){
        const t = data.grid[z][x];
        if(typeof t==='number' && t>=0 && t<=4){ map[z][x]=t; if(t!==TYPES.empty) placeMeshAt(t,x,z); }
      }
      updateStats(); evaluateRules();
      toast('Loaded layout');
    }catch(err){ toast('Import failed: '+err.message, 1200); }
  }

  document.getElementById('saveBtn').addEventListener('click', ()=>{
    localStorage.setItem(SAVE_KEY, serialize());
    toast('Saved to localStorage');
  });
  document.getElementById('loadBtn').addEventListener('click', ()=>{
    const data = localStorage.getItem(SAVE_KEY);
    if(!data) { toast('Nothing saved yet'); return; }
    deserialize(data);
  });
  document.getElementById('clearBtn').addEventListener('click', ()=>{
    for(let z=0; z<GRID_SIZE; z++) for(let x=0; x<GRID_SIZE; x++){ setTile(x,z,TYPES.empty); }
  });

  const ioArea = document.getElementById('ioArea');
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    ioArea.value = serialize(); ioArea.select(); document.execCommand('copy');
    toast('Exported to textarea (copied)');
  });
  document.getElementById('importBtn').addEventListener('click', ()=>{
    if(!ioArea.value.trim()) { toast('Paste JSON first'); return; }
    deserialize(ioArea.value.trim());
  });

  // View controls
  document.getElementById('resetCamBtn').addEventListener('click', ()=>{
    camera.position.set(8, 10, 12); controls.target.set(0,0,0); controls.update();
  });
  document.getElementById('wireBtn').addEventListener('click', ()=>{
    wireframeMode = !wireframeMode;
    // apply to all tiles
    for(let z=0; z<GRID_SIZE; z++) for(let x=0; x<GRID_SIZE; x++){ const m = tiles[z][x]; if(m) materialSetWireframe(m, wireframeMode); }
  });

  // Toast messages
  let toastTimer=null; function toast(text, ms=800){
    overlayMsg.textContent = text; overlayMsg.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> overlayMsg.hidden = true, ms);
  }

  // Resize
  window.addEventListener('resize', ()=>{
    renderer.setSize(WRAP.clientWidth, WRAP.clientHeight);
    camera.aspect = WRAP.clientWidth/WRAP.clientHeight; camera.updateProjectionMatrix();
  });

  // Init
  updateStats(); evaluateRules();

  // Animate
  function tick(){
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
