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

let arch, ruins;

let gun, gun_mixer;
let zombie;

let loadingManager;
let loadingScreen = {
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
    loadingScreen.box.position.set(0, 0, 5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    loadingManager = new THREE.LoadingManager(); 
    loadingManager.onProgress = (item, loaded, total) => {
        console.log(item, loaded, total);
    };

    loadingManager.onLoad = () => {
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
    

    fbx_loader = new THREE.FBXLoader(loadingManager);
    gltf_loader = new THREE.GLTFLoader(loadingManager);

    loadResources();
    render();
}

function loadResources() {
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
        arch.scale.set(0.02, 0.02, 0.02);
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
    const floorMaterial = new THREE.MeshBasicMaterial({wireframe: is_wire, color: "pink"});
    
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(envsize, envsize, 20, 20), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -1, 0);
    floor.receiveShadow = true

    return floor;
}

function loadEnvironmentWalls(material) {
    const wallMaterial = new THREE.MeshBasicMaterial({wireframe: is_wire, color: "grey"});
    const archPosMaterial = new THREE.MeshBasicMaterial({wireframe: is_wire, color: "black"});

    let pos = envsize / 4;// + envsize / 6;

    const wall1 = new THREE.Object3D();
    const wall_plane = new THREE.Mesh(new THREE.PlaneGeometry(15, envsize, 50, 50), wallMaterial);
    wall_plane.rotation.z = Math.PI / 2;
    
    let sp_idx = Math.floor(Math.random() * SPAWN_POINTS.length);
    let sp = SPAWN_POINTS[sp_idx];
    zombie.position.set(sp[0], sp[1], sp[2]);

    scene.add(zombie);

    // arch positions
    const ap1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 4, 10), archPosMaterial);
    ap1.rotation.y = Math.PI / 2;
    ap1.position.set(pos, 0, 0);
    const ap2 = ap1.clone();
    ap2.rotation.y = Math.PI / 2;
    ap2.position.set(-pos, 0, 0);
    ap1.name = "Spawn Position 1"
    ap2.name = "Spawn Position 2"
    
    wall_arch1 = arch.clone();
    wall_arch1.position.set(pos - 11, -1, 0);

    wall_arch2 = arch.clone();
    wall_arch2.position.set(-pos - 11, -1, 0);
    
    wall1.add(wall_plane);
    wall1.add(wall_arch1);
    wall1.add(wall_arch2);
    wall1.add(ap1);
    wall1.add(ap2);
    wall1.rotation.y = Math.PI;
    wall1.position.set(0, 0,  envsize / 2);

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
    //console.log(camera.position); 
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
        
        loadingScreen.counter += 0.01;
        if (loadingScreen.counter == 360) {
            loadingScreen.counter = 0;
        }
        // Lemniscate of Gerono
        loadingScreen.box.position.x = 7 * Math.cos(loadingScreen.counter);
        loadingScreen.box.position.y = 7 * Math.sin(2 * loadingScreen.counter) / 2;


        renderer.render(loadingScreen.scene, loadingScreen.camera);
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
    // camera.rotation.x -= event.movementY * player.turnSensitivity;
}


function onKeyUp(event) {
    keyboard[event.keyCode] = false
}

function onKeyDown(event) {
    keyboard[event.keyCode] = true
}

window.onload = init;
