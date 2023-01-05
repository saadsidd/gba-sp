import * as THREE from 'three';
import * as TWEEN from 'tween';
import {
    scene, camera, renderer, controls,
    loadingManager, rgbeLoader, gltfLoader
} from './init.js';
import { path } from './settings.js';

let gameboy;
let screen, screenTween = undefined;
const parts = {};
let part = 'Main';
const categories = {
    'Main': ['Base Top', 'Base Bottom', 'Screen Top', 'Screen Bottom'],
    'Buttons': ['Button Dpad', 'Button A', 'Button B', 'Button L', 'Button R', 'Button Select', 'Button Start', 'Button Light', 'Power Switch', 'Volume Slider'],
    'Text': ['Button A Text', 'Button B Text', 'Button L Text', 'Button R Text', 'Button Light Symbol', 'Start Select Text'],
    'Other': ['Hinge', 'Screen Accents', 'Power Link Ports']
};

// DOM
const colorSelect = document.getElementById('color-select');
const partSelect = document.getElementById('part-select')
const angles = document.getElementsByClassName('angle');
const brightness = document.getElementById('brightness');

console.log(angles[0].value);

// LOAD
rgbeLoader.load(path + 'assets/dancing_hall_1k.hdr', hdr => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
});

gltfLoader.load(path + 'assets/gba-sp.glb', gltf => {
    gameboy = gltf.scene;
    screen = gameboy.children[1];
});

loadingManager.onLoad = () => {
    console.log('Loading Complete');
    setTimeout(() => {
        document.getElementById('loader-container').style.display = 'none';
        initGameboy();
        initListeners();
    }, 500);
};

// Add Gameboy to scene and tween (scale, rot)
const initGameboy = () => {

    gameboy.traverse(child => {
        if (child.isMesh) {
            if (child.material.name[0] !== '_') {
                parts[child.material.name] = child.material;
            }
        }
    });

    console.log(parts);

    gameboy.position.y = -1;
    gameboy.scale.set(0, 0, 0);
    scene.add(gameboy);

    new TWEEN.Tween({x: 0, y: 0, z: 0, rotY: 0})
    .to({x: 3, y: 3, z: 3, rotY: 2 * Math.PI}, 2000)
    .easing(TWEEN.Easing.Elastic.Out)
    .delay(500)
    .onUpdate(obj => {
        gameboy.scale.set(obj.x, obj.y, obj.z);
        gameboy.rotation.y = obj.rotY;
    })
    .start();

};

// Set listeners on DOM elements for color select, angle change
const initListeners = () => {

    colorSelect.addEventListener('input', (event) => {
        const pickedColor = event.target.value;

        if (part === 'Main' || part === 'Buttons' || part === 'Text' || part === 'Other') {
            for (const p of categories[part]) {
                parts[p].color.setStyle(pickedColor);
            }
        } else if (part === 'Background') {
            scene.background.setStyle(pickedColor);
        }
        else {
            parts[part].color.setStyle(pickedColor);
        }
    });

    partSelect.addEventListener('change', event => {
        part = event.target.value;
        if (part === 'Background') {
            colorSelect.value = '#' + scene.background.getHexString();
        } else {
            colorSelect.value = '#' + parts[part].color.getHexString();
        }
    });

    for (const angle of angles) {
        angle.addEventListener('click', event => {
            if (!screenTween) {
                const target = event.currentTarget;
                event.currentTarget.classList.add('active');

                screenTween = new TWEEN.Tween(screen.rotation)
                .to({x: parseFloat(target.value)}, 1000)
                .easing(TWEEN.Easing.Quadratic.In)
                .onComplete(() => {
                    screenTween = undefined;
                    target.classList.remove('active');
                })
                .start();
            }
        });
    }

    brightness.addEventListener('input', event => renderer.toneMappingExposure = parseFloat(event.target.value));

};

// Render Loop
const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

animate();