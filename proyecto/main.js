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
};
let resources_loaded = false;

// Physics
let gravity = -9.8;
let physics_world;

// Game models
let arch, gun, zombie, crosshairs;
let gun_mixer; // 0 = idle, 2 = reload, 3 = show, 11 = shoot

// Game utils
let camera_direction, neg_z = new THREE.Vector3(0, 0, -1), max_y_rotation = 0.55;
let envsize = 60;
let keyboard = {};

// Player, ammo, etc
let player = {
    height: 2.5,
    speed : 0.7,
    turn_sensitivity: 0.003,
    can_shoot: 0,
}
const CAN_SHOOT_EVERY = 5;
const MAG_SIZE = 50;
let ammo = MAG_SIZE;

// Zombies
let zombies = [];
let zombies_current_round = [];
let current_round = 0;
const TO_NEXT_ROUND = 200;
const ZOMBIE_MAX_HEALTH = 10; // need this many shots to kill 


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
    [-31, -1, -16],
    [ 16, -1,  31],
    [ 16, -1, -31],
    [-16, -1,  31],
    [-16, -1, -31],
];


// https://gist.github.com/kevincharm/bf12a2c673b43a3988f0f171a05794c1 
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
    loading_screen.camera.lookAt(0, 0, 0);

    loading_manager = new THREE.LoadingManager(); 
    let i = 0;
    loading_manager.onProgress = (item, loaded, total) => {
        document.getElementById("info").innerText = "Loading" + ".".repeat(i);
        i++;
        i = i % 3;
    };

    loading_manager.onLoad = () => {
        console.log("All resources loaded");
        resources_loaded = true;
        let div = document.getElementById("info");
        div.parentNode.removeChild(div);
        loadScene();
        //render();
    };

    scene =  new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, player.height, 0);
    camera.lookAt(100, player.height, 0);
    camera.rotation.order = "YXZ";
    scene.add(camera);

    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mousedown", onMouseDown)
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

    fbx_loader.load("resources/zombies/Zombie_Running.fbx", object => {
        zombie = object;
        zombie.name = "zombie";
        zombie.scale.set(0.02, 0.02, 0.02);

        let zombie_bbox = new THREE.Mesh(
            new THREE.BoxGeometry(60, 210, 20),
            new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0})
        );
        zombie_bbox.name = "zombie_bbox";
        zombie.add(zombie_bbox);

        zombie_bbox.position.set(
            0, 100, 0
        )

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
    directional.shadow.camera.far    = 20;
    directional.shadow.camera.fov    = 80;
    directional.shadow.camera.near   = 1;
    directional.shadow.camera.far    = 500;
    directional.shadow.camera.left   = -500;
    directional.shadow.camera.right  = 500;
    directional.shadow.camera.top    = 500;
    directional.shadow.camera.bottom = -500;
    scene.add(directional);

    // One focal at each corner
    const focal1 = new THREE.SpotLight(0xFF0000, 0.3);
    focal1.position.set(29.5, 7, 29.5);
    focal1.target.position.set(0, 0, 0);
    focal1.angle = Math.PI / 4;
    focal1.penumbra = 0.3;
    focal1.castShadow = true;
    focal1.shadow.camera.far    = 20;
    focal1.shadow.camera.fov    = 80;
    focal1.shadow.camera.near   = 1;
    focal1.shadow.camera.far    = 500;
    focal1.shadow.camera.left   = -500;
    focal1.shadow.camera.right  = 500;
    focal1.shadow.camera.top    = 500;
    focal1.shadow.camera.bottom = -500;
    scene.add(focal1);

    const focal2 = new THREE.SpotLight(0xFF0000, 0.3);
    focal2.position.set(-29.5, 7, 29.5);
    focal2.target.position.set(0, 0, 0);
    focal2.angle = Math.PI / 4;
    focal2.penumbra = 0.3;
    focal2.castShadow = true;
    focal2.shadow.camera.far    = 20;
    focal2.shadow.camera.fov    = 80;
    focal2.shadow.camera.near   = 1;
    focal2.shadow.camera.far    = 500;
    focal2.shadow.camera.left   = -500;
    focal2.shadow.camera.right  = 500;
    focal2.shadow.camera.top    = 500;
    focal2.shadow.camera.bottom = -500;
    scene.add(focal2);

    const focal3 = new THREE.SpotLight(0xFF0000, 0.3);
    focal3.position.set(29.5, 7, -29.5);
    focal3.target.position.set(0, 0, 0);
    focal3.angle = Math.PI / 4;
    focal3.penumbra = 0.3;
    focal3.castShadow = true;
    focal3.shadow.camera.far    = 20;
    focal3.shadow.camera.fov    = 80;
    focal3.shadow.camera.near   = 1;
    focal3.shadow.camera.far    = 500;
    focal3.shadow.camera.left   = -500;
    focal3.shadow.camera.right  = 500;
    focal3.shadow.camera.top    = 500;
    focal3.shadow.camera.bottom = -500;
    scene.add(focal3);

    const focal4 = new THREE.SpotLight(0xFF0000, 0.3);
    focal4.position.set(-29.5, 7, -29.5);
    focal4.target.position.set(0, 0, 0);
    focal4.angle = Math.PI / 4;
    focal4.penumbra = 0.3;
    focal4.castShadow = true;
    focal4.shadow.camera.far    = 20;
    focal4.shadow.camera.fov    = 80;
    focal4.shadow.camera.near   = 1;
    focal4.shadow.camera.far    = 500;
    focal4.shadow.camera.left   = -500;
    focal4.shadow.camera.right  = 500;
    focal4.shadow.camera.top    = 500;
    focal4.shadow.camera.bottom = -500;
    scene.add(focal4);
    
    /*
    scene.add(new THREE.SpotLightHelper(focal));
    scene.add(new THREE.SpotLightHelper(focal1));
    scene.add(new THREE.SpotLightHelper(focal2));
    scene.add(new THREE.SpotLightHelper(focal3));
    scene.add(new THREE.SpotLightHelper(focal4));
    */
}

function loadZombies() {
    let sp = SPAWN_POINTS[0];
    zombie.position.set(sp[0], sp[1], sp[2]);
    scene.add(zombie);
    zombies = [zombie];

    for (var i = 1; i < 8; i++) {
        sp = SPAWN_POINTS[i];
        let zombie2 = cloneFbx(zombie);
        zombie2.name = zombie.name;
        zombie2.position.set(sp[0], sp[1], sp[2]);

        scene.add(zombie2);
        zombies.push(zombie2);
    }
}

function loadCrosshairs() {
    // https://codepen.io/driezis/pen/jOPzjLG 
    var pMat = new THREE.ShaderMaterial({
        uniforms: { main_color: {value: {r: 1, g: 1, b: 1}},
                    border_color: {value: {r: 0, g: 0, b: 0.1}},
                   
                    thickness: {value:0.004},
                    height: {value:0.05},
                    offset: {value:0.02},
                    border: {value:0.001},
                   
                    opacity: {value: 1},
                    center: {value: {x: 0.5, y: 0.5}},
                    rotation: {value: 0}
                },
         vertexShader: `
                uniform float rotation;
                uniform vec2 center;
                #include <common>
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
                    vec2 scale;
                    scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
                    scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
                    #ifndef USE_SIZEATTENUATION
                        bool isPerspective = isPerspectiveMatrix( projectionMatrix );
                        if ( isPerspective ) scale *= - mvPosition.z;
                    #endif
                    vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
                    vec2 rotatedPosition;
                    rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
                    rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
                    mvPosition.xy += rotatedPosition;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
         fragmentShader: `
            uniform vec3 main_color;
            uniform vec3 border_color;
            uniform float opacity;

            uniform float thickness;
            uniform float height;
            uniform float offset;
            uniform float border;

            varying vec2 vUv;
            void main() {

                float a = (step(abs(vUv.x - 0.5), thickness)) * step(abs(vUv.y - 0.5), height + offset) * step(offset, abs(vUv.y - 0.5)) + (step(abs(vUv.y - 0.5), thickness)) * step(abs(vUv.x - 0.5), height + offset) * step(offset, abs(vUv.x - 0.5));
                float b = (step(abs(vUv.x - 0.5), thickness - border)) * step(abs(vUv.y - 0.5), height + offset - border) * step(offset + border, abs(vUv.y - 0.5)) + (step(abs(vUv.y - 0.5), thickness - border)) * step(abs(vUv.x - 0.5), height + offset - border) * step(offset + border, abs(vUv.x - 0.5));
                gl_FragColor = vec4( mix(border_color, main_color, b), a * opacity);
            }
         `,
         transparent: true,
    });

    crosshairs = new THREE.Sprite(pMat);
    camera.add(crosshairs);
    crosshairs.position.set(camera.position.x, 0, camera.position.z - 0.1);
}

function loadScene() {
    loadLights();
    loadZombies();
    loadCrosshairs();
    
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
    
    loadNextRound();

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
    }); 

    return environment;
}

function resetZombies() {
    for (var i = 0; i < zombies.length; i++) {
        let sp = SPAWN_POINTS[i];
        zombies[i].position.set(sp[0], sp[1], sp[2]);
        zombies[i].health = ZOMBIE_MAX_HEALTH;
    }
}

function loadNextRound() {
    if (current_round == 8) {
        console.log("You won!");
        return;
    }

    current_round++;
    resetZombies();
    zombies_current_round = zombies.slice(0, current_round);
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

function damageZombies() {
    let direction = new THREE.Vector2(0, 0);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(direction, camera);
    ray.far = 1000;
    ray.near = 0.1;
    
    const intersects = ray.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        let name = intersects[i].object.name;

        if (name == "zombie_bbox") {
            let hit_zombie = intersects[i].object.parent;
            hit_zombie.health--;
            if (hit_zombie.health == 0) {
                hit_zombie.position.y = -10;
            }
            console.log(intersects[i].object);
            console.log("Shot a zombie!");
        }
    }

}

function inBoundaries(next_x, next_z) {
    return (next_x < envsize / 2 && next_x > -envsize / 2 &&
        next_z < envsize / 2 && next_z > -envsize / 2);
}

function updateFPS() {
	let dx_frontback = Math.sin(camera.rotation.y) * player.speed;
    let dz_frontback = Math.cos(camera.rotation.y) * player.speed;
    let dx_sides = Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
    let dz_sides = Math.cos(camera.rotation.y + Math.PI/2) * player.speed;

    let next_x, next_z; 
    if(keyboard[KEYS.W]){
		next_x = camera.position.x - Math.sin(camera.rotation.y) * player.speed;
		next_z = camera.position.z - Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[KEYS.S]){
		next_x = camera.position.x + Math.sin(camera.rotation.y) * player.speed;
		next_z = camera.position.z + Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[KEYS.A]){
		next_x = camera.position.x - Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		next_z = camera.position.z - Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}
	if(keyboard[KEYS.D]){
		next_x = camera.position.x + Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		next_z = camera.position.z + Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}

    if (inBoundaries(next_x, next_z)) {
        camera.position.x = next_x;
        camera.position.z = next_z;
    }

    if (player.can_shoot < CAN_SHOOT_EVERY) player.can_shoot++; 
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
}

function updateZombies() {
    let next_round = true;
    zombies_current_round.forEach(z => {
        next_round &= z.health <= 0;
    });

    if (next_round) {
        loadNextRound();
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
    
    updateFPS();
    updateGun();
    
    gun_mixer.update(1/40);

    updateZombies();

    stats.end();
}

function render() {
    if (resources_loaded === false) {
        requestAnimationFrame(render);

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

function onMouseDown(event) {
    if (event.buttons == 1) { // left to shoot

        if(player.can_shoot >= CAN_SHOOT_EVERY && ammo > 0) {
            let action = gun_mixer.clipAction(gun.animations[11]);
            action.setLoop(THREE.LoopOnce);
            action.play().reset();
            
            // Shoot
            player.can_shoot = 0;
            ammo -= 1;
            
            damageZombies();

            console.log("Remaining ammo: " + ammo);
        }
    }
    else if (event.buttons == 2) { // right to reload
        if (ammo < MAG_SIZE) {
            let action = gun_mixer.clipAction(gun.animations[2]);
            action.setLoop(THREE.LoopOnce);
            action.play().reset();

            ammo = MAG_SIZE;
            console.log("Reloaded! Remaining ammo: " + ammo);
        }
    }
}


function onKeyUp(event) {
    keyboard[event.keyCode] = false
}

function onKeyDown(event) {
    keyboard[event.keyCode] = true
}

window.onload = init;


