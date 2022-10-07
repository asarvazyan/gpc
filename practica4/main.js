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

init();
loadScene();
setupGUI();
render();

const KEYS = {
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    SPACE: 32,
}

function onDocumentKeyDown(event) {
    console.log(event.which);
    var key_code = event.which;
    
    if (key_code == KEYS.ARROW_DOWN) {
        robot.position.z += robot_attrs.z_speed;
    } else if (key_code == KEYS.ARROW_UP) {
        robot.position.z -= robot_attrs.z_speed;
    } else if (key_code == KEYS.ARROW_LEFT) {
        robot.position.x -= robot_attrs.x_speed;
    } else if (key_code == KEYS.ARROW_RIGHT) {
        robot.position.x += robot_attrs.x_speed;
    } else if (key_code == KEYS.SPACE) {
        robot.position.set(0, 0, 0);
    }
}


function loadClampTipGeometry() {
    const clampTipGeometry = new THREE.BufferGeometry();
    
    const clampTipVertices = new Float32Array([
        // Front 
         9.5,  -5,  0, // Bottom right small
         9.5,   5,  0, // Top right small
         9.5,  -5,  2, // Bottom left small
         9.5,   5,  2, // Top left small
        
        // Right
        -9.5, -10, -2, // Bottom right big
         9.5,  -5,  0, // Bottom right small
        -9.5,  10, -2, // Top right big
         9.5,   5,  0, // Top right small
        // Back
        -9.5, -10, -2, // Bottom right big
        -9.5,  10, -2, // Top right big
        -9.5, -10,  2, // Bottom left big
        -9.5,  10,  2, // Top left big
        // Left
        -9.5, -10,  2, // Bottom left big
         9.5,  -5,  2, // Bottom left small
        -9.5,  10,  2, // Top left big
         9.5,   5,  2, // Top left small
        // Top
        -9.5,  10, -2, // Top right big
         9.5,   5,  0, // Top right small
        -9.5,  10,  2, // Top left big
         9.5,   5,  2, // Top left small
        // Bottom
        -9.5, -10, -2, // Bottom right big
         9.5,  -5,  0, // Bottom right small
        -9.5, -10,  2, // Bottom left big
         9.5,  -5,  2, // Bottom left small
    ]);

    const normales = new Float32Array([
        // Front
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        
        // Right
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // Back
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // Left
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        
        // Top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // Bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
    ]);
    

    const clampTipIndices = [
        // Front
        0, 1, 2,
        3, 2, 1,
        // Right
        4, 6, 5,
        7, 5, 6,
        // Back
        8, 10, 9,
        11, 9, 10,
        // Left
        12, 13, 14,
        15, 14, 13,
        // Top
        16, 18, 17,
        19, 17, 18,
        // Bottom
        20, 21, 22, 
        23, 22, 21,
    ];

    clampTipGeometry.setIndex(clampTipIndices);
    clampTipGeometry.setAttribute('position', new THREE.BufferAttribute(clampTipVertices, 3));
    clampTipGeometry.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
    
    return clampTipGeometry;
}


function loadRobotClamp() {
    const clamp = new THREE.Object3D();
    const leftClampBox  = new THREE.Mesh(new THREE.BoxGeometry(19, 20, 4, 3, 3), robot_material);
    const rightClampBox = new THREE.Mesh(new THREE.BoxGeometry(19, 20, 4, 3, 3), robot_material);
    leftClampBox.position.set(  16, 0, -15);
    rightClampBox.position.set( 16, 0,  15);

    clamp.add(leftClampBox);
    clamp.add(rightClampBox);
    clamp.position.set(0, 80, 0);
    
    const clampTipGeometry = loadClampTipGeometry();

    const clampTipLeft = new THREE.Mesh(clampTipGeometry, robot_material);
    const clampTipRight = new THREE.Mesh(clampTipGeometry, robot_material);

    clampTipLeft.position.set( 35, 0, -15);
    clampTipRight.position.set(35, 0,  15);
    clampTipRight.rotation.x = Math.PI;

    clamp.add(clampTipRight);
    clamp.add(clampTipLeft);

    return clamp;
}

function loadRobotForearm() {
    const forearm = new THREE.Object3D();
    const forearmBase = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 32, 32), robot_material);
    const forearmNerve1 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), robot_material);
    const forearmNerve2 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), robot_material);
    const forearmNerve3 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), robot_material);
    const forearmNerve4 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), robot_material);
    const forearmTop = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 32, 32), robot_material);
    
    forearmNerve1.position.set( 10, 40,  10);
    forearmNerve2.position.set( 10, 40, -10);
    forearmNerve3.position.set(-10, 40,  10);
    forearmNerve4.position.set(-10, 40, -10);
    forearmTop.position.set(0, 80, 0);
    forearmTop.rotation.x = Math.PI / 2;
   
    forearm.add(forearmBase);
    forearm.add(forearmNerve1);
    forearm.add(forearmNerve2);
    forearm.add(forearmNerve3);
    forearm.add(forearmNerve4);
    forearm.add(forearmTop);
    forearm.position.set(0, 120, 0);
    
    const clamp = loadRobotClamp();
    forearm.add(clamp);

    return forearm;
}

function loadRobotArm() {
    const arm = new THREE.Object3D();
    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 32, 32), robot_material);
    const armTendon = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12, 32, 32), robot_material);
    const armTop = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 32), robot_material);
    
    armBase.position.set(0, 0, 0);
    armBase.rotation.z = -Math.PI / 2;
    armTendon.position.set(0, 60, 0);
    armTop.position.set(0, 120, 0);

    arm.add(armBase);
    arm.add(armTendon);
    arm.add(armTop);
    arm.position.set(0, 0, 0);

    const forearm = loadRobotForearm();
    arm.add(forearm);

    return arm;
}

function loadRobotBase() {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 32, 32), robot_material);
    base.position.set(0, 7.5, 0);

    const arm = loadRobotArm();
    base.add(arm);

    return base;
}

function loadRobot() {
    robot = new THREE.Object3D();
    const base = loadRobotBase();

    robot.add(base);

    return robot;
}

function setupGUI() {
    animation_controller = {
        rotation_base: 0,
        rotation_arm: 0,
        rotationY_forearm: 0,
        rotationZ_forearm: 0,
        rotation_clamp: 0,
        separation_clamp: 0,
        toggle_wire_solid: false,
        animate: function() { console.log("Animate!"); },
    };

    const gui = new lil.GUI();

    gui.title("Control Robot");

    gui.add(animation_controller, "rotation_base", -180, 180, 0.025).name("Giro Base");
    gui.add(animation_controller, "rotation_arm", -180, 180, 0.025).name("Giro Brazo"); // video shows less range?
    gui.add(animation_controller, "rotationY_forearm", -180, 180, 0.025).name("Giro Antebrazo Y");
    gui.add(animation_controller, "rotationZ_forearm", -180, 180, 0.025).name("Giro Antebrazo Z");
    gui.add(animation_controller, "rotation_clamp", -180, 180, 0.025).name("Giro Pinza");
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
    loadRobot();
    const floorMaterial = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.set(0, 0, 0);
    
    robot.rotation.y = Math.PI / 2; // so it looks good on ortho camera
    scene.add(robot);
    scene.add(floor);
}

function update() {
    ortho_top_camera.position.set(robot.position.x, 600, robot.position.z);
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
