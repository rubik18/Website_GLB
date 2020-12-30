import *as THREE from '../three/three.module.js'
import {GLTFLoader} from '../three/GLTFLoader.js'
import {OrbitControls} from '../three/OrbitControls.js';
import {GUI} from '../three/dat.gui.module.js';

let camera, scene, renderer, controls;

let ambientLight, dirLight;

let object, mixer, clock, actions;

let check1 = false;

let raycaster, mouse;

let params, folder;

var gui = new GUI();

let group;

function init() {
    _initGp();
    _loadGLTF();

    clock = new THREE.Clock();

    window.addEventListener( "mouseup", _mouseup, false );

    window.addEventListener( 'resize', onWindowResize, false );
}

function _initGp() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('white');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set(0, 0.5, 1);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    _light();
    _orbitControl();
    _plane();

}

function _light() {
    ambientLight = new THREE.AmbientLight( 0xffffff, 1 );
    scene.add(ambientLight)

    dirLight = new THREE.DirectionalLight( '#ffffff', 1.5 );
    dirLight.castShadow = true;
    scene.add(dirLight);

}

function _orbitControl() {
    controls = new OrbitControls( camera, renderer.domElement );
}

function _mouseup( event ) {
    group = [];
    group.push(object);
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects( group, true );

    if ( intersects.length > 0 ) {
        pauseContinue();
    }
}

function _plane() {
    const planeGeo = new THREE.PlaneBufferGeometry(100, 100);
    const planeMat = new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } );
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = - Math.PI / 2;
    plane.position.y = - 0.2;
    plane.receiveShadow = true;
    scene.add(plane);

    const grid = new THREE.GridHelper( 100, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );
}

function centralize (object) {
    let boundingBox = new THREE.Box3().setFromObject(object);

    let size = new THREE.Vector3();
    boundingBox.getSize(size);

    let scale = Math.max(size.x, size.y, size.z);
    object.scale.set(1/scale, 1/scale, 1/scale);

    let centerbox = new THREE.Vector3();
    boundingBox.setFromObject(object);

    let _centerbox = boundingBox.getCenter(centerbox);
    object.position.sub(_centerbox);
}

function _loadTexture() {
    var textureLoader = new THREE.TextureLoader();
    var text = textureLoader.load('../../data/12.jpg');
    // map.encoding = THREE.sRGBEncoding;
    text.flipY = false;

    return text;
}

function _loadGLTF() {
    var loader = new GLTFLoader();
    loader.load('../../data/Horse.glb', (gltf) => {
        object = gltf.scene;
        centralize(object);

        object.traverse((o) => {
            if(o.isMesh) {
                _guiMaterial(o);

                o.material.map = _loadTexture();
                o.castShadow = true;
                o.receiveShadow = true;
            }
        })
        
        _guiShadow();
        _guiAnimation();

        mixer = new THREE.AnimationMixer( object );
        actions = mixer.clipAction( gltf.animations[ 0 ] );
        actions.play();

        scene.add(object);
        }
        // , 
        // onProgress(), 
        // onError()
    );
}

function _guiMaterial(obj) {
    params = {
        color : '#ffffff',
    }

    folder = gui.addFolder('Material color');

    folder.addColor(params, 'color').onChange( function(colorValue) {
    obj.material.color.set(colorValue);
    });
}

function _guiAnimation() {
    params = {
        'pause/continue': pauseContinue,
    }

    folder = gui.addFolder('Pausing/Continue');
    
    folder.add(params, ('pause/continue'));

}

function _guiShadow() {
    params = {
        lightX: - 1,
        lightY: - 1,
        lightZ: - 1,
        color: '#ffffff',
        intensity: dirLight.intensity,
    };

    folder = gui.addFolder('Light direction');
    
    folder.add( params, 'lightX', - 1, 1 ).name( 'light direction x' ).onChange( function ( value ) {

        dirLight.position.x = value;

    } );

    folder.add( params, 'lightY', - 1, 1 ).name( 'light direction y' ).onChange( function ( value ) {

        dirLight.position.y = value;

    } );

    folder.add( params, 'lightZ', - 1, 1 ).name( 'light direction z' ).onChange( function ( value ) {

        dirLight.position.z = value;

    } );

    folder = gui.addFolder('Light color');

    folder.add(params, 'intensity', -0.5, 2).name('intensity').onChange((value) => {
        dirLight.intensity = value

    })

    folder.addColor( params, 'color', -1, 1 ).name( 'Light color' ).onChange((value) => {
        dirLight.color.set(value)
    })
}

function pauseContinue() {

    if (check1) {
        check1 = false;
        actions.enabled = true;
        unPauseAllActions();
    }
    else {
        check1 = true;
        pauseAllActions();
    }
}

function pauseAllActions() {

    actions.paused = true;

}

function unPauseAllActions() {

    actions.paused = false;
   
}

function onProgress( xhr ) {

    if ( xhr.lengthComputable ) {

        updateProgressBar( xhr.loaded / xhr.total );

        console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );

    }

}

function onError() {

    const message = "Error loading model";
    progressBarDiv.innerText = message;
    console.log( message );

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    animate();
}

function animate() {
    requestAnimationFrame( animate );

    if ( mixer ) {
        mixer.update( clock.getDelta() );
    }
    
    renderer.render(scene, camera);
}

init()
animate();