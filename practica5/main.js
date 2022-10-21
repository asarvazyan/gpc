/**
 * main.js
 * 
 * Lab 5 of GPC
 * @author <arsar1@inf.upv.es>
 *
 */

import {TWEEN} from "../r140/lib/tween.module.min.js";

let renderer, scene, camera;
let ortho_top_camera, L = 100;
let robot, animation_controller;
let is_wire = false, prev_is_wire = is_wire;
let is_flatshade = false;

let textureLoader;

let gui;

let robot_attrs = {
    z_speed: 5,
    x_speed: 5,
}

const KEYS = {
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    SPACE: 32,
}

init();
loadScene();
setupGUI();
render();


function to_rad(deg) {
    return deg / 180 * Math.PI;
}

function to_deg(rad) {
    return rad / Math.PI * 180;
}

function onDocumentKeyDown(event) {
    var key_code = event.which;
    
    if (key_code == KEYS.ARROW_DOWN) {
        robot.geometry.position.z += robot_attrs.z_speed;
    } else if (key_code == KEYS.ARROW_UP) {
        robot.geometry.position.z -= robot_attrs.z_speed;
    } else if (key_code == KEYS.ARROW_LEFT) {
        robot.geometry.position.x -= robot_attrs.x_speed;
    } else if (key_code == KEYS.ARROW_RIGHT) {
        robot.geometry.position.x += robot_attrs.x_speed;
    } else if (key_code == KEYS.SPACE) {
        robot.geometry.position.set(0, 0, 0);
    }
}

function animate() {
    console.log("Animate!");

    const moveBase = new TWEEN.Tween(robot.geometry.getObjectByName("base").rotation)
                        .to({y: to_rad(-130) }, 1000)
                        .onUpdate(val => { animation_controller.rotation_base = to_deg(val.y)} );

    const moveClamp = new TWEEN.Tween(robot.geometry.getObjectByName("clamp").rotation)
                        .to({z: to_rad(30)}, 500)
                        .onUpdate(val => { animation_controller.rotation_clamp = to_deg(val.z)} );
    
    const translateRobot = new TWEEN.Tween(robot.geometry.position)
                        .to({ x: 100, z: 100}, 1500)
                        .easing(TWEEN.Easing.Quadratic.In);

    const moveArm = new TWEEN.Tween(robot.geometry.getObjectByName("arm").rotation)
                        .to({ z: Math.PI / 6 }, 1000)
                        .interpolation(TWEEN.Interpolation.Bezier)
                        .easing(TWEEN.Easing.Quadratic.In)
                        .onUpdate(val => { animation_controller.rotation_arm = to_deg(val.z) })
                        .delay(500);
    
    const moveForearmZ = new TWEEN.Tween(robot.geometry.getObjectByName("forearm").rotation)
                        .to({ z: -Math.PI / 6}, 1500)
                        .interpolation(TWEEN.Interpolation.Bezier)
                        .onUpdate(val => { animation_controller.rotationZ_forearm = to_deg(val.z)})
                        .delay(500)

    const moveForearmY = new TWEEN.Tween(robot.geometry.getObjectByName("forearm").rotation)
                        .to({ y: -Math.PI / 4}, 1500)
                        .interpolation(TWEEN.Interpolation.Bezier)
                        .easing(TWEEN.Easing.Quadratic.In)
                        .onUpdate(val => { animation_controller.rotationY_forearm = to_deg(val.y)})

    const moveForearmYBack = new TWEEN.Tween(robot.geometry.getObjectByName("forearm").rotation)
                        .to({ y: to_rad(20)}, 1500)
                        .interpolation(TWEEN.Interpolation.Bezier)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(val => { animation_controller.rotationY_forearm = to_deg(val.y)})
                        
    const rotateClamps = new TWEEN.Tween(robot.geometry.getObjectByName("clamp").rotation)
                        .to({ z: to_rad(100)}, 400)
                        .onUpdate(val => {animation_controller.rotation_clamp = to_deg(val.z)})
        
    moveBase.chain(moveClamp);
    moveClamp.chain(translateRobot);
    translateRobot.chain(moveArm);
    moveArm.chain(moveForearmZ);
    moveForearmZ.chain(moveForearmY);
    moveForearmY.chain(moveForearmYBack);
    moveForearmYBack.chain(rotateClamps);

    moveBase.start();
}

function setupGUI() {
    animation_controller = {
        rotation_base: 0,
        rotation_arm: 0,
        rotationY_forearm: 0,
        rotationZ_forearm: 0,
        rotation_clamp: 0,
        separation_clamp: 10,
        toggle_wire_solid: false,
        animate: animate,
    };

    gui = new lil.GUI();

    gui.title("Control Robot");

    gui.add(animation_controller, "rotation_base", -180, 180, 0.025).name("Giro Base")
        .onChange(value => { 
            robot.geometry.getObjectByName("base").rotation.y = to_rad(animation_controller.rotation_base)
        }).listen();

    gui.add(animation_controller, "rotation_arm", -45, 45, 0.025).name("Giro Brazo")
        .onChange(value => {
            robot.geometry.getObjectByName("arm").rotation.z = to_rad(animation_controller.rotation_arm);
        }).listen();

    gui.add(animation_controller, "rotationY_forearm", -180, 180, 0.025).name("Giro Antebrazo Y")
        .onChange(value => {
            robot.geometry.getObjectByName("forearm").rotation.y = to_rad(animation_controller.rotationY_forearm);
        }).listen();

    gui.add(animation_controller, "rotationZ_forearm", -90, 90, 0.025).name("Giro Antebrazo Z")
        .onChange(value =>  {
            robot.geometry.getObjectByName("forearm").rotation.z = to_rad(animation_controller.rotationZ_forearm);
        }).listen();

    gui.add(animation_controller, "rotation_clamp", -40, 220, 0.025).name("Giro Pinza")
        .onChange(value =>  {
            robot.geometry.getObjectByName("clamp").rotation.z = to_rad(animation_controller.rotation_clamp);
        }).listen();
    gui.add(animation_controller, "separation_clamp", 0, 15, 0.025).name("Separacion Pinza")
        .onChange(value =>  {
            robot.geometry.getObjectByName("clampBoxLeft").position.z = -animation_controller.separation_clamp;
            robot.geometry.getObjectByName("clampTipLeft").position.z = -animation_controller.separation_clamp;
            robot.geometry.getObjectByName("clampBoxRight").position.z = animation_controller.separation_clamp;
            robot.geometry.getObjectByName("clampTipRight").position.z = animation_controller.separation_clamp;
        }).listen();

    gui.add(animation_controller, "toggle_wire_solid").name("Alambres");
    gui.add(animation_controller, "animate").name("Anima");
}

function loadLights() {
    const ambient = new THREE.AmbientLight(0x33333);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    directional.position.set(0, 250, 0);
    directional.castShadow = true;
    scene.add(directional);
    
    const focal = new THREE.SpotLight(0xFFFFFF, 0.8);
    focal.position.set(100, 400, 100);
    focal.target.position.set(0, 250, 0);
    focal.angle = Math.PI / 4;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    focal.shadow.camera.far = 20;
    focal.shadow.camera.fov = 80;
    scene.add(focal);
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.autoClear = false;
    renderer.setClearColor(0xAAAAAA);

    document.body.appendChild(renderer.domElement);

    scene =  new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1600);
    camera.position.set(250, 350, 200);
    camera.lookAt(0, 50, 0);
    
    const ar = window.innerWidth / window.innerHeight; // Aspect Ratio
    
    ortho_top_camera = new THREE.OrthographicCamera(-L, L, L, -L, 300, 1000);

    ortho_top_camera.position.set(0, 600, 0);
    ortho_top_camera.lookAt(0, 0, 0);
    ortho_top_camera.up = new THREE.Vector3(0, 0, -1);

    loadLights();

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 500;
    controls.minDistance = 50;
    controls.update();

    window.addEventListener("keydown", onDocumentKeyDown, false);
}

function loadScene() {
    textureLoader = new THREE.TextureLoader().setPath("textures/");
    
    const environmentMap = new THREE.CubeTextureLoader().setPath("textures/cubemap/").load(
                    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]
            )
    const room = new THREE.Mesh(new THREE.BoxGeometry(1500, 1500, 1500),
                    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]
        .map((value, index, list) => {
            return new THREE.MeshBasicMaterial({
                map: textureLoader.load("cubemap/"+value),
                side: THREE.BackSide,
            })
        })
    )
    //room.translateY(900);
    scene.add(room);

    //scene.background = environmentMap;
    //scene.environment = environmentMap;

    const floorDiffuse = textureLoader.load("wood_grain/Wood_Grain_DIFF.png")
    const floorRough = textureLoader.load("wood_grain/Wood_Grain_NRM.png")
    const floorNormal = textureLoader.load("wood_grain/Wood_Grain_NRM.png")

    const floorMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load("wood_grain/Wood_Grain_DIFF.png"),
        normalMap: textureLoader.load("wood_grain/Wood_Grain_NRM.png"),
        bumpMap: textureLoader.load("wood_grain/Wood_Grain_NRM.png"),
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.set(0, 0, 0);
    
    robot = new Robot(textureLoader, environmentMap);
    robot.geometry.rotation.y = Math.PI / 2; // so it looks good on ortho camera
    scene.add(robot.geometry);
    scene.add(floor);
}

function updateRobot() {
    robot.geometry.getObjectByName("base").rotation.y = to_rad(animation_controller.rotation_base);
    robot.geometry.getObjectByName("arm").rotation.z = to_rad(animation_controller.rotation_arm);
    robot.geometry.getObjectByName("forearm").rotation.y = to_rad(animation_controller.rotationY_forearm);
    robot.geometry.getObjectByName("forearm").rotation.z = to_rad(animation_controller.rotationZ_forearm);
    robot.geometry.getObjectByName("clamp").rotation.z = to_rad(animation_controller.rotation_clamp);
    

    robot.geometry.getObjectByName("clampTipLeft").position.z = -animation_controller.separation_clamp;
    robot.geometry.getObjectByName("clampBoxLeft").position.z = -animation_controller.separation_clamp;
    robot.geometry.getObjectByName("clampTipRight").position.z = animation_controller.separation_clamp;
    robot.geometry.getObjectByName("clampBoxRight").position.z = animation_controller.separation_clamp;
}

function update(time) {
    TWEEN.update(time);
    ortho_top_camera.position.set(robot.geometry.position.x, 600, robot.geometry.position.z);

    if (is_wire != animation_controller.toggle_wire_solid) {
        is_wire = animation_controller.toggle_wire_solid;
    }

    //robot_material = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    //robot.setMaterial(robot_material);
    if (is_wire != prev_is_wire) {
        robot.toggleWireframe();
    }
    prev_is_wire = is_wire;

    updateRobot();


}

function render(time) {
    requestAnimationFrame(render);

    update(time);

    renderer.clear();
    
    const ortho_size = Math.min(window.innerWidth / 4, window.innerHeight / 4);
    renderer.setViewport(0, window.innerHeight - ortho_size, ortho_size, ortho_size);
    renderer.render(scene, ortho_top_camera);

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    // Update cameras
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    ortho_top_camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
