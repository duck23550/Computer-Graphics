import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls (after renderer is initialized)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

let textMesh;

// Create heart shape similar to the provided image
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 0.4);
heartShape.bezierCurveTo(0.5, 1.2, 1.5, 1.2, 2, 0.5);
heartShape.bezierCurveTo(2.5, -0.2, 1, -1.5, 0, -2);
heartShape.bezierCurveTo(-1, -1.5, -2.5, -0.2, -2, 0.5);
heartShape.bezierCurveTo(-1.5, 1.2, -0.5, 1.2, 0, 0.4);

const heartGeometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.3, bevelEnabled: false });
const heartMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial);
heartMesh.scale.set(4, 4, 1);
heartMesh.position.set(-2, -2, -1);
scene.add(heartMesh);

// Load font and create text
const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry('HUYLOVESHIEU', {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 3
    });
    
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-1.5, 0, 0);
    scene.add(textMesh);
});

// Camera position
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();