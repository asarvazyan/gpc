/**
 * main.js
 * 
 * Implements basic structure of ThreeJS program
 * @author <arsar1@inf.upv.es>
 *
 */

let renderer, scene, camera;
let robot;
let is_wire = true;

init();
loadScene();
render();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene =  new THREE.Scene()
    scene.background = new THREE.Color(0.5, 0.5, 0.5);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 300, 200);
    camera.lookAt(0, 50, 0);
}

function loadScene() {
    scene.add(new THREE.AxesHelper(40));

    const floorMaterial = new THREE.MeshBasicMaterial({color:'red', wireframe:is_wire});
    const baseMaterial = new THREE.MeshBasicMaterial({color:'yellow', wireframe:is_wire});
    const armMaterial = new THREE.MeshBasicMaterial({color:'blue', wireframe:is_wire});
    const forearmMaterial = new THREE.MeshBasicMaterial({color:'green', wireframe:is_wire});
    const clampMaterial = new THREE.MeshBasicMaterial({color:'purple', wireframe:is_wire});
    const clampTipMaterial = new THREE.MeshBasicMaterial({color: "orange", wireframe: is_wire});

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 100, 100), floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.set(0, 0, 0);
    scene.add(floor);
    
    // Construct robot
    robot = new THREE.Object3D();

    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 32, 32), baseMaterial);
    base.position.set(0, 7.5, 0);

    const arm = new THREE.Object3D();
    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 32, 32), armMaterial);
    const armTendon = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12, 32, 32), armMaterial);
    const armTop = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 32), armMaterial);
    
    armBase.position.set(0, 0, 0);
    armBase.rotation.z = -Math.PI / 2;
    armTendon.position.set(0, 60, 0);
    armTop.position.set(0, 120, 0);

    arm.add(armBase);
    arm.add(armTendon);
    arm.add(armTop);
    arm.position.set(0, 0, 0);

    const forearm = new THREE.Object3D();
    const forearmBase = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 32, 32), forearmMaterial);
    const forearmNerve1 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), forearmMaterial);
    const forearmNerve2 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), forearmMaterial);
    const forearmNerve3 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), forearmMaterial);
    const forearmNerve4 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), forearmMaterial);
    const forearmTop = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 32, 32), forearmMaterial);
    
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
    arm.add(forearm);

    const clamp = new THREE.Object3D();
    const leftClampBox  = new THREE.Mesh(new THREE.BoxGeometry(20, 19, 4, 3, 3), clampMaterial);
    const rightClampBox = new THREE.Mesh(new THREE.BoxGeometry(20, 19, 4, 3, 3), clampMaterial);
    leftClampBox.position.set(  15, 0, -15);
    rightClampBox.position.set( 15, 0,  15);
    
    const clampTipGeometry = new THREE.BufferGeometry();
    const clampTipVertices = new Float32Array([
        -2, -10, -9.5,
        -2,  -5,  9.5,
        -2,  10, -9.5,
        -2,   5,  9.5,
         2, -10, -9.5,
         0,  -5,  9.5,
         2,  10, -9.5,
         0,   5,  9.5,
    ]);

    // We define the indices such that the normals are 
    // well-defined (outgoing) by default
    const clampTipIndices = [
        0, 1, 3,
        3, 2, 0,
        
        4, 0, 2,
        2, 6, 4,

        1, 5, 7,
        7, 3, 1,

        5, 4, 6,
        6, 7, 5,

        4, 5, 1,
        1, 0, 4,

        2, 3, 7,
        7, 6, 2
    ];

    clampTipGeometry.setAttribute('position', new THREE.BufferAttribute(clampTipVertices, 3));
    clampTipGeometry.setIndex(clampTipIndices);

    const clampTipLeft = new THREE.Mesh(clampTipGeometry, clampTipMaterial);
    const clampTipRight = new THREE.Mesh(clampTipGeometry, clampTipMaterial);
    clampTipLeft.position.set(35, 0, -15);
    clampTipRight.position.set(35, 0, 15);
    clampTipLeft.rotation.y = Math.PI / 2;
    clampTipRight.rotation.y = Math.PI / 2;

    clamp.add(clampTipRight);
    clamp.add(clampTipLeft);

    clamp.add(leftClampBox);
    clamp.add(rightClampBox);
    clamp.position.set(0, 80, 0);
    forearm.add(clamp);

    base.add(arm);
    robot.add(base);
    scene.add(robot);
}

function update() {
    return
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
