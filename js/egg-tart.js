import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TART_SCENE, createTartSpin, animateWhileVisible } from "./tart.js";

// ================================
// SCENE SETUP
// ================================

const canvas = document.getElementById("egg-tart-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  TART_SCENE.fov,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.fromArray(TART_SCENE.cameraPosition);
camera.lookAt(0, 0, 0);

// ================================
// LIGHTING
// ================================

const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.8);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(3, 5, 4);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffe4c4, 0.5);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffd699, 0.3);
rimLight.position.set(0, -1, -3);
scene.add(rimLight);

// ================================
// LOAD EGG TART MODEL
// ================================

const tartGroup = new THREE.Group();
scene.add(tartGroup);

const loader = new GLTFLoader();
loader.load(
  "static/egg-tart.glb",
  (gltf) => {
    const model = gltf.scene;

    // Center the model based on its bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    model.scale.setScalar(TART_SCENE.size / maxDim);

    tartGroup.add(model);
  },
  undefined,
  (error) => {
    console.error("Failed to load egg tart model:", error);
  }
);

// ================================
// INTERACTION: DRAG TO SPIN
// ================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function hitsEggTart(x, y) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(tartGroup, true).length > 0;
}

const spin = createTartSpin({ canvas, hits: hitsEggTart });

// ================================
// RESIZE
// ================================

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener("resize", onResize);

// ================================
// ANIMATION LOOP
// ================================

animateWhileVisible(canvas, () => {
  const { x, y, bob } = spin.step();
  tartGroup.rotation.set(x, y, 0);
  tartGroup.position.y = bob;
  renderer.render(scene, camera);
});
