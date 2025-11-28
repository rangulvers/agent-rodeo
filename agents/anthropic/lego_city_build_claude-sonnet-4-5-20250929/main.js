// ===== Global State =====
const state = {
    selectedBlock: 'house',
    gridSize: 15,
    blockSize: 1,
    cityData: {}
};

// ===== Three.js Setup =====
let scene, camera, renderer, raycaster, mouse;
let gridHelper, highlightMesh;
let blocks = [];

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(10, 15, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById('scene-container');
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    gridHelper = new THREE.GridHelper(state.gridSize, state.gridSize, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(state.gridSize, state.gridSize);
    const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x90ee90,
        side: THREE.DoubleSide
    });
    const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01;
    scene.add(groundPlane);

    const highlightGeometry = new THREE.BoxGeometry(
        state.blockSize,
        state.blockSize,
        state.blockSize
    );
    const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('contextmenu', onRightClick);

    setupCameraControls();
    animate();
}

function onWindowResize() {
    const container = document.getElementById('scene-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// ===== Camera Controls =====
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function onRightClick(event) {
    event.preventDefault();
    isDragging = false;
}

function setupCameraControls() {
    renderer.domElement.addEventListener('mousedown', (event) => {
        if (event.button === 2) {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMousePosition.x;
            const deltaY = event.clientY - previousMousePosition.y;

            const rotationSpeed = 0.005;
            const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));

            const theta = Math.atan2(camera.position.x, camera.position.z);
            const phi = Math.acos(camera.position.y / cameraDistance);

            const newTheta = theta - deltaX * rotationSpeed;
            const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * rotationSpeed));

            camera.position.x = cameraDistance * Math.sin(newPhi) * Math.sin(newTheta);
            camera.position.y = cameraDistance * Math.cos(newPhi);
            camera.position.z = cameraDistance * Math.sin(newPhi) * Math.cos(newTheta);
            camera.lookAt(0, 0, 0);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const direction = event.deltaY > 0 ? 1 : -1;

        camera.position.multiplyScalar(1 + direction * zoomSpeed);
        camera.position.clampLength(5, 50);
    });
}

// ===== Block Creation =====
function getBlockGeometry(type) {
    switch(type) {
        case 'house':
            return new THREE.BoxGeometry(state.blockSize, state.blockSize * 1.5, state.blockSize);
        case 'road':
            return new THREE.BoxGeometry(state.blockSize, state.blockSize * 0.2, state.blockSize);
        case 'tree':
            return new THREE.ConeGeometry(state.blockSize * 0.4, state.blockSize * 1.2, 8);
        case 'water':
            return new THREE.BoxGeometry(state.blockSize, state.blockSize * 0.1, state.blockSize);
        default:
            return new THREE.BoxGeometry(state.blockSize, state.blockSize, state.blockSize);
    }
}

function getBlockColor(type) {
    switch(type) {
        case 'house':
            return 0xff6b6b;
        case 'road':
            return 0x555555;
        case 'tree':
            return 0x4ecdc4;
        case 'water':
            return 0x4a90e2;
        default:
            return 0xcccccc;
    }
}

function createBlock(type, x, z) {
    const geometry = getBlockGeometry(type);
    const material = new THREE.MeshPhongMaterial({ color: getBlockColor(type) });
    const block = new THREE.Mesh(geometry, material);

    let yOffset = 0;
    switch(type) {
        case 'house':
            yOffset = (state.blockSize * 1.5) / 2;
            break;
        case 'road':
            yOffset = (state.blockSize * 0.2) / 2;
            break;
        case 'tree':
            yOffset = (state.blockSize * 1.2) / 2;
            break;
        case 'water':
            yOffset = (state.blockSize * 0.1) / 2;
            break;
        default:
            yOffset = state.blockSize / 2;
    }

    block.position.set(x, yOffset, z);
    block.userData = { type, gridX: x, gridZ: z };

    scene.add(block);
    blocks.push(block);

    return block;
}

function removeBlockAt(x, z) {
    const blockIndex = blocks.findIndex(
        b => Math.round(b.userData.gridX) === x && Math.round(b.userData.gridZ) === z
    );

    if (blockIndex !== -1) {
        scene.remove(blocks[blockIndex]);
        blocks.splice(blockIndex, 1);
        return true;
    }
    return false;
}

// ===== Mouse Interaction =====
function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        const gridX = Math.round(intersectPoint.x);
        const gridZ = Math.round(intersectPoint.z);

        const halfGrid = Math.floor(state.gridSize / 2);
        if (Math.abs(gridX) <= halfGrid && Math.abs(gridZ) <= halfGrid) {
            highlightMesh.position.set(gridX, 0.5, gridZ);
            highlightMesh.visible = true;
        } else {
            highlightMesh.visible = false;
        }
    }
}

function onMouseClick(event) {
    if (isDragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        const gridX = Math.round(intersectPoint.x);
        const gridZ = Math.round(intersectPoint.z);

        const halfGrid = Math.floor(state.gridSize / 2);
        if (Math.abs(gridX) <= halfGrid && Math.abs(gridZ) <= halfGrid) {
            removeBlockAt(gridX, gridZ);

            if (state.selectedBlock !== 'empty') {
                createBlock(state.selectedBlock, gridX, gridZ);
            }

            updateCityData();
            checkRules();
        }
    }
}

// ===== City Data & Rules =====
function updateCityData() {
    state.cityData = {};
    blocks.forEach(block => {
        const key = `${Math.round(block.userData.gridX)},${Math.round(block.userData.gridZ)}`;
        state.cityData[key] = block.userData.type;
    });
}

function checkRules() {
    const rules = [];

    const blockTypes = blocks.map(b => b.userData.type);
    const houseCount = blockTypes.filter(t => t === 'house').length;
    const roadCount = blockTypes.filter(t => t === 'road').length;
    const waterCount = blockTypes.filter(t => t === 'water').length;
    const totalBlocks = blockTypes.length;

    if (roadCount === 0 && houseCount > 0) {
        rules.push({
            text: '⚠️ No roads! Houses need roads.',
            type: 'warning'
        });
    } else if (houseCount > 0) {
        let allHousesConnected = true;
        blocks.filter(b => b.userData.type === 'house').forEach(house => {
            const hx = Math.round(house.userData.gridX);
            const hz = Math.round(house.userData.gridZ);
            const hasAdjacentRoad = blocks.some(b =>
                b.userData.type === 'road' &&
                ((Math.abs(Math.round(b.userData.gridX) - hx) === 1 && Math.round(b.userData.gridZ) === hz) ||
                 (Math.abs(Math.round(b.userData.gridZ) - hz) === 1 && Math.round(b.userData.gridX) === hx))
            );
            if (!hasAdjacentRoad) {
                allHousesConnected = false;
            }
        });

        if (allHousesConnected) {
            rules.push({
                text: '✓ All houses connected to roads',
                type: 'valid'
            });
        } else {
            rules.push({
                text: '✗ Some houses not connected to roads',
                type: 'invalid'
            });
        }
    }

    if (waterCount > totalBlocks * 0.3) {
        rules.push({
            text: '⚠️ Too much water (>30% of city)',
            type: 'warning'
        });
    } else if (waterCount > 0) {
        rules.push({
            text: '✓ Water level acceptable',
            type: 'valid'
        });
    }

    const treeOnWater = blocks.some(b => {
        if (b.userData.type === 'tree') {
            const tx = Math.round(b.userData.gridX);
            const tz = Math.round(b.userData.gridZ);
            return blocks.some(w =>
                w.userData.type === 'water' &&
                Math.round(w.userData.gridX) === tx &&
                Math.round(w.userData.gridZ) === tz
            );
        }
        return false;
    });

    if (treeOnWater) {
        rules.push({
            text: '✗ Trees cannot be on water',
            type: 'invalid'
        });
    }

    displayRules(rules);
}

function displayRules(rules) {
    const rulesDiv = document.getElementById('rules');
    rulesDiv.innerHTML = '';

    if (rules.length === 0) {
        rulesDiv.innerHTML = '<p style="color: #999; font-style: italic;">Place blocks to see rules</p>';
        return;
    }

    rules.forEach(rule => {
        const ruleItem = document.createElement('div');
        ruleItem.className = `rule-item ${rule.type}`;
        ruleItem.textContent = rule.text;
        rulesDiv.appendChild(ruleItem);
    });
}

// ===== Save & Load =====
function saveCity() {
    updateCityData();
    const saveData = JSON.stringify(state.cityData, null, 2);
    localStorage.setItem('legoCity', saveData);
    document.getElementById('json-input').value = saveData;
    alert('City saved! JSON also copied to textarea.');
}

function loadCity() {
    let saveData = document.getElementById('json-input').value.trim();
    if (!saveData) {
        saveData = localStorage.getItem('legoCity');
        if (!saveData) {
            alert('No saved city found in textarea or localStorage!');
            return;
        }
    }

    try {
        clearCity();

        const loadedData = JSON.parse(saveData);
        Object.entries(loadedData).forEach(([key, type]) => {
            const [x, z] = key.split(',').map(Number);
            createBlock(type, x, z);
        });

        updateCityData();
        checkRules();
        alert('City loaded!');
    } catch (e) {
        alert('Invalid JSON data!');
    }
}

function clearCity() {
    blocks.forEach(block => scene.remove(block));
    blocks = [];
    state.cityData = {};
    checkRules();
}

// ===== UI Controls =====
function initUI() {
    document.querySelectorAll('#toolbar button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedBlock = btn.id;
        });
    });

    // Set initial selected
    document.getElementById('house').classList.add('selected');

    document.getElementById('save').addEventListener('click', saveCity);
    document.getElementById('load').addEventListener('click', loadCity);
}

// ===== Animation Loop =====
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ===== Initialize =====
initScene();
initUI();
checkRules();
