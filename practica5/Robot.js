/**
 * main.js
 * 
 * Robot Geometry
 * @author <arsar1@inf.upv.es>
 *
 */

class Robot {
    constructor(textureLoader, environmentMap){
        this.textureLoader = textureLoader;
        const floorDiffuse = textureLoader.load("wood_grain/Wood_Grain_DIFF.png")
        const floorRough = textureLoader.load("wood_grain/Wood_Grain_NRM.png")
        const floorNormal = textureLoader.load("wood_grain/Wood_Grain_NRM.png")

        this.lambert = new THREE.MeshLambertMaterial({
            map: this.textureLoader.load("lapis/Main_Base_Color.png"),
            normalMap: this.textureLoader.load("lapis/Main_Metallic.png"),
            bumpMap: this.textureLoader.load("lapis/Main_Roughness.png"),
        });

        this.phong = new THREE.MeshPhongMaterial({
            map: this.textureLoader.load("yellow_plastic/YellowPlastic_d.jpg"),
            normalMap: this.textureLoader.load("yellow_plastic/YellowPlastic_n.jpg"),
            bumpMap: this.textureLoader.load("yellow_plastic/YellowPlastic_r.jpg"),
        });

        this.sphere_phong = new THREE.MeshPhongMaterial({envMap: environmentMap});

        this.geometry_meshes = []; // objects with meshes
        this.geometry = this.loadRobot();
        this.setMaterials();
        this.setShadows();
    }
    
    setShadows() {
        this.geometry_meshes.forEach(geometry => {
            geometry.castShadow = true;
            geometry.recieveShadow = true;
        });
    }

    setMaterials() {
        for (var i = 0; i < this.geometry_meshes.length; i++) {
            if (i < 1 || i >= 5 && i < 10)
                this.geometry_meshes[i].material = this.lambert;
            else if (i == 2)
                this.geometry_meshes[i].material = this.sphere_phong;
            else 
                this.geometry_meshes[i].material = this.phong;
        }
    }

    toggleWireframe() {
        this.geometry_meshes.forEach(geometry => {
            geometry.material.wireframe = !geometry.material.wireframe;
        });
    }

    loadRobot() {
        let robot = new THREE.Object3D();
        const base = this.loadBase();

        robot.add(base);

        return robot;
    }

    loadBase() {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 32, 32), undefined);

        this.geometry_meshes.push(base);

        base.name = "base";

        base.position.set(0, 7.5, 0);
        
        const arm = this.loadArm();
        base.add(arm);


        return base;
    }

    loadArm() {
        const arm = new THREE.Object3D();
        const armBase = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 32, 32), undefined);
        const armTendon = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12, 32, 32), undefined);
        const armTop = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 32), undefined);

        this.geometry_meshes.push(armBase);
        this.geometry_meshes.push(armTop);
        this.geometry_meshes.push(armTendon);
    
        arm.name = "arm"
        armBase.name = "armBase";
        armTop.name = "armTop";
        armTendon.name = "armTendon";
        
        armBase.position.set(0, 0, 0);
        armBase.rotation.z = -Math.PI / 2;
        armTendon.position.set(0, 60, 0);
        armTop.position.set(0, 120, 0);
        
        arm.add(armBase);
        arm.add(armTendon);
        arm.add(armTop);
        arm.position.set(0, 0, 0);

        const forearm = this.loadForearm();
        arm.add(forearm);


        return arm;
    }

    loadForearm() {
        const forearm = new THREE.Object3D();
        const forearmBase = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 32, 32), undefined);
        const forearmNerve1 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), undefined);
        const forearmNerve2 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), undefined);
        const forearmNerve3 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), undefined);
        const forearmNerve4 = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4, 32, 32), undefined);
        const forearmTop = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 32, 32), undefined);
        
        this.geometry_meshes.push(forearmBase);
        this.geometry_meshes.push(forearmNerve1);
        this.geometry_meshes.push(forearmNerve2);
        this.geometry_meshes.push(forearmNerve3);
        this.geometry_meshes.push(forearmNerve4);
        this.geometry_meshes.push(forearmTop);

        forearmNerve1.name = "forearmNerve1";
        forearmNerve2.name = "forearmNerve2";
        forearmNerve3.name = "forearmNerve3";
        forearmNerve4.name = "forearmNerve4";
        forearmTop.name = "forearmTop";
        forearmBase.name = "forearmBase";
        forearm.name = "forearm";

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
        
        const clamp = this.loadClamp();
        forearm.add(clamp);

        return forearm;
    }

    loadClamp() {
        const clamp = new THREE.Object3D();
        const clampBoxLeft  = new THREE.Mesh(new THREE.BoxGeometry(19, 20, 4, 3, 3), undefined);
        const clampBoxRight = new THREE.Mesh(new THREE.BoxGeometry(19, 20, 4, 3, 3), undefined);
        clampBoxLeft.position.set(  16, 0, -15);
        clampBoxRight.position.set( 16, 0,  15);

        clamp.add(clampBoxLeft);
        clamp.add(clampBoxRight);
        clamp.position.set(0, 80, 0);
        
        const clampTipGeometry = this.loadClampTipGeometry();

        const clampTipLeft = new THREE.Mesh(clampTipGeometry, undefined);
        const clampTipRight = new THREE.Mesh(clampTipGeometry, undefined);
       
        this.geometry_meshes.push(clampBoxLeft);
        this.geometry_meshes.push(clampBoxRight);
        this.geometry_meshes.push(clampTipLeft);
        this.geometry_meshes.push(clampTipRight);

        clampTipLeft.name = "clampTipLeft";
        clampTipRight.name = "clampTipRight";
        clampBoxLeft.name = "clampBoxLeft";
        clampBoxRight.name = "clampBoxRight";
        clamp.name = "clamp";

        clampTipLeft.position.set( 35, 0, -15);
        clampTipRight.position.set(35, 0,  15);
        clampTipRight.rotation.x = Math.PI;

        clamp.add(clampTipRight);
        clamp.add(clampTipLeft);
        
        return clamp;
    }

    loadClampTipGeometry() {
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


}

