/**
 * main.js
 * 
 * Lab 4 of GPC
 * @author <arsar1@inf.upv.es>
 *
 */

let renderer, scene, camera;
let ortho_top_camera, L = 30;
let robot, animation_controller;
let is_wire = false;
let is_flatshade = false;
let robot_material;

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

    const gui = new lil.GUI();

    gui.title("Control Robot");

    gui.add(animation_controller, "rotation_base", -180, 180, 0.025).name("Giro Base");
    gui.add(animation_controller, "rotation_arm", -45, 45, 0.025).name("Giro Brazo"); // video shows less range?
    gui.add(animation_controller, "rotationY_forearm", -180, 180, 0.025).name("Giro Antebrazo Y");
    gui.add(animation_controller, "rotationZ_forearm", -90, 90, 0.025).name("Giro Antebrazo Z");
    gui.add(animation_controller, "rotation_clamp", -40, 220, 0.025).name("Giro Pinza");
    gui.add(animation_controller, "separation_clamp", 0, 15, 0.025).name("Separacion Pinza");
    gui.add(animation_controller, "toggle_wire_solid").name("Alambres");
    gui.add(animation_controller, "animate").name("Anima");
}


function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.autoClear = false;
    renderer.setClearColor(0xAAAAAA);

    document.body.appendChild(renderer.domElement);

    scene =  new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(250, 350, 200);
    camera.lookAt(0, 50, 0);
    
    const ar = window.innerWidth / window.innerHeight; // Aspect Ratio
    
    ortho_top_camera = new THREE.OrthographicCamera(-L, L, L, -L, 300, 1000);

    ortho_top_camera.position.set(0, 600, 0);
    ortho_top_camera.lookAt(0, 0, 0);
    ortho_top_camera.up = new THREE.Vector3(0, 0, -1);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 500;
    controls.minDistance = 50;
    controls.update();

    window.addEventListener("keydown", onDocumentKeyDown, false);
}

function loadScene() {
    robot_material = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    robot = new Robot(robot_material);

    const floorMaterial = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.set(0, 0, 0);
    
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

function update() {
    ortho_top_camera.position.set(robot.geometry.position.x, 600, robot.geometry.position.z);

    if (is_wire != animation_controller.toggle_wire_solid) {
        is_wire = animation_controller.toggle_wire_solid;
    }

    robot_material = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    robot.setMaterial(robot_material);

    updateRobot() 


}

function render() {
    requestAnimationFrame(render);
    update();

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
