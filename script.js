import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const canvas = document.createElement('canvas');
canvas.width = 2;
canvas.height = 2;
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 0, 2);
gradient.addColorStop(0, '#e53935'); 
gradient.addColorStop(1, '#1e88e5'); 
context.fillStyle = gradient;
context.fillRect(0, 0, 2, 2);
const texture = new THREE.CanvasTexture(canvas);
scene.background = texture;

const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let breadModel;
const loader = new GLTFLoader();
loader.load(
    'bread.glb',
    function (gltf) {
        breadModel = gltf.scene;
        breadModel.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        breadModel.scale.set(0.5, 0.5, 0.5); 
        breadModel.position.set(0, -0.3, 0);
        breadModel.rotation.x = -Math.PI / 20; 
        breadModel.rotation.z = -Math.PI / 20; 
        breadModel.rotation.y = Math.PI / 15; 
        scene.add(breadModel);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened loading the model:', error);
    }
);

// Add multiple lights for dynamic shadows
const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(5, 5, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
mainLight.shadow.bias = -0.0005;
mainLight.shadow.radius = 4;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(0, -5, -5);
scene.add(backLight);

// Add a spotlight focused specifically on the bread
const spotLight = new THREE.SpotLight(0xffffff, 1.0);
spotLight.position.set(0, 3, 1);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.2;
spotLight.decay = 1;
spotLight.distance = 10;
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

// Add a strong front light to illuminate the side facing the camera
const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
frontLight.position.set(0, 0, 3);
scene.add(frontLight);

// Add rim light to highlight edges
const rimLight = new THREE.DirectionalLight(0xffffcc, 0.6);
rimLight.position.set(1, 0, 1);
scene.add(rimLight);

// Add a soft ambient light to fill in shadows
const ambientLight = new THREE.AmbientLight(0x404040, 0.9);
scene.add(ambientLight);

camera.position.z = -1.8;
camera.position.y = 1.2;
camera.lookAt(0, 0, 0.5); 

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1.5; 
controls.enableRotate = true;
controls.rotateSpeed = 1.0;
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.enablePan = true;
controls.panSpeed = 1.0;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.0;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (breadModel) {
        breadModel.rotation.y += 0.005; 
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate(); 