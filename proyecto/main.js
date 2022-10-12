/**
 * main.js
 * 
 * @author <arsar1@inf.upv.es>
 *
 */

let renderer, scene, camera, stats;
let ortho_top_camera, L = 30;
let camera_direction, neg_z = new THREE.Vector3(0, 0, -1), max_y_rotation = 0.55;
let is_wire = true, is_flatshade = false;

let fbx_loader;
let gltf_loader;
let cemetery;

let gun, gun_mixer;


KEYS = {
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
};

let keyboard = {};

let player = {
    height: 1,
    speed : 0.7,
    turnSensitivity: 0.003,
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xAAAAAA);

    document.body.appendChild(renderer.domElement);

    scene =  new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, player.height, 0);
    camera.lookAt(100, player.height, 0);
    camera.rotation.order = "YXZ";

    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener('resize', onResize);
    window.addEventListener("mousedown", () => {
        document.body.requestPointerLock();
    });
    

    fbx_loader = new THREE.FBXLoader();
    gltf_loader = new THREE.GLTFLoader();

    loadScene();
    render();
}

function loadScene() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 200, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 0, 200, 100 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    fbx_loader.load("resources/player/gun/M4A1Rigged.fbx", object => {
        
        gun = object;

        gun_mixer = new THREE.AnimationMixer(gun)
        const action = gun_mixer.clipAction(gun.animations[11]);
        action.play();
        
        gun.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
            }
        });

        gun.scale.set(0.001, 0.001, 0.001);
        scene.add(object)
    });
    

    
    const axesHelper = new THREE.AxesHelper(20);
    axesHelper.position.set(80, player.height, 80);

    const environment = loadEnvironment();
    environment.position.set(0, 0, 0);

    scene.add(environment);
    scene.add(axesHelper);
}

function loadEnvironment() {
    const environment = new THREE.Object3D;

    const floor   = loadEnvironmentFloor(); 
    const objects = loadEnvironmentObjects(); 
    const walls   = loadEnvironmentWalls(); 
    
    environment.add(floor)
    walls.forEach(wall =>{
        wall.castShadow = true;
        environment.add(wall);
    }); 

    objects.forEach(object =>{
        object.castShadow = true;
        environment.add(object);
    }); 

    return environment;

}

function loadEnvironmentFloor() {
    const floorMaterial = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});
    
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 100, 100), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true

    return floor;
}

function loadEnvironmentWalls(material) {
    const wallMaterial = new THREE.MeshNormalMaterial({wireframe: is_wire, flatShading: is_flatshade});

    const wall1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 50, 50), wallMaterial);
    wall1.rotation.z = Math.PI / 2;
    wall1.position.set(0, 0, -200);

    const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 50, 50), wallMaterial);
    wall2.rotation.z = Math.PI / 2;
    wall2.rotation.y = Math.PI;
    wall2.position.set(0, 0,  200);

    const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 50, 50), wallMaterial);
    wall3.rotation.z = Math.PI / 2;
    wall3.rotation.y = Math.PI / 2;
    wall3.position.set(-200, 0, 0);

    const wall4 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 50, 50), wallMaterial);
    wall4.rotation.z = Math.PI / 2;
    wall4.rotation.y = -Math.PI / 2;
    wall4.position.set(200, 0, 0);

    return [wall1, wall2, wall3, wall4];
}

function loadEnvironmentObjects() {
    const cubeMaterial = new THREE.MeshBasicMaterial({wireframe: is_wire, color: "red"});
    const cube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 20, 20), cubeMaterial);
    cube.position.set(10, 10, 10);
        
    return [cube];
}

function updateFPSCamera() {
    if(keyboard[KEYS.W]){
		camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
		camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[KEYS.S]){
		camera.position.x += Math.sin(camera.rotation.y) * player.speed;
		camera.position.z += Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[KEYS.A]){
		camera.position.x -= Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		camera.position.z -= Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}
	if(keyboard[KEYS.D]){
		camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		camera.position.z += Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}
}

function updateGun() {
    gun.position.set(
        camera.position.x,
        camera.position.y,
        camera.position.z,
    );
    
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -camera.rotation.x,
        camera.rotation.y - Math.PI - Math.PI / 16,
        camera.rotation.z,
        "YXZ"
    ))

    gun.rotation.setFromQuaternion(quaternion);
    /*
    gun.rotation.set(
        -camera.rotation.x,
        camera.rotation.y - Math.PI // - Math.PI / 16,
        camera.rotation.z,
    );
    */
}

function update() {
    stats.begin();

    updateFPSCamera();
    if (gun)
        updateGun();
    
    if (gun_mixer)
        gun_mixer.update(1/40);
    stats.end();
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}


function onResize() {
    // Update cameras
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}


function onMouseMove(event) {
    camera_direction = camera.getWorldDirection(neg_z);
    
    if ((camera_direction.y < -max_y_rotation && event.movementY > 0) ||
        (camera_direction.y >  max_y_rotation && event.movementY < 0))
        return
    camera.rotation.y -= event.movementX * player.turnSensitivity;
    // camera.rotation.x -= event.movementY * player.turnSensitivity;
}


function onKeyUp(event) {
    keyboard[event.keyCode] = false
}

function onKeyDown(event) {
    keyboard[event.keyCode] = true
}

window.onload = init;
