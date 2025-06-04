import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio * 0.75); // Lower renderer pixel ratio for performance
document.body.appendChild(renderer.domElement);

const centralX = 300;
const centralY = 50;
const centralZ = -300;

const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 0, 512);
// Night sky: deep blue to almost black
gradient.addColorStop(0, '#0a0a23'); // Top: very dark blue
gradient.addColorStop(1, '#000010'); // Bottom: almost black
context.fillStyle = gradient;
context.fillRect(0, 0, 512, 512);
const backgroundTexture = new THREE.CanvasTexture(canvas);
scene.background = backgroundTexture;

const ambientLight = new THREE.AmbientLight(0x4040ff, 0.5);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
sunlight.position.set(centralX + 50, centralY + 200, centralZ + 50);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 1024; // Lower shadow map size
sunlight.shadow.mapSize.height = 1024;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 1000;
// FIX: Adjust shadow camera frustum for better shadow coverage
sunlight.shadow.camera.left = -600;
sunlight.shadow.camera.right = 600;
sunlight.shadow.camera.top = 600;
sunlight.shadow.camera.bottom = -600;
sunlight.shadow.camera.updateProjectionMatrix(); // Important after changing frustum
scene.add(sunlight);

const moonlight = new THREE.DirectionalLight(0x66ccff, 1.0);
moonlight.position.set(centralX - 50, centralY + 150, centralZ - 50);
moonlight.castShadow = false; // Moonlight typically doesn't cast strong shadows in stylized scenes
scene.add(moonlight);

const groundGeometry = new THREE.BoxGeometry(1200, 10, 1200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1c2526, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(centralX, centralY - 10, centralZ); // Ground center Y is centralY - 10
ground.receiveShadow = true;
scene.add(ground);

// Calculate ground top Y for placing objects on it
const groundTopY = ground.position.y + groundGeometry.parameters.height / 2; // centralY - 5

const roadGeometryX = new THREE.BoxGeometry(1200, 1, 200);
const roadGeometryZ = new THREE.BoxGeometry(200, 1, 1200);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });

const roadX = new THREE.Mesh(roadGeometryX, roadMaterial);
// Roads slightly above ground
roadX.position.set(centralX, groundTopY + 0.5, centralZ); // road center y
roadX.receiveShadow = true; // Roads can also receive shadows
scene.add(roadX);

const roadZ = new THREE.Mesh(roadGeometryZ, roadMaterial);
roadZ.position.set(centralX, groundTopY + 0.5, centralZ); // road center y
roadZ.receiveShadow = true; // Roads can also receive shadows
scene.add(roadZ);


const buildingPositions = [];

// FIX: Corrected isPositionValid logic
function isPositionValid(x, z, sizeX, sizeZ, minDistance) {
  // Check 1: Central exclusion zone (area around roads)
  // Buildings should not be too close to the central road intersection.
  if (Math.abs(x - centralX) < (100 + sizeX / 2 + minDistance) || // 100 is half road width
      Math.abs(z - centralZ) < (100 + sizeZ / 2 + minDistance)) { // 100 is half road width
    return false;
  }

  // Check 2: Collision with any existing buildings
  for (const pos of buildingPositions) {
    const dx = Math.abs(pos.x - x);
    const dz = Math.abs(pos.z - z);
    // Check if the new building (sizeX, sizeZ) overlaps with existing (pos.sizeX, pos.sizeZ)
    // considering their centers and the minDistance
    if (dx < (sizeX / 2 + pos.sizeX / 2 + minDistance) &&
        dz < (sizeZ / 2 + pos.sizeZ / 2 + minDistance)) {
      return false; // Collision with an existing building
    }
  }
  return true; // Position is valid
}

const numBuildings = 15;
const minDistance = 15; // Minimum distance between buildings

// Ensure your texture path is correct.
// If 'textures/neon-windows.jpg' is not found, the map will not apply.
const textureLoader = new THREE.TextureLoader();
const windowTexture = textureLoader.load('neon-windows.jpg', 
    () => { console.log("Window texture loaded successfully."); renderer.render(scene, camera); }, // Optional: re-render on load
    undefined, 
    (err) => { console.error('Error loading window texture:', err); }
);


for (let i = 0; i < numBuildings; i++) {
  let attempts = 0;
  let validPosition = false;
  let x, z, sizeX, sizeZ, height;

  while (!validPosition && attempts < 50) {
    // Generate positions in the second quadrant: X < 0, Z > 0
    x = centralX - (Math.random() * 400 + 150); // Always less than centralX, so negative relative to origin
    z = centralZ + (Math.random() * 400 + 150); // Always greater than centralZ, so positive relative to origin

    sizeX = Math.random() * 20 + 15;
    sizeZ = Math.random() * 20 + 15;
    // Make all buildings tall: set a high minimum and maximum height
    height = Math.random() * 80 + 120; // All buildings between 120 and 200 units tall

    if (isPositionValid(x, z, sizeX, sizeZ, minDistance)) {
      validPosition = true;
      buildingPositions.push({ x, z, sizeX, sizeZ });

      const neonColors = [0xff3399, 0x33ccff, 0xffff33, 0x00ffcc];
      const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];

      // Use tower geometry for the first 3 buildings
      let building;
      if (i < 3) {
        // Main tower body (cylinder)
        const towerRadius = Math.min(sizeX, sizeZ) * 0.5;
        // Lower geometry segments for towers and rings
        const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius * 0.8, height, 10); // was 12+
        const towerMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.4,
          metalness: 0.8,
          emissive: neonColor,
          emissiveIntensity: 0.5,
          map: windowTexture,
        });
        building = new THREE.Mesh(towerGeometry, towerMaterial);
        building.position.set(x, groundTopY + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);


        // Optional: Add a glowing ring near the top
        const ringGeometry = new THREE.TorusGeometry(towerRadius * 0.7, 0.7, 6, 10); // was 12+
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: neonColor,
          emissive: neonColor,
          emissiveIntensity: 2,
          metalness: 1,
          roughness: 0.1,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(x, groundTopY + height * 0.45, z);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
      } else {
        // ...your existing cube building code...
        const buildingMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.7,
          map: windowTexture,
        });
        const buildingGeometry = new THREE.BoxGeometry(sizeX, height, sizeZ);
        building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, groundTopY + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
      }

      const edgeMaterial = new THREE.MeshStandardMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 1.5 });
      const edgeHeight = 0.5;
      // Using BoxGeometry for edges, consider EdgesGeometry for more precise outlines if needed.
      const edgeGeo = new THREE.BoxGeometry(sizeX + 0.5, edgeHeight, sizeZ + 0.5); // Slightly larger for visibility

      const topEdge = new THREE.Mesh(edgeGeo, edgeMaterial);
      // FIX: Edge Y position based on corrected building position
      topEdge.position.set(x, groundTopY + height - edgeHeight / 2, z); // On top of the building
      scene.add(topEdge);

      const bottomEdge = new THREE.Mesh(edgeGeo, edgeMaterial);
      // FIX: Edge Y position based on corrected building position
      bottomEdge.position.set(x, groundTopY + edgeHeight / 2, z); // At the base of the building
      scene.add(bottomEdge);

      // Pick a random neon color for this building's windows
      const windowNeonColors = [0x00ffff, 0xff00ff, 0xffff00, 0xff8800, 0x00ff66, 0x3399ff];
      const windowColor = windowNeonColors[Math.floor(Math.random() * windowNeonColors.length)];

      // Window material (keep emissive for glow, remove point lights)
      const windowMat = new THREE.MeshStandardMaterial({
        color: windowColor,
        emissive: windowColor,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.7
      });

      // Add glowing window planes to each side of the building
      // Reduce the number of windows even more
      const windowRows = 2; // Only 2 rows
      const windowCols = 2; // Only 2 columns

      const windowWidth = sizeX / windowCols * 0.5;
      const windowHeight = height / windowRows * 0.4;
      const windowDepth = 0.2;

      // Add windows to the +Z and -Z faces
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const y = groundTopY + (row + 0.5) * (height / windowRows);
          const xOffset = (col - (windowCols - 1) / 2) * (sizeX / windowCols);

          // +Z face
          const win1 = new THREE.Mesh(
            new THREE.PlaneGeometry(windowWidth, windowHeight),
            windowMat
          );
          win1.position.set(x + xOffset, y, z + sizeZ / 2 + windowDepth / 2 + 0.01);
          win1.rotation.y = 0;
          scene.add(win1);

          // -Z face
          const win2 = new THREE.Mesh(
            new THREE.PlaneGeometry(windowWidth, windowHeight),
            windowMat
          );
          win2.position.set(x + xOffset, y, z - sizeZ / 2 - windowDepth / 2 - 0.01);
          win2.rotation.y = Math.PI;
          scene.add(win2);

          // Add a small point light for window glow
          /*const windowLight = new THREE.PointLight(0x00ffff, 0.3, 10);
          windowLight.position.set(x + xOffset, y, z + sizeZ / 2 + windowDepth + 0.2);
          scene.add(windowLight);*/
        }
      }

      // Add windows to the +X and -X faces
      const windowColsX = 2;
      const windowWidthX = sizeZ / windowColsX * 0.5;
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowColsX; col++) {
          const y = groundTopY + (row + 0.5) * (height / windowRows);
          const zOffset = (col - (windowColsX - 1) / 2) * (sizeZ / windowColsX);

          // +X face
          const win3 = new THREE.Mesh(
            new THREE.PlaneGeometry(windowWidthX, windowHeight),
            windowMat
          );
          win3.position.set(x + sizeX / 2 + windowDepth / 2 + 0.01, y, z + zOffset);
          win3.rotation.y = Math.PI / 2;
          scene.add(win3);

          // -X face
          const win4 = new THREE.Mesh(
            new THREE.PlaneGeometry(windowWidthX, windowHeight),
            windowMat
          );
          win4.position.set(x - sizeX / 2 - windowDepth / 2 - 0.01, y, z + zOffset);
          win4.rotation.y = -Math.PI / 2;
          scene.add(win4);

          // Add a small point light for window glow
          /*const windowLight = new THREE.PointLight(0x00ffff, 0.3, 10);
          windowLight.position.set(x + sizeX / 2 + windowDepth + 0.2, y, z + zOffset);
          scene.add(windowLight);*/
        }
      }
    }
    attempts++;
  }
   if (!validPosition) {
    console.warn("Could not find a valid position for a building after 50 attempts.");
  }
}
if (buildingPositions.length === 0) {
    console.warn("No buildings were placed. Check isPositionValid logic and generation ranges.");
}


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.15; // Try 0.1 - 0.2 for a snappier feel

// Adjust camera for a better overview initially
camera.position.set(centralX - 150, centralY + 150, centralZ + 250);
controls.target.set(centralX, centralY, centralZ - 50); // Look towards the city center/roads
controls.update();

// --- FLYING CARS SETUP ---
const flyingCars = [];
// Define color pairs: [primary, secondary]
const carColorPairs = [
  [0x00ff00, 0x111111], // Green & Black
  [0x3399ff, 0xffffff], // Blue & White
  [0xffffff, 0x111111], // White & Black
];

// Define city bounds in the second quadrant (match building generation)
const cityMinX = centralX - 550;
const cityMaxX = centralX - 150;
const cityMinZ = centralZ + 150;
const cityMaxZ = centralZ + 550;

// Load cyberpunk hovercar models with different colors
const loader = new GLTFLoader();

for (let i = 0; i < 3; i++) {
  loader.load(
    'free_cyberpunk_hovercar.glb',
    function (gltf) {
      const car = gltf.scene;
      const [primary, secondary] = carColorPairs[i];

      car.traverse(obj => {
        if (obj.isMesh && obj.material) {
          // If the mesh/material name contains "body", use primary, else use secondary
          const name = (obj.name + obj.material.name).toLowerCase();
          if (name.includes('body') || name.includes('car') || name.includes('paint')) {
            obj.material.color.setHex(primary);
            if (obj.material.emissive) obj.material.emissive.setHex(primary);
          } else {
            obj.material.color.setHex(secondary);
            if (obj.material.emissive) obj.material.emissive.setHex(secondary);
          }
          obj.material.emissiveIntensity = 1.2;
          obj.material.needsUpdate = true;
          obj.castShadow = true;
          obj.receiveShadow = false;
        }
      });

      car.scale.set(8, 8, 8);
      car.position.set(
        cityMinX + (cityMaxX - cityMinX) * Math.random(),
        groundTopY + 40 + i * 10,
        cityMinZ + (cityMaxZ - cityMinZ) * Math.random()
      );
      scene.add(car);
      flyingCars.push(car);
    },
    undefined,
    function (error) {
      console.error('Error loading Ferrari model:', error);
    }
  );
}

// --- ANIMATE FLYING CARS ---
function animateFlyingCars(time) {
  for (let i = 0; i < flyingCars.length; i++) {
    const car = flyingCars[i];
    // Each car flies in a different elliptical path within city bounds
    const a = (cityMaxX - cityMinX) / 2 - 20 - i * 10; // X radius
    const b = (cityMaxZ - cityMinZ) / 2 - 20 - i * 10; // Z radius
    const centerX = (cityMinX + cityMaxX) / 2;
    const centerZ = (cityMinZ + cityMaxZ) / 2;
    const speed = 0.18 + i * 0.07;

    // Make cars fly higher above the buildings
    const baseHeight = groundTopY + 180 + i * 20; // Much higher than buildings
    const verticalOsc = Math.sin(time * (0.8 + i * 0.2)) * 15 + Math.cos(time * (0.5 + i * 0.1)) * 8;

    // Dodge buildings: add a sinusoidal offset to X and Z to simulate dodging
    const dodgeX = Math.sin(time * speed * 2 + i * 2) * 40;
    const dodgeZ = Math.cos(time * speed * 2 + i * 2) * 40;

    car.position.x = centerX + Math.cos(time * speed + i) * a + dodgeX;
    car.position.z = centerZ + Math.sin(time * speed + i) * b + dodgeZ;
    car.position.y = baseHeight + verticalOsc;
    car.rotation.y = Math.atan2(
      Math.sin(time * speed + i) * b + dodgeZ,
      Math.cos(time * speed + i) * a + dodgeX
    ) + Math.PI; // Face forward along the path
  }
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;
  animateFlyingCars(time);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// === GATE SETUP ===
const gateX = (cityMinX + cityMaxX) / 2; // Centered in X
const gateZ = cityMinZ - 40; // In front of the city (adjust -40 as needed)
const gateY = groundTopY; // On the ground

const gateHeight = 90;
const gateRadius = 5;
const gateDistance = 140; // Distance between the two cylinders

const billboardgateTexture = new THREE.TextureLoader().load('gate_text.jpg');

// Left pillar
const pillarGeo = new THREE.CylinderGeometry(gateRadius, gateRadius, gateHeight, 8);
const pillarMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  //emissive: 0x00ffff,
  //emissiveIntensity: 1.2,
  metalness: 0.8,
  roughness: 0.3
});
const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
leftPillar.position.set(gateX - gateDistance / 2, gateY + gateHeight / 2, gateZ);
scene.add(leftPillar);

// Right pillar
const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
rightPillar.position.set(gateX + gateDistance / 2, gateY + gateHeight / 2, gateZ);
scene.add(rightPillar);

// Billboard above the gate
const gateBillboardWidth = 160;
const gateBillboardHeight = 100;
const gateBillboardGeo = new THREE.PlaneGeometry(gateBillboardWidth, gateBillboardHeight);
const gateBillboardMat = new THREE.MeshStandardMaterial({
  map: billboardgateTexture, // <-- Use the gate texture here!
  //emissive: 0xffffff,
  emissiveIntensity: 1.2,
  side: THREE.DoubleSide
});
const gateBillboard = new THREE.Mesh(gateBillboardGeo, gateBillboardMat);
gateBillboard.position.set(gateX, gateY + gateHeight + gateBillboardHeight / 2 + 2, gateZ);
gateBillboard.rotation.y = Math.PI; // Face the same way as main billboard
scene.add(gateBillboard);
