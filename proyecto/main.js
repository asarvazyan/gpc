/**
 * main.js
 * 
 * @author <arsar1@inf.upv.es>
 *
 */

let renderer, scene, camera, stats;
let ortho_top_camera, L = 30;
let camera_direction, neg_z = new THREE.Vector3(0, 0, -1), max_y_rotation = 0.55;
let envsize = 60;

let is_wire = false, is_flatshade = false;

let fbx_loader;
let gltf_loader;
let texture_loader, textures = {};

let arch, ruins;

let gun, gun_mixer;
let zombie;

let loading_manager;
let loading_screen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100),
    box: new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({color: 0x4444ff}),
    ),
    counter: 0,
};

let resources_loaded = false;

const KEYS = {
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

const SPAWN_POINTS = [
    [ 31, -1,  16],
    [ 31, -1, -16],
    [-31, -1,  16],
    [-31, -1,  16],
    [-31, -1, -16],
    [ 16, -1,  31],
    [ 16, -1, -31],
    [-16, -1,  31],
    [-16, -1, -31],
];

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xAAAAAA);

    document.body.appendChild(renderer.domElement);

    // Loading Screen
    loading_screen.box.position.set(0, 0, 5);
    loading_screen.camera.lookAt(loading_screen.box.position);
    loading_screen.scene.add(loading_screen.box);

    loading_manager = new THREE.LoadingManager(); 
    loading_manager.onProgress = (item, loaded, total) => {
        console.log(item, loaded, total);
    };

    loading_manager.onLoad = () => {
        console.log("All resources loaded");
        resources_loaded = true;

        loadScene();
        //render();
    };

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
    
    texture_loader = new THREE.TextureLoader(loading_manager).setPath("resources/");

    fbx_loader = new THREE.FBXLoader(loading_manager);
    gltf_loader = new THREE.GLTFLoader(loading_manager);

    loadResources();
    render();
}

function loadTextures() {
    textures["wall"] = {};
    textures["wall"].map = texture_loader.load("environment/wall/Old_Rocks_DIFF.png");
    textures["wall"].normalMap = texture_loader.load("environment/wall/Old_Rocks_NRM.png");
    textures["wall"].bumpMap = texture_loader.load("environment/wall/Old_Rocks_DISP.png");

    textures["wall"].map.repeat.set(10, 3);
    textures["wall"].normalMap.repeat.set(10, 3);
    textures["wall"].bumpMap.repeat.set(10, 3);
    textures["wall"].map.wrapS = THREE.RepeatWrapping;
    textures["wall"].normalMap.wrapS = THREE.RepeatWrapping;
    textures["wall"].bumpMap.wrapS = THREE.RepeatWrapping;
    textures["wall"].map.wrapT = THREE.RepeatWrapping;
    textures["wall"].normalMap.wrapT = THREE.RepeatWrapping;
    textures["wall"].bumpMap.wrapT = THREE.RepeatWrapping;
    
    textures["floor"] = {};
    textures["floor"].map = texture_loader.load("environment/floor/Grass_Paver_Diamond_DIFF.jpg");
    textures["floor"].normalMap = texture_loader.load("environment/wall/Grass_Paver_Diamond_NRM.jpg");
    textures["floor"].bumpMap = texture_loader.load("environment/wall/Grass_Paver_Diamond_DISP.jpg");

    textures["floor"].map.repeat.set(10, 10);
    textures["floor"].normalMap.repeat.set(10, 10);
    textures["floor"].bumpMap.repeat.set(10, 10);
    textures["floor"].map.wrapS = THREE.RepeatWrapping;
    textures["floor"].normalMap.wrapS = THREE.RepeatWrapping;
    textures["floor"].bumpMap.wrapS = THREE.RepeatWrapping;
    textures["floor"].map.wrapT = THREE.RepeatWrapping;
    textures["floor"].normalMap.wrapT = THREE.RepeatWrapping;
    textures["floor"].bumpMap.wrapT = THREE.RepeatWrapping;

    textures["ceil"] = {};
    textures["ceil"].map = texture_loader.load("environment/ceil/ScavengedCorrugatedMetalWall_basecolor.png");
    textures["ceil"].normalMap = texture_loader.load("environment/ceil/ScavengedCorrugatedMetalWall_normal.png");
    textures["ceil"].bumpMap = texture_loader.load("environment/ceil/ScavengedCorrugatedMetalWall_height.png");

    textures["ceil"].map.repeat.set(6, 6);
    textures["ceil"].normalMap.repeat.set(6, 6);
    textures["ceil"].bumpMap.repeat.set(6, 6);
    textures["ceil"].map.wrapS = THREE.RepeatWrapping;
    textures["ceil"].normalMap.wrapS = THREE.RepeatWrapping;
    textures["ceil"].bumpMap.wrapS = THREE.RepeatWrapping;
    textures["ceil"].map.wrapT = THREE.RepeatWrapping;
    textures["ceil"].normalMap.wrapT = THREE.RepeatWrapping;
    textures["ceil"].bumpMap.wrapT = THREE.RepeatWrapping;
}

function loadResources() {

    loadTextures();

    /*
    gltf_loader.load("resources/environment/centerpiece/source/Unity2Skfb.gltf", object => {
        ruins = object.scene;
        ruins.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
    });

    */

    fbx_loader.load("resources/zombies/Zombie_Running.fbx", object => {
        zombie = object;
        zombie.scale.set(0.02, 0.02, 0.02);
        zombie.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
    });

    fbx_loader.load("resources/environment/arch/source/arch.FBX", object => {
        arch = object;
        arch.scale.set(0.02, 0.02, 0.04);
        arch.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
            }
        });
    });

    fbx_loader.load("resources/player/gun/M4A1Rigged.fbx", object => {
        gun = object;
        gun.scale.set(0.001, 0.001, 0.001);

        gun_mixer = new THREE.AnimationMixer(gun)
        const action = gun_mixer.clipAction(gun.animations[0]);
        action.play();
        
        gun.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
            }
        });

    });
}

function loadScene() {
    const ambient = new THREE.AmbientLight(0x33333);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xFFFFFF, 0.3);
    directional.position.set(0, 100, 0);
    directional.castShadow = true;
    scene.add(directional);

    
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
    const ceil    = loadEnvironmentCeiling();
    const objects = loadEnvironmentObjects(); 
    const walls   = loadEnvironmentWalls(); 
    
    environment.add(floor);
    environment.add(ceil);

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

function loadEnvironmentCeiling() {
    const floorMaterial = new THREE.MeshPhongMaterial({
        map: textures["ceil"].map,
        normalMap: textures["ceil"].normalMap,
        bumpMap: textures["ceil"].bumpMap,
    });
    
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(envsize, envsize, 20, 20), floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.set(0, 8, 0);
    floor.receiveShadow = true;

    return floor;
}

function loadEnvironmentFloor() {
    const floorMaterial = new THREE.MeshPhongMaterial({
        map: textures["floor"].map,
        normalMap: textures["floor"].normalMap,
        bumpMap: textures["floor"].bumpMap,
    });
    
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(envsize, envsize, 20, 20), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -1, 0);
    floor.receiveShadow = true

    return floor;
}

function loadEnvironmentWalls(material) {
    const wallMaterial = new THREE.MeshPhongMaterial({
        map: textures["wall"].map,
        normalMap: textures["wall"].normalMap,
        bumpMap: textures["wall"].bumpMap,
    });
    const archPosMaterial = new THREE.MeshBasicMaterial({wireframe: is_wire, color: "red"});

    let pos = envsize / 4;// + envsize / 6;

    const wall1 = new THREE.Object3D();
    const wall_plane = new THREE.Mesh(new THREE.PlaneGeometry(envsize, 20, 50, 50), wallMaterial);
    
    let sp_idx = Math.floor(Math.random() * SPAWN_POINTS.length);
    let sp = SPAWN_POINTS[sp_idx];
    //zombie.position.set(sp[0], sp[1], sp[2]);
    zombie.position.set(10, -1, 10);

    scene.add(zombie);

    // arch positions
    const ap1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 4, 10), archPosMaterial);
    //const ap1 = new THREE.RectAreaLight(0xff0000, 10, 10, 4);

    ap1.rotation.y = Math.PI / 2;
    ap1.position.set(pos, 0, 0);
    const ap2 = ap1.clone();
    ap2.rotation.y = Math.PI / 2;
    ap2.position.set(-pos, 0, 0);
    ap1.name = "Spawn Position 1"
    ap2.name = "Spawn Position 2"
    
    wall_arch1 = arch.clone();
    wall_arch1.position.set(pos - 11, -1, -0.5);

    wall_arch2 = arch.clone();
    wall_arch2.position.set(-pos - 11, -1, -0.5);
    
    wall1.add(wall_plane);
    wall1.add(wall_arch1);
    wall1.add(wall_arch2);
    wall1.add(ap1);
    wall1.add(ap2);
    wall1.rotation.y = Math.PI;
    wall1.position.set(0, 0,  envsize / 2);

    //const a1help = new THREE.RectAreaLightHelper(a1p);
    //a1help.add(a1p);

    const wall2 = wall1.clone();
    wall2.rotation.y = Math.PI;
    wall2.position.set(0, 0, -envsize / 2);
    
    const wall3 = wall1.clone(); 
    wall3.rotation.y = Math.PI / 2;
    wall3.position.set(-envsize / 2, 0, 0);

    const wall4 = wall1.clone();
    wall4.rotation.y = -Math.PI / 2;
    wall4.position.set(envsize / 2, 0, 0);

    return [wall1, wall2, wall3, wall4];
}

function loadEnvironmentObjects() {
    //arch.position.set(0, 0, 0);
    //arch.scale.set(0.02, 0.02, 0.02);

    //gun.scale.set(0.001, 0.001, 0.001);

    //ruins.position.set(0, -1, 0);
    //ruins.scale.set(0.2, 0.2, 0.2);
    //scene.add(ruins);
        
    return [gun] //,ruins];
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
    if (resources_loaded === false) {
        requestAnimationFrame(render);
        
        loading_screen.counter += 0.01;
        if (loading_screen.counter == 360) {
            loading_screen.counter = 0;
        }
        // Lemniscate of Gerono
        loading_screen.box.position.x = 7 * Math.cos(loading_screen.counter);
        loading_screen.box.position.y = 7 * Math.sin(2 * loading_screen.counter) / 2;


        renderer.render(loading_screen.scene, loading_screen.camera);
        return;
    }
        
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
    camera.rotation.x -= event.movementY * player.turnSensitivity;
}


function onKeyUp(event) {
    keyboard[event.keyCode] = false
}

function onKeyDown(event) {
    keyboard[event.keyCode] = true
}

window.onload = init;
