import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2, 5);
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

    // Scale to a reasonable size (target ~2 units across)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    model.scale.setScalar(scale);

    tartGroup.add(model);

    // Slight tilt toward viewer
    tartGroup.rotation.x = 0.3;
  },
  undefined,
  (error) => {
    console.error("Failed to load egg tart model:", error);
  }
);

// ================================
// INTERACTION: DRAG TO SPIN
// ================================

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationVelocityY = 0.005;
let rotationVelocityX = 0;
const damping = 0.95;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function hitsEggTart(e) {
  const pos = getPointerPos(e);
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((pos.x - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((pos.y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(tartGroup, true).length > 0;
}

function onPointerDown(e) {
  if (!hitsEggTart(e)) return;
  isDragging = true;
  const pos = getPointerPos(e);
  previousMouseX = pos.x;
  previousMouseY = pos.y;
  canvas.style.cursor = "grabbing";
  if (e.touches) e.preventDefault();

  // Count every interaction with the egg tart
  tartTapCount++;
  clearTimeout(tartTapTimer);
  tartTapTimer = setTimeout(() => { tartTapCount = 0; }, 3000);
  if (tartTapCount >= 3) {
    tartTapCount = 0;
    window.dispatchEvent(new CustomEvent("egg-tart-secret"));
  }
}

let lastCursorCheck = 0;

function onPointerMove(e) {
  if (!isDragging) {
    // Throttle cursor raycasts to avoid interrupting animation
    if (!e.touches) {
      const now = Date.now();
      if (now - lastCursorCheck > 150) {
        lastCursorCheck = now;
        canvas.style.cursor = hitsEggTart(e) ? "grab" : "default";
      }
    }
    return;
  }
  const pos = getPointerPos(e);
  const deltaX = pos.x - previousMouseX;
  const deltaY = pos.y - previousMouseY;
  rotationVelocityY = deltaX * 0.005;
  rotationVelocityX = deltaY * 0.003;
  previousMouseX = pos.x;
  previousMouseY = pos.y;
  if (e.touches) e.preventDefault();
}

function onPointerUp() {
  isDragging = false;
  canvas.style.cursor = "default";
}

// Track interactions with the egg tart (for easter egg)
let tartTapCount = 0;
let tartTapTimer = null;

canvas.addEventListener("mousedown", onPointerDown);
canvas.addEventListener("mousemove", onPointerMove);
canvas.addEventListener("mouseup", onPointerUp);
canvas.addEventListener("mouseleave", onPointerUp);

canvas.addEventListener("touchstart", onPointerDown, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerUp);

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

function animate() {
  requestAnimationFrame(animate);

  tartGroup.rotation.y += rotationVelocityY;
  tartGroup.rotation.x += rotationVelocityX;

  if (!isDragging) {
    rotationVelocityY *= damping;
    rotationVelocityX *= damping;

    // Maintain gentle idle spin
    if (Math.abs(rotationVelocityY) < 0.004) {
      rotationVelocityY = 0.004;
    }

    // Slowly return x tilt toward default
    const targetTiltX = 0.3;
    tartGroup.rotation.x += (targetTiltX - tartGroup.rotation.x) * 0.02;
  }

  // Gentle float bob
  tartGroup.position.y = Math.sin(Date.now() * 0.001) * 0.08;

  renderer.render(scene, camera);
}
animate();
