// How the hero egg tart is framed and moves, shared by the 3D view (egg-tart.js)
// and the ASCII theme (script.js) so the two stay in sync.
export const TART_SCENE = {
  cameraPosition: [0, 2, 5],
  fov: 45,
  tilt: 0.3, // radians, top of the tart toward the camera
  size: 2, // longest side of the model, in scene units
  bobHeight: 0.08, // scene units
  bobSpeed: 1, // radians per second
};
