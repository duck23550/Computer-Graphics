import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222244); // Neon night

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// City base position
const basePos = new THREE.Vector3(300, 50, -300);

// LIGHTS
scene.add(new THREE.AmbientLight(0x4444ff, 0.4)); // soft neon ambient

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(basePos.x + 100, basePos.y + 200, basePos.z + 100);
dirLight.castShadow = true;
scene.add(dirLight);

// GROUND & ROAD
const ground = new THREE.Mesh(
    new THREE.BoxGeometry(1200, 1200, 10),
    new THREE.MeshStandardMaterial({ color: 0x222244 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(basePos.x, basePos.y - 10, basePos.z);
ground.receiveShadow = true;
scene.add(ground);

// Road X
const road = new THREE.Mesh(
    new THREE.BoxGeometry(1200, 200, 20),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(basePos.x, basePos.y - 7.5, basePos.z);
scene.add(road);

// Road Z
const roadZ = new THREE.Mesh(
    new THREE.BoxGeometry(200, 1200, 20),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
roadZ.rotation.x = -Math.PI / 2;
roadZ.position.set(basePos.x, basePos.y - 7.5, basePos.z);
scene.add(roadZ);

// BUILDINGS
const buildingTexture = new THREE.TextureLoader().load('neon-windows.jpg');

function createBuilding(pos, size, color) {
    const mat = new THREE.MeshStandardMaterial({
        color,
        map: buildingTexture, // Apply neon windows texture
        emissive: 0x000000,
        roughness: 0.4,
        metalness: 0.3
    });
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(pos.x, pos.y + size.y / 2, pos.z);
    return mesh;
}

const cityGroup = new THREE.Group();
scene.add(cityGroup);
cityGroup.position.copy(basePos);

// Only keep buildings that are on the ground plane (second quadrant, inside the square)
// Building 1 (blue, faces outward: +Z)
const blue = createBuilding(new THREE.Vector3(-150, 0, 400), new THREE.Vector3(80, 480, 80), 0x00ffff);
blue.rotation.y = Math.PI; // faces +Z (outward from city center)
cityGroup.add(blue);

// Building 2 (purple, faces outward: -X)
const purple = createBuilding(new THREE.Vector3(-300, 0, 270), new THREE.Vector3(100, 520, 100), 0xff00ff);
purple.rotation.y = Math.PI ; // faces -X (outward)
cityGroup.add(purple);

// Building 3 (green, faces outward: -Z)
const green = createBuilding(new THREE.Vector3(-520, 0, 300), new THREE.Vector3(70, 460, 70), 0x00ff99);
green.rotation.y = Math.PI; // faces -Z (outward)
cityGroup.add(green);

// Building 4 (pink, faces outward: -X)
const pink = createBuilding(new THREE.Vector3(-450, 0, 200), new THREE.Vector3(60, 540, 60), 0xff0099);
pink.rotation.y = Math.PI; // faces -X (outward)
cityGroup.add(pink);

// --- Add glowing windows to buildings ---
function addWindows(mesh, floors = 5, windowsPerFloor = 2, color = 0x00ffff) {
    const size = new THREE.Vector3();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.boundingBox.getSize(size);

    const windowWidth = size.x / (windowsPerFloor + 1);
    const windowHeight = size.y / (floors + 2);
    const windowDepth = 2;

    // Helper to add windows to a face
    function addWindowsOnFace(faceNormal, faceOffset) {
        for (let i = 1; i <= floors; i++) {
            for (let j = 1; j <= windowsPerFloor; j++) {
                const windowGeo = new THREE.BoxGeometry(windowWidth * 0.6, windowHeight * 0.6, windowDepth);
                const windowMat = new THREE.MeshStandardMaterial({
                    color: 0x222222,
                    emissive: color,
                    emissiveIntensity: 1.5,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);

                // Calculate window position for each face
                let x = 0, y = -size.y / 2 + i * windowHeight, z = 0;
                if (faceNormal.x !== 0) {
                    x = faceNormal.x * (size.x / 2 + windowDepth / 2 + 0.1);
                    z = -size.z / 2 + j * (size.z / (windowsPerFloor + 1));
                    windowMesh.rotation.y = Math.PI / 2;
                } else if (faceNormal.z !== 0) {
                    z = faceNormal.z * (size.z / 2 + windowDepth / 2 + 0.1);
                    x = -size.x / 2 + j * (size.x / (windowsPerFloor + 1));
                }
                windowMesh.position.set(x, y, z);
                mesh.add(windowMesh);
            }
        }
    }

    // Add windows to all 4 sides
    addWindowsOnFace({x: 0, z: 1},  size.z / 2);  // Front
    addWindowsOnFace({x: 0, z: -1}, -size.z / 2); // Back
    addWindowsOnFace({x: 1, z: 0},  size.x / 2);  // Right
    addWindowsOnFace({x: -1, z: 0}, -size.x / 2); // Left
}

// Add windows to all buildings in cityGroup
cityGroup.children.forEach((building, idx) => {
    // Use different window colors for variety
    const windowColors = [0x00ffff, 0xffff00, 0xff8800, 0xff00ff];
    addWindows(building, 5, 2, windowColors[idx % windowColors.length]);
    if (idx === cityGroup.children.length - 1) {
        addWindows(building, 10, 4, windowColors[idx % windowColors.length]); // More floors and windows per floor
    } else {
        addWindows(building, 5, 2, windowColors[idx % windowColors.length]);
    }
});

// Add fog for atmosphere
//scene.fog = new THREE.Fog(0x000011, 800, 1800);

// Helper: Neon color palette
const neonColors = [0x00ffff, 0xff00ff, 0x00ff00, 0xffff00, 0xff8800, 0x00ffcc, 0xff0088];

// Helper: Add neon edges to a mesh
function addNeonEdges(mesh, color) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color, linewidth: 2 })
    );
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    mesh.add(line);
}

// Improved building creation with neon edges
function createNeonBuilding(pos, size, color) {
    const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.6
    });
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(pos.x, pos.y + size.y / 2, pos.z);

    // Add neon edges
    addNeonEdges(mesh, color);

    // Add random neon point light on top
    const light = new THREE.PointLight(color, 1.5, 250, 2);
    light.position.set(0, size.y / 2 + 10, 0);
    mesh.add(light);

    return mesh;
}

// Add more neon point lights for city glow
for (let i = 0; i < 8; i++) {
    const color = neonColors[i % neonColors.length];
    const light = new THREE.PointLight(color, 2, 400, 2);
    light.position.set(
        basePos.x + Math.random() * 800 - 400,
        basePos.y + 120 + Math.random() * 100,
        basePos.z + Math.random() * 800 - 400
    );
    scene.add(light);
}

// GLTF Loader for flying cars
const loader = new GLTFLoader();

// Add 2 flying cars above buildings
let flyingCars = [];
loader.load('flying_car.glb', function(gltf) {
    // Car 1 above blue building
    const car1 = gltf.scene.clone();
    car1.position.set(-150, 400, 400);
    car1.scale.set(0.1, 0.1, 0.1);

    // Add a bright point light to car1
    const car1Light = new THREE.PointLight(0x00ffff, 16, 100, 2);
    car1Light.position.set(0, 5, 0);
    car1.add(car1Light);

    cityGroup.add(car1);
    flyingCars.push(car1);

    // Car 2 above purple building
    const car2 = gltf.scene.clone();
    car2.position.set(-300, 350, 150);
    car2.scale.set(0.1, 0.1, 0.1);

    // Add a bright point light to car2
    const car2Light = new THREE.PointLight(0xff00ff, 4, 100, 2);
    car2Light.position.set(0, 5, 0);
    car2.add(car2Light);

    cityGroup.add(car2);
    flyingCars.push(car2);
});


// === GATE WITH PILLARS AND SIGN ===

// Place the gate at the red circle (in front of the city, on the road)
// Let's use the average x of the buildings and set z just in front of them
const gateBaseX = -120; // average x of buildings
const gateBaseY = 10;
const gateBaseZ = -150; // This matches the road in your image

// Billboard sign for the gate (use unique variable names)
const gateBillboardTexture = new THREE.TextureLoader().load('gate_text.jpg');
const gateBillboardWidth = 300;
const gateBillboardHeight = 170;
const gateBillboardGeo = new THREE.PlaneGeometry(gateBillboardWidth, gateBillboardHeight);
const gateBillboardMat = new THREE.MeshStandardMaterial({
    map: gateBillboardTexture,      // <-- Only the sign uses the texture
   // emissive: 0xffffff,
    //emissiveIntensity: 0.5,
    side: THREE.DoubleSide
});
const gateBillboard = new THREE.Mesh(gateBillboardGeo, gateBillboardMat);

// Pillar geometry and material (no texture, just color)
const pillarHeight = 320;
const pillarGeo = new THREE.BoxGeometry(24, pillarHeight, 24);
const pillarMat = new THREE.MeshStandardMaterial({ color: 0x222244, metalness: 0.7, roughness: 0.3 });

// Left pillar
const pillarLeft = new THREE.Mesh(pillarGeo, pillarMat);
pillarLeft.position.set(gateBaseX - gateBillboardWidth / 2 + 20, gateBaseY + pillarHeight / 2, gateBaseZ);

// Right pillar
const pillarRight = new THREE.Mesh(pillarGeo, pillarMat);
pillarRight.position.set(gateBaseX + gateBillboardWidth / 2 - 20, gateBaseY + pillarHeight / 2, gateBaseZ);

// Place the sign above the pillars
gateBillboard.position.set(gateBaseX, gateBaseY + pillarHeight + gateBillboardHeight / 2, gateBaseZ);
gateBillboard.rotation.y = Math.PI; // Fix reversed texture

// Group the gate parts for easy management
const gateGroup = new THREE.Group();
gateGroup.add(pillarLeft);
gateGroup.add(pillarRight);
gateGroup.add(gateBillboard);

// Add the gate at the circle (on the road, in front of the city)
scene.add(gateGroup);

// CAMERA
camera.position.set(basePos.x - 400, basePos.y + 400, basePos.z + 400);
controls.target.copy(basePos);
controls.update();

// ANIMATION
let flash = 0;

// Define the corners of the square (relative to cityGroup)
const carPathPoints = [
    new THREE.Vector3(-150, 0, 400), // blue
    new THREE.Vector3(-300, 0, 150), // purple
    new THREE.Vector3(-420, 0, 200), // pink
    new THREE.Vector3(-360, 0, 370), // green
];
// Close the loop for smoothness
carPathPoints.push(carPathPoints[0].clone());

const carSpline = new THREE.CatmullRomCurve3(carPathPoints, true);

function animate() {
    requestAnimationFrame(animate);

    // Animate flying cars smoothly along the path
    if (flyingCars.length === 2) {
        const t = (performance.now() * 0.00007) % 1; // slow and smooth

        // Car 1: clockwise
        const pos1 = carSpline.getPointAt(t);
        const nextPos1 = carSpline.getPointAt((t + 0.01) % 1);
        flyingCars[0].position.set(pos1.x, 600 + Math.sin(t * Math.PI * 2) * 20, pos1.z);
        flyingCars[0].lookAt(nextPos1.x, flyingCars[0].position.y, nextPos1.z);

        // Car 2: counter-clockwise, offset by 0.5
        const t2 = (t + 0.5) % 1;
        const pos2 = carSpline.getPointAt(t2);
        const nextPos2 = carSpline.getPointAt((t2 + 0.01) % 1);
        flyingCars[1].position.set(pos2.x, 600 + Math.cos(t2 * Math.PI * 2) * 24, pos2.z);
        flyingCars[1].lookAt(nextPos2.x, flyingCars[1].position.y, nextPos2.z);
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
