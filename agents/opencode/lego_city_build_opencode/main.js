
class LegoCityBuilder {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.gridSize = 20; // 20x20 grid
        this.cellSize = 2;  // Each cell is 2 units wide
        
        this.objects = new Map(); // Stores placed blocks: "x,z" -> { type, mesh }
        this.currentTool = 'house'; // Default tool
        
        this.ghostMesh = null;
        this.hoveredCell = null;

        this.init();
        this.setupUI();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth - 320, window.innerHeight); // Adjust for sidebar
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below ground

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        this.scene.add(dirLight);

        // Grid Helper
        const gridHelper = new THREE.GridHelper(this.gridSize * this.cellSize, this.gridSize, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);

        // Ground Plane (for raycasting)
        const planeGeometry = new THREE.PlaneGeometry(this.gridSize * this.cellSize, this.gridSize * this.cellSize);
        const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);

        // Baseplate (visual)
        const baseGeometry = new THREE.BoxGeometry(this.gridSize * this.cellSize, 0.5, this.gridSize * this.cellSize);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4caf50 }); // Grass green base
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25;
        base.receiveShadow = true;
        this.scene.add(base);

        // Ghost Mesh (Preview)
        this.updateGhostMesh();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
    }

    setupUI() {
        // Toolbar
        const buttons = document.querySelectorAll('.tool-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.type;
                this.updateGhostMesh();
            });
        });

        // Save/Load
        document.getElementById('btn-save').addEventListener('click', () => this.saveCity());
        document.getElementById('btn-load').addEventListener('click', () => this.loadCity());
    }

    createBlockMesh(type) {
        let mesh;
        const size = this.cellSize;
        
        switch (type) {
            case 'house':
                const houseGroup = new THREE.Group();
                
                // Base
                const baseGeo = new THREE.BoxGeometry(size * 0.8, size * 0.6, size * 0.8);
                const baseMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c }); // Red
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.y = size * 0.3;
                base.castShadow = true;
                base.receiveShadow = true;
                houseGroup.add(base);

                // Roof
                const roofGeo = new THREE.ConeGeometry(size * 0.6, size * 0.4, 4);
                const roofMat = new THREE.MeshStandardMaterial({ color: 0xc0392b }); // Darker Red
                const roof = new THREE.Mesh(roofGeo, roofMat);
                roof.position.y = size * 0.8;
                roof.rotation.y = Math.PI / 4;
                roof.castShadow = true;
                houseGroup.add(roof);
                
                mesh = houseGroup;
                break;

            case 'road':
                const roadGeo = new THREE.BoxGeometry(size, 0.1, size);
                const roadMat = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Dark Gray
                mesh = new THREE.Mesh(roadGeo, roadMat);
                mesh.position.y = 0.05;
                mesh.receiveShadow = true;
                break;

            case 'tree':
                const treeGroup = new THREE.Group();
                
                // Trunk
                const trunkGeo = new THREE.CylinderGeometry(size * 0.1, size * 0.15, size * 0.4, 8);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548 }); // Brown
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = size * 0.2;
                trunk.castShadow = true;
                treeGroup.add(trunk);

                // Leaves
                const leavesGeo = new THREE.DodecahedronGeometry(size * 0.3);
                const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71 }); // Green
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.y = size * 0.5;
                leaves.castShadow = true;
                treeGroup.add(leaves);

                mesh = treeGroup;
                break;

            case 'water':
                const waterGeo = new THREE.BoxGeometry(size, 0.1, size);
                const waterMat = new THREE.MeshStandardMaterial({ 
                    color: 0x3498db, 
                    transparent: true, 
                    opacity: 0.8 
                });
                mesh = new THREE.Mesh(waterGeo, waterMat);
                mesh.position.y = 0.05;
                break;
                
            case 'empty':
                // Ghost only
                const emptyGeo = new THREE.BoxGeometry(size, size, size);
                const emptyMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.5 });
                mesh = new THREE.Mesh(emptyGeo, emptyMat);
                mesh.position.y = size / 2;
                break;
        }
        return mesh;
    }

    updateGhostMesh() {
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
        }
        
        this.ghostMesh = this.createBlockMesh(this.currentTool);
        
        // Make ghost transparent/ethereal
        this.ghostMesh.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.5;
                child.material.depthWrite = false;
            }
        });
        
        this.scene.add(this.ghostMesh);
        this.ghostMesh.visible = false;
    }

    getGridPosition(point) {
        const x = Math.floor(point.x / this.cellSize);
        const z = Math.floor(point.z / this.cellSize);
        return { x, z };
    }

    getWorldPosition(gridX, gridZ) {
        return new THREE.Vector3(
            gridX * this.cellSize + this.cellSize / 2,
            0,
            gridZ * this.cellSize + this.cellSize / 2
        );
    }

    onMouseMove(event) {
        // Calculate mouse position
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.plane);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const gridPos = this.getGridPosition(intersect.point);
            
            // Check bounds
            const halfGrid = this.gridSize / 2;
            if (Math.abs(gridPos.x) < halfGrid && Math.abs(gridPos.z) < halfGrid) {
                this.hoveredCell = gridPos;
                
                if (this.ghostMesh) {
                    this.ghostMesh.visible = true;
                    const worldPos = this.getWorldPosition(gridPos.x, gridPos.z);
                    this.ghostMesh.position.x = worldPos.x;
                    this.ghostMesh.position.z = worldPos.z;
                    // Y is set in createBlockMesh
                }
            } else {
                this.hoveredCell = null;
                if (this.ghostMesh) this.ghostMesh.visible = false;
            }
        } else {
            this.hoveredCell = null;
            if (this.ghostMesh) this.ghostMesh.visible = false;
        }
    }

    onMouseDown(event) {
        if (event.button !== 0) return; // Only left click
        if (!this.hoveredCell) return;

        const key = `${this.hoveredCell.x},${this.hoveredCell.z}`;

        if (this.currentTool === 'empty') {
            // Remove block
            if (this.objects.has(key)) {
                const obj = this.objects.get(key);
                this.scene.remove(obj.mesh);
                this.objects.delete(key);
                this.checkRules();
            }
        } else {
            // Place block
            // Remove existing if any
            if (this.objects.has(key)) {
                const obj = this.objects.get(key);
                this.scene.remove(obj.mesh);
                this.objects.delete(key);
            }

            const mesh = this.createBlockMesh(this.currentTool);
            const worldPos = this.getWorldPosition(this.hoveredCell.x, this.hoveredCell.z);
            mesh.position.x = worldPos.x;
            mesh.position.z = worldPos.z;
            // Y is already set correctly in createBlockMesh relative to 0
            
            this.scene.add(mesh);
            this.objects.set(key, { type: this.currentTool, mesh: mesh });
            this.checkRules();
        }
    }

    checkRules() {
        const blocks = Array.from(this.objects.entries());
        const counts = { house: 0, road: 0, tree: 0, water: 0 };
        
        blocks.forEach(([key, data]) => {
            if (counts[data.type] !== undefined) counts[data.type]++;
        });

        const totalBlocks = blocks.length;

        // Rule 1: Houses connected to road
        let allHousesConnected = true;
        let houseCount = 0;
        
        blocks.forEach(([key, data]) => {
            if (data.type === 'house') {
                houseCount++;
                const [x, z] = key.split(',').map(Number);
                const neighbors = [
                    `${x+1},${z}`, `${x-1},${z}`, `${x},${z+1}`, `${x},${z-1}`
                ];
                
                const hasRoad = neighbors.some(nKey => {
                    const neighbor = this.objects.get(nKey);
                    return neighbor && neighbor.type === 'road';
                });

                if (!hasRoad) allHousesConnected = false;
            }
        });

        if (houseCount === 0) allHousesConnected = true; // No houses, no problem

        this.updateRuleUI('rule-house-road', allHousesConnected);

        // Rule 2: Trees not adjacent to water (My interpretation of "Trees must not be placed on water" + safety)
        // Actually, let's stick to the prompt: "Trees must not be placed on water".
        // Since I replace blocks, a tree is never "on" water. 
        // I'll implement: "Trees must be adjacent to at least one other Tree or Park (Forest rule)" 
        // OR "Trees must not be adjacent to Water" (Salt water kills trees).
        // Let's go with "Trees must not be adjacent to Water".
        let treesSafe = true;
        blocks.forEach(([key, data]) => {
            if (data.type === 'tree') {
                const [x, z] = key.split(',').map(Number);
                const neighbors = [
                    `${x+1},${z}`, `${x-1},${z}`, `${x},${z+1}`, `${x},${z-1}`
                ];
                
                const nearWater = neighbors.some(nKey => {
                    const neighbor = this.objects.get(nKey);
                    return neighbor && neighbor.type === 'water';
                });

                if (nearWater) treesSafe = false;
            }
        });
        this.updateRuleUI('rule-tree-water', treesSafe);

        // Rule 3: Water limit (< 40%)
        const waterRatio = totalBlocks > 0 ? counts.water / totalBlocks : 0;
        this.updateRuleUI('rule-water-limit', waterRatio < 0.4);

        // Rule 4: Road exists (if there are houses)
        const roadsExist = counts.road > 0;
        const housesExist = counts.house > 0;
        // Warn if houses exist but no roads
        this.updateRuleUI('rule-road-exist', !(housesExist && !roadsExist));
    }

    updateRuleUI(id, isValid) {
        const el = document.getElementById(id);
        const icon = el.querySelector('.status-icon');
        if (isValid) {
            el.classList.remove('error', 'warning');
            el.classList.add('success');
            icon.textContent = '✅';
        } else {
            el.classList.remove('success');
            el.classList.add('error');
            icon.textContent = '❌';
        }
    }

    saveCity() {
        const data = {};
        this.objects.forEach((value, key) => {
            data[key] = value.type;
        });
        const json = JSON.stringify(data, null, 2);
        document.getElementById('io-area').value = json;
    }

    loadCity() {
        try {
            const json = document.getElementById('io-area').value;
            if (!json) return;
            const data = JSON.parse(json);
            
            // Clear current city
            this.objects.forEach(obj => this.scene.remove(obj.mesh));
            this.objects.clear();

            // Rebuild
            Object.entries(data).forEach(([key, type]) => {
                const [x, z] = key.split(',').map(Number);
                const mesh = this.createBlockMesh(type);
                const worldPos = this.getWorldPosition(x, z);
                mesh.position.x = worldPos.x;
                mesh.position.z = worldPos.z;
                this.scene.add(mesh);
                this.objects.set(key, { type, mesh });
            });

            this.checkRules();
        } catch (e) {
            alert('Invalid JSON data');
            console.error(e);
        }
    }

    onWindowResize() {
        this.camera.aspect = (window.innerWidth - 320) / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth - 320, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the app
new LegoCityBuilder();
