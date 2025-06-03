// AUTHOR: NGUYEN VAN A - ID: 20221111
import * as THREE from 'three';

export function init(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 ); 
	const material = new THREE.MeshBasicMaterial( {color: 0xffff00} ); 
	const cylinder = new THREE.Mesh( geometry, material ); 
	scene.add( cylinder );

    camera.position.z = 50;

    function animate() {
        requestAnimationFrame(animate);
        cylinder.rotation.x += 0.01;
        cylinder.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}