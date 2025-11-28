// Main application for 3D Lego City Builder
class LegoCityBuilder {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        
        // Grid settings
        this.gridSize = 20;
        this.gridHeight = 10;
        this.cellSize = 1;
        
        // Block types
        this.blockTypes = {
            empty: { color: 0x333333, name: 'Empty' },
            house: { color: 0xff6b6b, name: 'House' },
            road: { color: 0x6a6a6a, name: 'Road' },
            tree: { color: 0x4ade80, name: 'Tree' },
            water: { color: 0x3b82f6, name: 'Water' }
        };
        
        // Current selection
        this.selectedBlockType = 'empty';
        
        // City data
        this.cityBlocks = {};
        
        // Initialize the application
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 300) / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 15, 20);
        this.camera.lookAt(10, 0, 10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        
        // Setup raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Add lighting
        this.addLighting();
        
        // Create grid
        this.createGrid();
        
        // Render initial scene
        this.renderer.render(this.scene, this.camera);
    }
    
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }
    
    createGrid() {
        // Create grid helper
        const gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, 0x444444, 0x222222);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
        
        // Create ground plane
        const planeGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x90a959,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(this.gridSize/2, 0, this.gridSize/2);
        plane.receiveShadow = true;
        this.scene.add(plane);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }
    
    setupEventListeners() {
        // Block selection
        document.querySelectorAll('.block-selector').forEach(selector => {
            selector.addEventListener('click', (e) => {
                document.querySelectorAll('.block-selector').forEach(s => s.classList.remove('active'));
                selector.classList.add('active');
                this.selectedBlockType = selector.dataset.type;
            });
        });
        
        // Mouse events for placing blocks
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            // Disable controls during mouse down
            this.controls.enabled = false;
            // Only handle left mouse button
            if (e.button === 0) {
                this.onMouseDown(e);
            }
        });
        
        // Re-enable controls when mouse is released
        this.renderer.domElement.addEventListener('mouseup', () => {
            this.controls.enabled = true;
        });
        
        // Re-enable controls when mouse leaves the renderer
        this.renderer.domElement.addEventListener('mouseleave', () => {
            this.controls.enabled = true;
        });
        
        // Also handle mouse up on the document to ensure controls are re-enabled
        document.addEventListener('mouseup', () => {
            this.controls.enabled = true;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        // Save/load buttons
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCity();
        });
        
        document.getElementById('load-btn').addEventListener('click', () => {
            this.loadCity();
        });
    }
    
    onMouseDown(event) {
        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();
        
        // Only handle left mouse button
        if (event.button !== 0) return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections with the ground plane (at y=0)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectPlane(plane, intersection)) {
            // Convert world position to grid coordinates
            // The grid is positioned from (0,0,0) to (gridSize,0,gridSize)
            // But the plane is centered at (gridSize/2, 0, gridSize/2)
            // So we need to adjust the coordinates
            const gridX = Math.floor(intersection.x);
            const gridZ = Math.floor(intersection.z);
            
            // Make sure we're within grid bounds (grid is from 0 to gridSize)
            if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
                if (this.selectedBlockType === 'empty') {
                    this.removeBlock(gridX, 0, gridZ);
                } else {
                    this.placeBlock(gridX, 0, gridZ, this.selectedBlockType);
                }
                
                // Update rules
                this.checkRules();
            }
        }
    }
    
    placeBlock(x, y, z, type) {
        // Remove existing block at this position if any
        this.removeBlock(x, y, z);
        
        // Create new block
        const geometry = new THREE.BoxGeometry(this.cellSize, this.cellSize, this.cellSize);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.blockTypes[type].color,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const block = new THREE.Mesh(geometry, material);
        block.position.set(x + 0.5, y + 0.5, z + 0.5);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type: type };
        
        this.scene.add(block);
        
        // Store in our data structure
        const key = `${x},${y},${z}`;
        this.cityBlocks[key] = {
            mesh: block,
            type: type
        };
    }
    
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.cityBlocks[key]) {
            this.scene.remove(this.cityBlocks[key].mesh);
            delete this.cityBlocks[key];
        }
    }
    
    checkRules() {
        // Count blocks by type
        const counts = {};
        Object.values(this.blockTypes).forEach(type => counts[type.name] = 0);
        
        Object.values(this.cityBlocks).forEach(block => {
            counts[this.blockTypes[block.type].name]++;
        });
        
        // Rule 1: Every house must be connected to a road
        const houseRoadRule = document.getElementById('house-road-rule');
        let housesConnectedToRoad = true;
        
        // Simple check: if there are houses, there should be roads
        const houseCount = counts['House'];
        const roadCount = counts['Road'];
        
        if (houseCount > 0 && roadCount === 0) {
            housesConnectedToRoad = false;
        }
        
        houseRoadRule.classList.remove('valid', 'invalid');
        if (houseCount === 0 || housesConnectedToRoad) {
            houseRoadRule.classList.add('valid');
            houseRoadRule.querySelector('.rule-status').textContent = '✅';
        } else {
            houseRoadRule.classList.add('invalid');
            houseRoadRule.querySelector('.rule-status').textContent = '❌';
        }
        
        // Rule 2: Trees must not be placed on water
        const treeWaterRule = document.getElementById('tree-water-rule');
        treeWaterRule.classList.remove('valid', 'invalid');
        treeWaterRule.classList.add('valid');
        treeWaterRule.querySelector('.rule-status').textContent = '✅';
        
        // Rule 3: Warn if too many blocks are water (more than 30%)
        const waterRule = document.getElementById('water-rule');
        const totalBlocks = Object.keys(this.cityBlocks).length;
        const waterPercentage = totalBlocks > 0 ? (counts['Water'] / totalBlocks) * 100 : 0;
        const tooMuchWater = waterPercentage > 30;
        
        waterRule.classList.remove('valid', 'invalid');
        if (tooMuchWater) {
            waterRule.classList.add('invalid');
            waterRule.querySelector('.rule-status').textContent = '❌';
        } else {
            waterRule.classList.add('valid');
            waterRule.querySelector('.rule-status').textContent = '✅';
        }
        
        // Rule 4: Warn if no roads exist
        const roadRule = document.getElementById('road-rule');
        const noRoads = roadCount === 0;
        
        roadRule.classList.remove('valid', 'invalid');
        if (noRoads && totalBlocks > 0) {
            roadRule.classList.add('invalid');
            roadRule.querySelector('.rule-status').textContent = '❌';
        } else {
            roadRule.classList.add('valid');
            roadRule.querySelector('.rule-status').textContent = '✅';
        }
    }
    
    saveCity() {
        const cityData = {
            blocks: {}
        };
        
        Object.keys(this.cityBlocks).forEach(key => {
            cityData.blocks[key] = this.cityBlocks[key].type;
        });
        
        const jsonData = JSON.stringify(cityData, null, 2);
        document.getElementById('save-data').value = jsonData;
    }
    
    loadCity() {
        try {
            const jsonData = document.getElementById('save-data').value;
            if (!jsonData) {
                alert('Please paste city data first');
                return;
            }
            
            const cityData = JSON.parse(jsonData);
            
            // Clear existing blocks
            Object.keys(this.cityBlocks).forEach(key => {
                this.scene.remove(this.cityBlocks[key].mesh);
            });
            this.cityBlocks = {};
            
            // Load new blocks
            Object.keys(cityData.blocks).forEach(key => {
                const [x, y, z] = key.split(',').map(Number);
                const type = cityData.blocks[key];
                this.placeBlock(x, y, z, type);
            });
            
            // Update rules
            this.checkRules();
            
            alert('City loaded successfully!');
        } catch (e) {
            alert('Error loading city: ' + e.message);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = (window.innerWidth - 300) / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
new LegoCityBuilder();