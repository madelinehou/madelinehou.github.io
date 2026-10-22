// Everything shared by the 3D tart (egg-tart.js) and the ASCII tart (script.js):
// how it's framed, how it moves, and one pose that both read, so switching
// between them picks up mid-spin.

export const TART_SCENE = {
  cameraPosition: [0, 2, 5],
  fov: 45,
  tilt: 0.3, // radians, top of the tart toward the camera
  size: 2, // longest side of the model, in scene units
  bobHeight: 0.08, // scene units
  bobSpeed: 1, // radians per second
};

// Drag-to-spin physics: a flick keeps spinning and slows down, the tilt
// springs back, and the tart never stops a gentle idle spin. With reduced
// motion on, the idle spin and bob stop, but dragging still works.
const DAMPING = 0.95;
const IDLE_SPIN = 0.004;
const TILT_SPRING = 0.02;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// One pose for both tarts. Only the visible tart's loop calls step().
const pose = { x: TART_SCENE.tilt, y: 0, bob: 0 };
let velocityX = 0;
let velocityY = 0.005;

function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

// hits(x, y) says whether client coordinates land on the tart, so only the tart is grabbable
export function createTartSpin({ canvas, hits }) {
  let isDragging = false;
  let previousX = 0;
  let previousY = 0;
  let lastCursorCheck = 0;

  function onPointerDown(e) {
    const pos = getPointerPos(e);
    if (!hits(pos.x, pos.y)) return;
    isDragging = true;
    previousX = pos.x;
    previousY = pos.y;
    canvas.style.cursor = "grabbing";
    if (e.touches) e.preventDefault();
  }

  function onPointerMove(e) {
    const pos = getPointerPos(e);
    if (!isDragging) {
      // Throttle cursor raycasts to avoid interrupting animation
      if (!e.touches) {
        const now = Date.now();
        if (now - lastCursorCheck > 150) {
          lastCursorCheck = now;
          canvas.style.cursor = hits(pos.x, pos.y) ? "grab" : "default";
        }
      }
      return;
    }
    velocityY = (pos.x - previousX) * 0.005;
    velocityX = (pos.y - previousY) * 0.003;
    previousX = pos.x;
    previousY = pos.y;
    if (e.touches) e.preventDefault();
  }

  function onPointerUp() {
    isDragging = false;
    canvas.style.cursor = "default";
  }

  const listeners = [
    ["mousedown", onPointerDown],
    ["mousemove", onPointerMove],
    ["mouseup", onPointerUp],
    ["mouseleave", onPointerUp],
    ["touchstart", onPointerDown, { passive: false }],
    ["touchmove", onPointerMove, { passive: false }],
    ["touchend", onPointerUp],
  ];
  for (const [type, fn, options] of listeners) canvas.addEventListener(type, fn, options);

  return {
    // Advance one frame and return the shared pose: rotation x and y, and the bob offset
    step() {
      pose.y += velocityY;
      pose.x += velocityX;

      if (!isDragging) {
        velocityY *= DAMPING;
        velocityX *= DAMPING;
        if (!reducedMotion.matches && Math.abs(velocityY) < IDLE_SPIN) velocityY = IDLE_SPIN;
        pose.x += (TART_SCENE.tilt - pose.x) * TILT_SPRING;
      }

      pose.bob = reducedMotion.matches
        ? 0
        : Math.sin(Date.now() * 0.001 * TART_SCENE.bobSpeed) * TART_SCENE.bobHeight;
      return pose;
    },
    destroy() {
      for (const [type, fn] of listeners) canvas.removeEventListener(type, fn);
    },
  };
}

// Run frame() every animation frame, but only while the canvas is on screen.
// A hidden canvas counts as off screen, so the inactive tart stops rendering.
export function animateWhileVisible(canvas, frame) {
  let id = 0;
  const loop = () => {
    frame();
    id = requestAnimationFrame(loop);
  };
  const observer = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(id);
    if (entry.isIntersecting) loop();
  });
  observer.observe(canvas);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(id);
  };
}
