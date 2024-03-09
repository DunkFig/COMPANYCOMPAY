// The Code below uses Three.js HTML and Javascript to Render a Scene, 
// Bring in GLTF models and Animations from Blender. This Scene uses sprites
// and a rayCaster to bring descriptive HTML elements to the front of the page. 


import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'


// Ensures all Images are loaded
window.onload = function () {


    // Canvas
    const canvas = document.querySelector('canvas.webgl')


    // Scene
    const scene = new THREE.Scene()


    // SIZES (USED BY CAMERA WINDOW, RENDERER & RAYCASTER)
    const sizes = {
        width: 960,
        height: 720
    }


    // SPHERE BACKGROUND OF SCENE
    let BackgroundSphere
    const loader = new THREE.TextureLoader();
    loader.load('Images/BackgroundImage.jpg', function (texture) {

        // Create a sphere geometry
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        // Invert the geometry on the x-axis so that all of the faces point inward
        geometry.scale(-0.1, 0.1, 0.1);

        // Create a basic material and set the texture as its map
        const material = new THREE.MeshBasicMaterial({ map: texture });

        // Create a mesh and add it to the scene
        BackgroundSphere = new THREE.Mesh(geometry, material);
        scene.add(BackgroundSphere);
    });


    // Animation mixer variable
    let mixer;


    // LOAD MODELS & ANIMATIONS HERE
    const gltfLoader = new GLTFLoader()
    gltfLoader.load('models/BlenderScene.gltf', (gltf) => {

        scene.add(gltf.scene);
        console.log(gltf)
        // Mixer For animations.
        mixer = new THREE.AnimationMixer(gltf.scene);
        
        gltf.scenes[0].children[0].children[0].scale.x = 0.01
        gltf.scenes[0].children[0].children[0].scale.y = 0.01
        gltf.scenes[0].children[0].children[0].scale.z = 0.01

        const mixamoAnimation = gltf.animations.find(clip => clip.name === "Armature|mixamo.com|Layer0");
        console.log(mixamoAnimation); //

        mixer.clipAction(mixamoAnimation).play();

        // Loop through all animations and create actions
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
          
        });
   

    }, undefined, function (error) {
        console.error(error);

    }
    )

    // SELECTOR SPRITES ////////////////////////////////////////////////// HOTSPOTS
    // If you are adding in new hotspots follow the format below, and then update the raycaster
    // code in the animation Loop to include the new Unique ID of your new Sprite Sprite. 
    // This Unique ID corresponds directly to the ID of Divs and changes their Z-Index Based on this correspondence.
    const Icon = new THREE.TextureLoader().load('Images/Icon.png');
    const sphereTexture = new THREE.SpriteMaterial({ map: Icon, sizeAttenuation: false })


    //RAYCASTER FOR INTERACTION WITH LABEL SPHERES
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event) {
        mouse.x = (event.clientX / sizes.width) * 2 - 1;
        mouse.y = - (event.clientY / sizes.height) * 2 + 1;
    }

    window.addEventListener('mousemove', onMouseMove, false);


    // LIGHTS 
    // Three.js Needs lights in the scene for certain objects to appear correctly. In the scene now there is 
    // an ambient Light and a Directional Light on top of the Drone.
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6)
    scene.add(ambientLight)


    // CAMERA SETTINGS
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 1000)
    camera.position.set(10, 10, 10)
    camera.size
    camera.near = 0.00000001
    camera.far = 6000
    scene.add(camera)


    // The Position of The Camera will be altered by the ORBIT CONTROLS
    // This is the STARTING POSITION OF THE CAMERA
    camera.position.set(6.77764102596008, 9.481844326473373, -5.6678968158056025)


    // ORBIT Controls SETTINGS
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 0.75, 0)
    controls.enableDamping = true
    // controls.enableZoom = false


    // Renderer // THIS IS ESSENTIALLY THE 3D ENVIRONMENT WE'RE APPENDING TO THE HTML CANVAS
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



    // THIS FUNCTION TAKES THE USER ID OF THE SPRITE AND USES IT TO SET THE Z-INDEX of 
    // A HTML Element.
    let infoElement

    function displayInformation(object) {
        // Example: Update a DOM element with the information
        infoElement = document.getElementById(`${object.userData.id}`);
        infoElement.style.display = 'block';
        infoElement.style.zindex = '200';
    }




    // ANIMATION LOOP ///////////////////////////////////////////////////////////////////////////////////
    // This function (tick) is updated multiples times a second, it is how we literally 'Animate'
    // the scene. Orbit Contols, Scene Rendering, Imported Animations, RayCaster events are all 
    // Controlled here. 
    const clock = new THREE.Clock()
    let previousTime = 0
    let lastHoveredObject = null; // Track the last hovered object


    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - previousTime;
        previousTime = elapsedTime;

        if (BackgroundSphere) {
            BackgroundSphere.rotation.y += 0.0003;
        }
        if (mixer) {
            mixer.update(deltaTime);
        }

        // Update controls
        controls.update();

        // Render
        renderer.render(scene, camera);

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children, true); // true for recursive if needed

        let hoveredObject = null;

        // Handle intersections // UPDATE CORRESPONDING NEW HOTSPOTS IN THE IF STATMENT BELOW
        if (intersects.length > 0) {
            const intersected = intersects[0].object; // Get the first intersected object
            if (intersected.userData.id === "sphereLabel1" || intersected.userData.id === "sphereLabel2" || intersected.userData.id === "sphereLabel3") {
                intersected.material.opacity = 1.0;
                displayInformation(intersected);
                infoElement.style.zIndex = '100'; // Corrected property name
                hoveredObject = intersected;
            }
        }

        // Reset last hovered object if it's no longer hovered
        if (lastHoveredObject && lastHoveredObject !== hoveredObject) {
            lastHoveredObject.material.opacity = 1.0; // Reset opacity
            infoElement.style.zIndex = '-40'; // Hide info element or reset z-index
            infoElement = ''
        }

        lastHoveredObject = hoveredObject; // Update last hovered object

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    };

    tick(); // Start the animation loop

}