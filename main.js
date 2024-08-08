const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const loader = new THREE.GLTFLoader();
loader.load(
    './models/brain-model-with-empties.glb', // Correct filename and path
    (gltf) => {
        scene.add(gltf.scene);

        // Find and create hotspots from empties
        const hotspots = [];
        gltf.scene.traverse((child) => {
            if (child.isObject3D && child.name) {
                hotspots.push(createHotspot(child.position, child.name));
            }
        });

        function createHotspot(position, name) {
            const geometry = new THREE.SphereGeometry(0.05, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const hotspot = new THREE.Mesh(geometry, material);
            hotspot.position.copy(position);
            hotspot.name = name;
            scene.add(hotspot);
            return hotspot;
        }
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.log('An error happened', error);
    }
);

// Adjust camera position
camera.position.set(0, 0, 2); // Adjust Z value to bring the camera closer

// Add raycaster for interactivity
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Information box
const infoBox = document.createElement('div');
infoBox.style.position = 'absolute';
infoBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
infoBox.style.padding = '10px';
infoBox.style.border = '1px solid #000';
infoBox.style.borderRadius = '5px';
infoBox.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
infoBox.style.display = 'none';
document.body.appendChild(infoBox);

// Information mapping
const infoMapping = {
    cerebellum: 'The cerebellum is responsible for coordinating voluntary movements.',
    frontal_lobe: 'The frontal lobe is involved in decision making, problem solving, and planning.',
    parietal_lobe: 'The parietal lobe processes sensory information such as touch, temperature, and pain.',
    spinal_cord: 'The spinal cord transmits signals between the brain and the rest of the body.',
    temporal_lobe: 'The temporal lobe is involved in processing auditory information and memory.'
};

function onDocumentMouseClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        if (infoMapping[intersectedObject.name]) {
            // Smooth camera movement to the hotspot
            new TWEEN.Tween(camera.position)
                .to({
                    x: intersectedObject.position.x,
                    y: intersectedObject.position.y,
                    z: intersectedObject.position.z + 0.5
                }, 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();

            camera.lookAt(intersectedObject.position);

            // Show the information box
            infoBox.style.left = `${Math.min(event.clientX, window.innerWidth - infoBox.offsetWidth - 10)}px`;
            infoBox.style.top = `${Math.min(event.clientY, window.innerHeight - infoBox.offsetHeight - 10)}px`;
            infoBox.style.display = 'block';
            infoBox.innerHTML = `<h2>${intersectedObject.name.replace('_', ' ')}</h2><p>${infoMapping[intersectedObject.name]}</p>`;
        }
    } else {
        infoBox.style.display = 'none';
    }
}

document.addEventListener('click', onDocumentMouseClick, false);

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

animate();
