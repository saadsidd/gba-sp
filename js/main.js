import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as TWEEN from 'tween';


// Scene
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xF5E2E4);
scene.background = new THREE.Color('skyblue');


// DOM
const baseColor = new THREE.Color(0xFF0000);
let baseModel;
document.getElementById('base-color').addEventListener('input', (event) => {
    // baseColor.setStyle(event.target.value);
    // baseModel.material.color = baseColor;
    // console.log(scene.background);
    scene.background.setStyle(event.target.value);
});


// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2, 2, 2);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);
renderer.toneMappingExposure = 0.7;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

// Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 3);
// scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
// scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 1);
pointLight.position.set(0, 2, 1);
// scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
scene.add(pointLightHelper);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 1.5;
controls.maxDistance = 10;
// controls.enablePan = false;
controls.enableDamping = true;

// Cube
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({color: 0xFF0000})
);
cube.position.set(0, 2, 0);
scene.add(cube);

// HDR
const rgbeLoader = new RGBELoader();
rgbeLoader.load('../assets/dancing_hall_1k.hdr', function(hdr) {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
    // scene.background = hdr;
});

// Loader
const gltfLoader = new GLTFLoader();
gltfLoader.load('../assets/gba-sp.glb', function(gltf) {
    gltf.scene.children[1].rotation.x -= Math.PI / 2.5;
    scene.add(gltf.scene);
});

// Main render loop
const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

animate();