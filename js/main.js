import * as THREE from 'three';
import * as TWEEN from 'tween';
import { GUI } from 'dat.gui';
import {
    scene, camera, renderer, controls,
    loadingManager, rgbeLoader, gltfLoader
} from './init.js';

const path = '';            // for local
// const path = '../gba-sp/';  // for gh-pages

let gameboy;
let screen, screenTween = undefined;
const parts = {};

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
        initGUI();
    }, 500);
};

// Add Gameboy to scene and tween (scale, rot)
const initGameboy = () => {

    // Populate parts object
    gameboy.traverse(child => {
        if (child.isMesh && child.material.name[0] !== '_') {
            parts[child.material.name] = child.material.color;
        }
    });

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

// Set listeners for angle change
const initListeners = () => {

    for (const angle of document.getElementsByClassName('angle')) {

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

};

const initGUI = () => {

    const categories = {
        'Body': ['Base Top', 'Base Bottom', 'Screen Top', 'Screen Bottom', 'Screen Accents', 'Hinge', 'Power Link Ports'],
        'Buttons': ['Button Dpad', 'Button A', 'Button B', 'Button L', 'Button R', 'Button Select', 'Button Start', 'Button Light', 'Power Switch', 'Volume Slider'],
        'Text': ['Button A Text', 'Button B Text', 'Button L Text', 'Button R Text', 'Button Light Symbol', 'Start Select Text']
    };

    const gui = new GUI();

    // Controller for adding color to GUI
    const controller = {
        'background': scene.background.getHex(),
        'Body': 0xFFFFFF,
        'Buttons': 0xFFFFFF,
        'Text': 0xFFFFFF,
    };
    for (const part in parts) {
        controller[part] = parts[part].getHex();
    }

    // Callback for individual part onChange
    const setColor = function(value) {
        parts[this.property].setHex(value);
    };

    // Callback for collective onChange
    const setAll = function(value) {
        for (const part of categories[this.property]) {
            parts[part].setHex(value);
        }
    };
    
    // Scene GUI
    const sceneFolder = gui.addFolder('Scene');
    sceneFolder.addColor(controller, 'background').name('Background').onChange(value => scene.background.setHex(value));
    sceneFolder.add(renderer, 'toneMappingExposure', 0, 1, 0.1).name('Brightness');

    // Body GUI
    const bodyFolder = gui.addFolder('Body');
    bodyFolder.addColor(controller, 'Body').name('All').onChange(setAll);
    bodyFolder.addColor(controller, 'Base Top').onChange(setColor);
    bodyFolder.addColor(controller, 'Base Bottom').onChange(setColor);
    bodyFolder.addColor(controller, 'Hinge').name('Base Hinge').onChange(setColor);
    bodyFolder.addColor(controller, 'Power Link Ports').name('Power/Link Ports').onChange(setColor);
    bodyFolder.addColor(controller, 'Screen Top').onChange(setColor);
    bodyFolder.addColor(controller, 'Screen Bottom').onChange(setColor);
    bodyFolder.addColor(controller, 'Screen Accents').onChange(setColor);

    // Buttons GUI
    const buttonsFolder = gui.addFolder('Buttons');
    buttonsFolder.addColor(controller, 'Buttons').name('All').onChange(setAll);
    buttonsFolder.addColor(controller, 'Button Dpad').name('D-Pad').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button A').name('A').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button B').name('B').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button R').name('R').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button L').name('L').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button Select').name('Select').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button Start').name('Start').onChange(setColor);
    buttonsFolder.addColor(controller, 'Button Light').name('Light').onChange(setColor);
    buttonsFolder.addColor(controller, 'Power Switch').onChange(setColor);
    buttonsFolder.addColor(controller, 'Volume Slider').onChange(setColor);

    // Text GUI
    const textFolder = gui.addFolder('Text');
    textFolder.addColor(controller, 'Text').name('All').onChange(setAll);
    textFolder.addColor(controller, 'Button A Text').name('A').onChange(setColor);
    textFolder.addColor(controller, 'Button B Text').name('B').onChange(setColor);
    textFolder.addColor(controller, 'Button R Text').name('R').onChange(setColor);
    textFolder.addColor(controller, 'Button L Text').name('L').onChange(setColor);
    textFolder.addColor(controller, 'Button Light Symbol').name('Light Symbol').onChange(setColor);
    textFolder.addColor(controller, 'Start Select Text').name('Start/Select').onChange(setColor);

    gui.close();

};

// Render Loop
const animate = () => {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
    // console.log(camera.position.x.toFixed(1), camera.position.y.toFixed(1), camera.position.z.toFixed(1));
}

animate();