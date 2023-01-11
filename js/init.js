import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(12, 3, 12);

// RENDERER
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);
renderer.toneMappingExposure = 0.7;

// SCREEN RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

// ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 4;
controls.maxDistance = 25;
controls.enablePan = true;
controls.enableDamping = true;

// LOADERS
const loadingManager = new THREE.LoadingManager();
const rgbeLoader = new RGBELoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

export {
    scene,
    camera,
    renderer,
    controls,

    loadingManager,
    rgbeLoader,
    gltfLoader
};