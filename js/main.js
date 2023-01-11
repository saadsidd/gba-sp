import * as THREE from 'three';
import * as TWEEN from 'tween';
import { GUI } from 'dat.gui';
import {
    scene, camera, renderer, controls,
    loadingManager, rgbeLoader, gltfLoader
} from './init.js';

const path = '';            // for local
// const path = '../gba-sp/';  // for gh-pages

let gameboy;                                                    // for gltf
let powerSwitch, powerSwitchTween, powerLight, screenDisplay;   // for powering on/off animation
let screen, screenTween;                                        // for rotating screen angle
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

    // Populate parts object & grab meshes/materials for powering on/off animation
    gameboy.traverse(child => {
        if (child.isMesh && child.material.name[0] !== '_') {

            parts[child.material.name] = child.material.color;

            if (child.name === 'Power_Switch') {
                powerSwitch = child;
            }

            if (child.material.name === 'Power Light') {
                powerLight = child.material.color;
            }

            if (child.material.name === 'Screen Display') {
                screenDisplay = child;
            }

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

    // Avoiding attaching angle listener on power button
    const angles = [...document.getElementsByClassName('angle')].slice(0, 3);

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

    // Create startup screen plane from texture made of html video
    const startupVideo = document.getElementById('startup');
    const startupTexture = new THREE.VideoTexture(startup);
    startupTexture.generateMipmaps = true;
    startupTexture.minFilter = THREE.LinearMipMapLinearFilter;

    const startupScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1),
        new THREE.MeshBasicMaterial({color: 0x888888, map: startupTexture})
    );
    startupScreen.position.set(0, 1.06, 0.078);

    const poweringOn = new TWEEN.Tween(powerSwitch.position).to({z: -0.065}, 100).onComplete(() => powerSwitchTween = undefined);
    const poweringOff = new TWEEN.Tween(powerSwitch.position).to({z: 0}, 100).onComplete(() => powerSwitchTween = undefined);

    // Moves power switch, makes power light screen, and plays startup video
    document.getElementById('power-switch').addEventListener('click', function(event) {

        // Powering on
        if (!powerSwitchTween) {
            if (powerSwitch.position.z === 0) {
                event.currentTarget.classList.add('active');
                powerSwitchTween = poweringOn.start();
                powerLight.setHex(0x00FF00);
                startupVideo.play();
                screenDisplay.add(startupScreen);
        // Powering off
            } else {
                event.currentTarget.classList.remove('active');
                powerSwitchTween = poweringOff.start();
                powerLight.setHex(0x070707);
                startupVideo.pause();
                startupVideo.currentTime = 0;
                screenDisplay.remove(startupScreen);
            }

        }
        
    });

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
        'background': '#' + scene.background.getHexString(),
        'Body': '#FFFFFF',
        'Buttons': '#FFFFFF',
        'Text': '#FFFFFF',
    };
    for (const part in parts) {
        controller[part] = '#' + parts[part].getHexString();
    }

    // Callback for individual part onChange
    const setColor = function(value) {
        parts[this.property].setStyle(value);
        parts[this.property].convertSRGBToLinear();
    };

    // Callback for collective onChange
    const setAll = function(value) {
        for (const part of categories[this.property]) {
            parts[part].setStyle(value);
            parts[part].convertSRGBToLinear();
        }
    };
    
    // Scene GUI
    const sceneFolder = gui.addFolder('Scene');
    sceneFolder.addColor(controller, 'background').name('Background').onChange(value => scene.background.setStyle(value));
    sceneFolder.add(renderer, 'toneMappingExposure', 0.1, 1, 0.1).name('Brightness');

    // Body GUI
    const bodyFolder = gui.addFolder('Body');
    bodyFolder.addColor(controller, 'Body').name('All').onChange(setAll);
    bodyFolder.addColor(controller, 'Base Top').onChange(setColor);
    bodyFolder.addColor(controller, 'Base Bottom').onChange(setColor);
    bodyFolder.addColor(controller, 'Hinge').name('Base Hinges').onChange(setColor);
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

};

// Render Loop
const animate = () => {

    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);

}

animate();