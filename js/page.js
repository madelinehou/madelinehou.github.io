gsap.registerPlugin(ScrollTrigger);

// ================================
// THEME TOGGLE
// ================================

const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;

// Initialize from localStorage or system preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  html.setAttribute("data-theme", savedTheme);
}

function isDarkTheme() {
  const theme = html.getAttribute("data-theme");
  return theme === "dark" || theme === "ascii" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

// Phone browser chrome (the area around the page) follows the active theme
const THEME_TOP = { light: "#edddcb", dark: "#201710", ascii: "#0f1b24" };
const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
function syncThemeColor() {
  const theme = html.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  themeColorMetas.forEach((meta) => (meta.content = THEME_TOP[theme]));
}

function syncIcon() {
  syncThemeColor();
  themeToggle.classList.toggle("is-sun", isDarkTheme());
  themeToggle.classList.toggle("is-ascii", html.getAttribute("data-theme") === "ascii");
}
syncIcon();

function toggleTheme() {
  if (cbBusy) return; // mid Code Blue transition
  // From the ASCII theme, the toggle returns to the theme it replaced
  if (asciiTart) {
    exitAsciiTheme();
    return;
  }

  const current = html.getAttribute("data-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  let next;
  if (!current) {
    next = systemDark ? "light" : "dark";
  } else {
    next = current === "dark" ? "light" : "dark";
  }

  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  syncIcon();
}

// In the ASCII theme, the "o" is a spinner glyph that animates on hover, like
// Claude's. Each frame has its own size: in a terminal the glyphs come from
// different fallback fonts, and that size wobble is what makes it feel alive.
// ︎ keeps ✳ as text instead of an emoji.
const asciiSpinner = document.getElementById("ascii-spinner");
const spinnerFrames = [
  { glyph: "·", size: 1 },
  { glyph: "✢", size: 0.7 },
  { glyph: "✳︎", size: 0.8 },
  { glyph: "✶", size: 0.9 },
  { glyph: "✻", size: 1 },
  { glyph: "✽", size: 1.1 },
];
const spinnerRest = 2; // ✳
let spinnerTimer = null;
let spinnerFrame = spinnerRest;
let spinnerStep = 1;

function showSpinnerFrame(index) {
  const { glyph, size } = spinnerFrames[index];
  asciiSpinner.textContent = glyph;
  asciiSpinner.style.fontSize = `${size * 1.1}em`;
}

function startSpinner() {
  if (!asciiTart || spinnerTimer) return;
  spinnerTimer = setInterval(() => {
    // Ping-pong through the frames
    if (spinnerFrame + spinnerStep < 0 || spinnerFrame + spinnerStep >= spinnerFrames.length) spinnerStep *= -1;
    spinnerFrame += spinnerStep;
    showSpinnerFrame(spinnerFrame);
  }, 120);
}

function stopSpinner() {
  clearInterval(spinnerTimer);
  spinnerTimer = null;
  spinnerFrame = spinnerRest;
  spinnerStep = 1;
  if (asciiTart) showSpinnerFrame(spinnerRest);
}

themeToggle.addEventListener("mouseenter", startSpinner);
themeToggle.addEventListener("mouseleave", stopSpinner);
themeToggle.addEventListener("click", toggleTheme);
themeToggle.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); }
});

// ================================
// COMMAND BAR (Cmd+K / Ctrl+K)
// ================================

const cmdBarOverlay = document.getElementById("cmd-bar-overlay");
const cmdBar = document.getElementById("cmd-bar");
const cmdBarInput = document.getElementById("cmd-bar-input");
const cmdBarList = document.getElementById("cmd-bar-list");

// Shuffle helper (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cocktailUrls = shuffle([
  "https://www.liquor.com/recipes/negroni/",
  "https://www.liquor.com/recipes/margarita/",
  "https://www.liquor.com/recipes/espresso-martini/",
  "https://www.liquor.com/recipes/whiskey-sour/",
  "https://www.liquor.com/recipes/aperol-spritz/",
  "https://www.liquor.com/recipes/daiquiri/",
]);
let cocktailIndex = 0;

// Lucide-style inline SVGs (24x24, stroke-based)
const cmdIcons = {
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  music: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  cocktail: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>',
  terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19h8"/><path d="m4 17 6-6-6-6"/></svg>',
};

// ================================
// ASCII THEME (Canvas UI ASCII Object, loaded on first use)
// ================================

const tartCanvas = document.getElementById("egg-tart-canvas");
const asciiCanvas = document.getElementById("ascii-canvas");
let asciiTart = null;
let asciiSpin = null;
let stopAsciiLoop = null;
let asciiResize = null;
let themeBeforeAscii = null;

let cbBusy = false; // ignore Code Blue toggles while a transition runs

function animationsDone(...els) {
  return new Promise((resolve) =>
    requestAnimationFrame(() =>
      Promise.all(els.flatMap((el) => el.getAnimations()).map((a) => a.finished.catch(() => {}))).then(resolve)
    )
  );
}

// Soft dissolve between the 3D and ASCII tarts (keyframes in style.css).
// dir is "in" or "out"; applyTheme() flips data-theme and the icon.
async function dissolveCodeBlue(dir, applyTheme) {
  const incoming = dir === "in" ? asciiCanvas : tartCanvas;
  const outgoing = dir === "in" ? tartCanvas : asciiCanvas;
  const cls = `cb-dissolve-${dir}`;
  html.classList.add(cls); // keyframes take over both canvases…
  incoming.hidden = false;
  incoming.style.opacity = ""; // …so dropping the pre-load opacity can't flash
  applyTheme(); // the tokens tween through @property
  await animationsDone(incoming, outgoing);
  outgoing.hidden = true;
  html.classList.remove(cls);
}

async function enterAsciiTheme() {
  if (cbBusy) return;
  cbBusy = true;
  const [{ createAsciiObject }, { TART_SCENE, cameraDistanceFor, createTartSpin, animateWhileVisible }] = await Promise.all([
    import("./canvasui-ascii-object.js"),
    import("./tart-shared.js"),
  ]);
  // Put the resting tilt in the camera rather than the model. Tilting the glossy
  // model toward ASCII Object's fixed studio lights washes the custard out in white.
  const [, camY, camZ] = TART_SCENE.cameraPosition;
  const elevation = Math.atan2(camY, camZ) + TART_SCENE.tilt;
  themeBeforeAscii = html.getAttribute("data-theme");

  // Mount the ASCII canvas invisibly and wait for its model, so the dissolve
  // never fades into an empty canvas
  asciiCanvas.style.opacity = "0";
  asciiCanvas.hidden = false;
  let markLoaded;
  const loaded = new Promise((resolve) => (markLoaded = resolve));

  asciiTart = createAsciiObject({ canvas: asciiCanvas }, {
    src: "static/egg-tart.glb",
    edgeContrast: 2.5,
    environmentIntensity: 0.6,
    roughness: 0.27,
    exposure: 1.6,
    // Same framing as the 3D tart
    fov: TART_SCENE.fov,
    scale: TART_SCENE.size,
    cameraDistance: cameraDistanceFor(asciiCanvas.clientWidth / asciiCanvas.clientHeight),
    cameraDirection: [0, Math.sin(elevation), Math.cos(elevation)],
    yOffset: -0.3, // cancels ASCII Object's built-in lift so the tart spins in place
    // Spin and bob come from tart-shared.js, not ASCII Object's orbit camera and float
    orbit: false,
    rotationIntensity: 0,
    floatIntensity: 0,
    onLoad: () => markLoaded(),
    onError: () => markLoaded(), // never strand the page mid-switch
  });

  // OrbitControls sets touch-action: none, which would block scrolling past the hero on phones
  asciiCanvas.style.touchAction = "";
  // Keep the same narrow-screen camera distance as the 3D tart when the hero resizes
  asciiResize = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = asciiCanvas;
    if (clientWidth && clientHeight) asciiTart.setOptions({ cameraDistance: cameraDistanceFor(clientWidth / clientHeight) });
  });
  asciiResize.observe(asciiCanvas);
  asciiSpin = createTartSpin({ canvas: asciiCanvas, hits: asciiTart.hitTest });
  stopAsciiLoop = animateWhileVisible(asciiCanvas, () => {
    const { x, y, bob } = asciiSpin.step();
    asciiTart.setModelPose(x - TART_SCENE.tilt, y, bob); // the camera already holds the tilt
  });

  await loaded;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))); // first ASCII frame painted
  await dissolveCodeBlue("in", () => {
    html.setAttribute("data-theme", "ascii");
    showSpinnerFrame(spinnerRest);
    syncIcon();
  });
  cbBusy = false;
}

async function exitAsciiTheme() {
  if (cbBusy) return;
  cbBusy = true;
  stopSpinner();
  asciiSpinner.textContent = ""; // keep the glyph out of the page text, which reads "Madeline Hou"
  await dissolveCodeBlue("out", () => {
    if (themeBeforeAscii) html.setAttribute("data-theme", themeBeforeAscii);
    else html.removeAttribute("data-theme");
    syncIcon();
  });
  stopAsciiLoop();
  asciiResize.disconnect();
  asciiSpin.destroy();
  asciiSpin = null;
  asciiTart.destroy();
  asciiTart = null;
  cbBusy = false;
}

const commands = [
  {
    id: "theme",
    get icon() { return isDarkTheme() ? cmdIcons.sun : cmdIcons.moon; },
    label: "Switch theme",
    hint: "",
    action() { toggleTheme(); },
  },
  {
    id: "ascii",
    icon: cmdIcons.terminal,
    label: "Code Blue", // toggles the ASCII theme
    hint: "",
    hidden: true,
    action() { asciiTart ? exitAsciiTheme() : enterAsciiTheme(); },
  },
  {
    id: "playlist",
    icon: cmdIcons.music,
    label: "Play the hits",
    hint: "",
    hidden: true,
    action() { window.open("https://open.spotify.com/playlist/0zVqbdRubtK7dUGz5twR4i?si=cb76d2c213c34410", "_blank"); },
  },
  {
    id: "cocktail",
    icon: cmdIcons.cocktail,
    label: "Make a drink",
    hint: "",
    hidden: true,
    exhausted: false,
    action() {
      if (this.exhausted) return;
      window.open(cocktailUrls[cocktailIndex], "_blank");
      cocktailIndex++;
      if (cocktailIndex >= cocktailUrls.length) {
        this.exhausted = true;
        this.label = "Make a drink (All tried!)";
      }
    },
  },
];

let activeIndex = 0;

function renderCommands(filter = "") {
  const lower = filter.toLowerCase();
  // Hidden commands only show up once the visitor starts typing
  const visible = commands.filter((c) => (lower || !c.hidden) && c.label.toLowerCase().startsWith(lower));
  cmdBarList.innerHTML = "";

  visible.forEach((cmd, i) => {
    const btn = document.createElement("button");
    btn.className = "cmd-bar-item" + (i === 0 ? " active" : "");
    btn.setAttribute("role", "option");
    if (cmd.exhausted) btn.disabled = true;

    btn.innerHTML = `
      <span class="cmd-bar-item-icon">${cmd.icon}</span>
      <span class="cmd-bar-item-label">${cmd.label}</span>
      ${cmd.hint ? `<span class="cmd-bar-item-hint">${cmd.hint}</span>` : ""}
    `;

    btn.addEventListener("click", () => {
      if (!cmd.exhausted) {
        cmd.action();
        closeCmdBar();
      }
    });

    cmdBarList.appendChild(btn);
  });

  activeIndex = 0;
}

function setActive(index) {
  const items = cmdBarList.querySelectorAll(".cmd-bar-item");
  if (!items.length) return;
  items.forEach((el) => el.classList.remove("active"));
  activeIndex = ((index % items.length) + items.length) % items.length;
  items[activeIndex].classList.add("active");
  items[activeIndex].scrollIntoView({ block: "nearest" });
}

function openCmdBar() {
  cmdBarOverlay.classList.add("visible");
  cmdBar.classList.add("visible");
  cmdBarInput.value = "";
  renderCommands();
  cmdBarInput.focus();
}

function closeCmdBar() {
  cmdBarOverlay.classList.remove("visible");
  cmdBar.classList.remove("visible");
  cmdBarInput.blur();
}

function isCmdBarOpen() {
  return cmdBar.classList.contains("visible");
}

// Global keybinding
document.addEventListener("keydown", (e) => {
  // Cmd+K / Ctrl+K (may be intercepted by browser, so we also support /)
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    if (isCmdBarOpen()) closeCmdBar();
    else openCmdBar();
    return;
  }

  // "/" opens the bar when not typing in an input
  if (e.key === "/" && !isCmdBarOpen() && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    e.preventDefault();
    openCmdBar();
    return;
  }

  if (!isCmdBarOpen()) return;

  if (e.key === "Escape") {
    closeCmdBar();
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActive(activeIndex + 1);
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    setActive(activeIndex - 1);
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const items = cmdBarList.querySelectorAll(".cmd-bar-item");
    if (items[activeIndex] && !items[activeIndex].disabled) {
      items[activeIndex].click();
    }
  }
});

// Filter on input
cmdBarInput.addEventListener("input", () => {
  renderCommands(cmdBarInput.value);
});

// Close on overlay click
cmdBarOverlay.addEventListener("click", closeCmdBar);

// Trigger button
const cmdTrigger = document.getElementById("cmd-trigger");
cmdTrigger.addEventListener("click", openCmdBar);

// ================================
// HERO HINT + SCROLL INDICATOR
// ================================

const heroHint = document.querySelector(".hero-hint");
const scrollIndicator = document.querySelector(".scroll-indicator");

// Centered with xPercent (not a CSS transform) so the y tweens below don't fight it
gsap.set([heroHint, scrollIndicator], { xPercent: -50 });

// First-load intro, once the tart's first frame is on screen: the canvas
// fades and settles (style.css), then the hints follow
function playIntro() {
  if (html.classList.contains("tart-ready")) return;
  html.classList.add("tart-ready");
  animationsDone(tartCanvas).then(() => html.classList.add("intro-done"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lift = reduce ? 0 : 6;
  gsap.timeline({ defaults: { ease: "quint.out", duration: reduce ? 0.2 : 0.3 } })
    .fromTo(heroHint, { opacity: 0, y: lift }, { opacity: 1, y: 0 }, 0.22)
    .fromTo(scrollIndicator, { opacity: 0, y: lift }, { opacity: 1, y: 0 }, 0.32)
    .to(cmdTrigger, { opacity: 1, onStart: () => cmdTrigger.classList.add("revealed") }, 0.42)
    .to(heroHint, { opacity: 0, duration: 1, ease: "power1.inOut" }, 3.5);
}
document.addEventListener("tart:ready", playIntro, { once: true });
setTimeout(playIntro, 4000); // model failed or the network is very slow: show the page anyway

// Fade out scroll indicator when scrolling away from hero
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "bottom top",
  onLeave: () => gsap.to(scrollIndicator, { opacity: 0, duration: 0.3 }),
  onEnterBack: () => gsap.to(scrollIndicator, { opacity: 1, duration: 0.3 }),
});

// ================================
// INFO SECTION SCROLL REVEALS
// ================================

gsap.to(".info-name", {
  opacity: 1,
  y: 0,
  duration: 0.52,
  ease: "quint.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 85%",
  },
});

gsap.to(".info-links", {
  opacity: 1,
  y: 0,
  duration: 0.52,
  delay: 0.12,
  ease: "quint.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
  },
});
