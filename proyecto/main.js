/**
 * main.js
 * 
 * @author <arsar1@inf.upv.es>
 *
 */

// Global Scene
let renderer, scene, camera, stats;
let ortho_top_camera, L = 30;

// Loaders
let fbx_loader;
let gltf_loader;
let texture_loader, textures = {};
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

// Game models
let arch, gun, zombie;
let gun_mixer;

// Game utils
let camera_direction, neg_z = new THREE.Vector3(0, 0, -1), max_y_rotation = 0.55;
let envsize = 60;
let keyboard = {};

let player = {
    height: 2.5,
    speed : 0.7,
    turn_sensitivity: 0.003,
}

let zombies_current_round = [];
let zombies_current_round_states = []; // 0 = dead, 1 = alive and running toward player
let counter_next_round = 0;
const TO_NEXT_ROUND = 200;

// Game constants
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
const cloneFbx = (fbx) => {
    const clone = fbx.clone(true)
    clone.animations = fbx.animations
    clone.skeleton = { bones: [] }

    const skinnedMeshes = {}

    fbx.traverse(node => {
        if (node.isSkinnedMesh) {
            skinnedMeshes[node.name] = node
        }
    })

    const cloneBones = {}
    const cloneSkinnedMeshes = {}

    clone.traverse(node => {
        if (node.isBone) {
            cloneBones[node.name] = node
        }

        if (node.isSkinnedMesh) {
            cloneSkinnedMeshes[node.name] = node
        }
    })

    for (let name in skinnedMeshes) {
        const skinnedMesh = skinnedMeshes[name]
        const skeleton = skinnedMesh.skeleton
        const cloneSkinnedMesh = cloneSkinnedMeshes[name]

        const orderedCloneBones = []

        for (let i=0; i<skeleton.bones.length; i++) {
            const cloneBone = cloneBones[skeleton.bones[i].name]
            orderedCloneBones.push(cloneBone)
        }

        cloneSkinnedMesh.bind(
            new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
            cloneSkinnedMesh.matrixWorld)

        // For animation to work correctly:
        clone.skeleton.bones.push(cloneSkinnedMesh)
        clone.skeleton.bones.push(...orderedCloneBones)
    }

    return clone
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);

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

    scene =  new THREE.Scene();

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

    textures["wall"].map = texture_loader.load("environment/wall/MetalPipeWallRusty_basecolor.png");
    textures["wall"].normalMap = texture_loader.load("environment/wall/MetalPipeWallRusty_normal.png");
    textures["wall"].bumpMap = texture_loader.load("environment/wall/MetalPipeWallRusty_height.png");
    
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

function loadLights() {
    const ambient = new THREE.AmbientLight(0x33333);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directional.position.set(0, 100, 0);
    directional.castShadow = true;
    scene.add(directional);

    // One focal in the center
    const focal = new THREE.SpotLight(0xFF0000, 0.3);
    focal.position.set(0, 6, 0);
    focal.target.position.set(0, -1, 0);
    focal.angle = Math.PI / 4;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    focal.shadow.camera.far = 5;
    focal.shadow.camera.fov = 10;
    scene.add(focal);

    // One focal at each corner
    const focal1 = new THREE.SpotLight(0xFF0000, 0.3);
    focal1.position.set(29.5, 7, 29.5);
    focal1.target.position.set(0, 0, 0);
    focal1.angle = Math.PI / 4;
    focal1.penumbra = 0.3;
    focal1.castShadow = true;
    focal1.shadow.camera.far = 20;
    focal1.shadow.camera.fov = 80;
    scene.add(focal1);

    const focal2 = new THREE.SpotLight(0xFF0000, 0.3);
    focal2.position.set(-29.5, 7, 29.5);
    focal2.target.position.set(0, 0, 0);
    focal2.angle = Math.PI / 4;
    focal2.penumbra = 0.3;
    focal2.castShadow = true;
    focal2.shadow.camera.far = 20;
    focal2.shadow.camera.fov = 80;
    scene.add(focal2);

    const focal3 = new THREE.SpotLight(0xFF0000, 0.3);
    focal3.position.set(29.5, 7, -29.5);
    focal3.target.position.set(0, 0, 0);
    focal3.angle = Math.PI / 4;
    focal3.penumbra = 0.3;
    focal3.castShadow = true;
    focal3.shadow.camera.far = 20;
    focal3.shadow.camera.fov = 80;
    scene.add(focal3);

    const focal4 = new THREE.SpotLight(0xFF0000, 0.3);
    focal4.position.set(-29.5, 7, -29.5);
    focal4.target.position.set(0, 0, 0);
    focal4.angle = Math.PI / 4;
    focal4.penumbra = 0.3;
    focal4.castShadow = true;
    focal4.shadow.camera.far = 20;
    focal4.shadow.camera.fov = 80;
    scene.add(focal4);
    
    /*
    scene.add(new THREE.SpotLightHelper(focal));
    scene.add(new THREE.SpotLightHelper(focal1));
    scene.add(new THREE.SpotLightHelper(focal2));
    scene.add(new THREE.SpotLightHelper(focal3));
    scene.add(new THREE.SpotLightHelper(focal4));
    */
}

function loadScene() {
    loadLights();
    /*
    let sp = SPAWN_POINTS[0];
    //zombie.position.set(sp[0], sp[1], sp[2]);
    zombie.position.set(10, -1, 10);
    
    sp = SPAWN_POINTS[1];
    let zombie2 = cloneFbx(zombie);
    zombie2.position.set(sp[0], sp[1], sp[2]);

    scene.add(zombie);
    scene.add(zombie2);
    */
    
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
    const objects = [gun]; 
    const walls   = loadEnvironmentWalls(); 
    zombies_current_round = loadFirstRound();

    floor.receiveShadow = true;
    ceil.receiveShadow = true;
    
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

    zombies_current_round.forEach(z =>{
        z.castShadow = true;
        environment.add(z);
    }); 

    return environment;
}

function loadFirstRound() {
    let sp = SPAWN_POINTS[0];
    zombie.position.set(sp[0], sp[1], sp[2]);

    return [zombie];
}

function loadNextRound() {
    if (zombies_current_round.length > 8) {
        console.log("You won!");
        return;
    }
    
    for (let i = 0; i < zombies_current_round.length; i++) {
        let sp = SPAWN_POINTS[i];
        zombies_current_round[i].position.set(sp[0], sp[1], sp[2]);
    }

    let sp = SPAWN_POINTS[zombies_current_round.length];
    
    let new_zombie = cloneFbx(zombie);
    //new_zombie.position.set(sp[0], sp[1], sp[2]);
    new_zombie.position.set(10, -1, 10);
    new_zombie.castShadow = true;
    scene.add(new_zombie);

    zombies_current_round.push(new_zombie);
}

function loadEnvironmentCeiling() {
    const ceilMaterial = new THREE.MeshStandardMaterial({
        map: textures["ceil"].map,
        normalMap: textures["ceil"].normalMap,
        bumpMap: textures["ceil"].bumpMap,
    });
    
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(envsize, envsize, 20, 20), ceilMaterial);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 8, 0);
    ceil.receiveShadow = true;

    return ceil;
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
    const archPosMaterial = new THREE.MeshBasicMaterial({color: "red"});

    let pos = envsize / 4;// + envsize / 6;

    const wall1 = new THREE.Object3D();
    const wall_plane = new THREE.Mesh(new THREE.PlaneGeometry(envsize, 20, 50, 50), wallMaterial);
    

    // arch positions
    const ap1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 4, 10), archPosMaterial);

    ap1.rotation.y = Math.PI / 2;
    ap1.position.set(pos, 0, 0);
    const ap2 = ap1.clone();
    ap2.rotation.y = Math.PI / 2;
    ap2.position.set(-pos, 0, 0);
    ap1.name = "Spawn Position 1"
    ap2.name = "Spawn Position 2"
    
    let wall_arch1 = arch.clone();
    wall_arch1.position.set(pos - 11, -1, -0.5);

    let wall_arch2 = arch.clone();
    wall_arch2.position.set(-pos - 11, -1, -0.5);
    
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

function updateZombies() {
    counter_next_round++;

    if (counter_next_round == TO_NEXT_ROUND) {
        loadNextRound();
        counter_next_round = 0;
    }

    zombies_current_round.forEach(z => {
        z.lookAt(camera.position.x, -1, camera.position.z);
        
        let direction = new THREE.Vector3();
        direction.subVectors(camera.position, z.position).normalize();
        z.position.x += direction.x * 0.1;
        z.position.z += direction.z * 0.1;
    });
}

function update() {
    stats.begin();

    updateFPSCamera();

    updateGun();
    
    gun_mixer.update(1/40);
    
    updateZombies();

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
    camera.rotation.y -= event.movementX * player.turn_sensitivity;
    camera.rotation.x -= event.movementY * player.turn_sensitivity;
}


function onKeyUp(event) {
    keyboard[event.keyCode] = false
}

function onKeyDown(event) {
    keyboard[event.keyCode] = true
}

window.onload = init;


