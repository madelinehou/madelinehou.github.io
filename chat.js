const chatFab = document.getElementById("chat-fab");
const chatFabSpinner = document.getElementById("chat-fab-spinner");
const chatWindow = document.getElementById("chat-window");
const chatClose = document.getElementById("chat-close");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const chatProgress = document.getElementById("chat-progress");
const chatProgressBar = document.getElementById("chat-progress-bar");
const chatProgressText = document.getElementById("chat-progress-text");

let worker = null;
let modelReady = false;
let generating = false;
let conversationHistory = [];

// WebGPU check — also exclude mobile (not enough VRAM for the model)
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function hasWebGPU() {
  return !!navigator.gpu && !isMobile();
}

// Show/hide helpers
function show(el) { el.classList.add("visible"); }
function hide(el) { el.classList.remove("visible"); }

// Secret triggered — show spinner, start loading model, then reveal icon
window.addEventListener("egg-tart-secret", () => {
  if (!hasWebGPU()) return;
  chatFab.classList.add("revealed");
  chatFab.classList.add("loading");
  try {
    initWorker();
  } catch {
    chatFab.classList.remove("revealed", "loading");
  }
}, { once: true });

let chatDraggable = null;
let wasDragged = false;

function openChat() {
  chatFab.classList.remove("revealed");
  // Reset drag position so CSS placement applies fresh
  gsap.set(chatWindow, { x: 0, y: 0 });
  show(chatWindow);
  chatInput.focus();
  if (!chatDraggable) initDraggable();
}

function closeChat() {
  hide(chatWindow);
  chatFab.classList.add("revealed");
}

function initDraggable() {
  const header = chatWindow.querySelector(".chat-header");
  let lastX = 0, lastY = 0, lastTime = 0;
  let vx = 0, vy = 0;

  chatDraggable = Draggable.create(chatWindow, {
    trigger: header,
    type: "x,y",
    cursor: "grab",
    activeCursor: "grabbing",
    onDragStart() {
      wasDragged = false;
      lastX = this.x;
      lastY = this.y;
      lastTime = Date.now();
      vx = 0;
      vy = 0;
    },
    onDrag() {
      wasDragged = true;
      const now = Date.now();
      const dt = Math.max(now - lastTime, 1);
      // Smooth velocity with a blend so it's not jerky
      vx = 0.7 * vx + 0.3 * ((this.x - lastX) / dt * 1000);
      vy = 0.7 * vy + 0.3 * ((this.y - lastY) / dt * 1000);
      lastX = this.x;
      lastY = this.y;
      lastTime = now;
    },
    onDragEnd() {
      const d = chatDraggable;
      const maxV = 1200;
      vx = Math.max(-maxV, Math.min(maxV, vx));
      vy = Math.max(-maxV, Math.min(maxV, vy));

      // Viewport bounds
      const rect = chatWindow.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      const vw = window.innerWidth, vh = window.innerHeight;
      const pad = 20;
      const originX = rect.left - this.x;
      const originY = rect.top - this.y;
      const minX = pad - originX;
      const maxX = vw - pad - w - originX;
      const minY = pad - originY;
      const maxY = vh - pad - h - originY;

      // Simulate physics: step forward in time, bounce off walls
      let px = this.x, py = this.y;
      let cvx = vx, cvy = vy;
      const dt = 1 / 60;
      const drag = 0.95; // per-frame friction
      const restitution = 0.5; // how much velocity is preserved on bounce
      const steps = 120; // 2 seconds of simulation
      let bounced = false;

      for (let i = 0; i < steps; i++) {
        px += cvx * dt;
        py += cvy * dt;
        cvx *= drag;
        cvy *= drag;

        if (px < minX) { px = minX; cvx = Math.abs(cvx) * restitution; bounced = true; }
        else if (px > maxX) { px = maxX; cvx = -Math.abs(cvx) * restitution; bounced = true; }
        if (py < minY) { py = minY; cvy = Math.abs(cvy) * restitution; bounced = true; }
        else if (py > maxY) { py = maxY; cvy = -Math.abs(cvy) * restitution; bounced = true; }

        // Stop early if velocity is negligible
        if (Math.abs(cvx) < 1 && Math.abs(cvy) < 1) break;
      }

      // Build keyframes from the simulation for a natural path
      const frames = [];
      let sx = this.x, sy = this.y;
      let svx = vx, svy = vy;
      const frameInterval = 3; // sample every N steps
      for (let i = 0; i < steps; i++) {
        sx += svx * dt;
        sy += svy * dt;
        svx *= drag;
        svy *= drag;
        if (sx < minX) { sx = minX; svx = Math.abs(svx) * restitution; }
        else if (sx > maxX) { sx = maxX; svx = -Math.abs(svx) * restitution; }
        if (sy < minY) { sy = minY; svy = Math.abs(svy) * restitution; }
        else if (sy > maxY) { sy = maxY; svy = -Math.abs(svy) * restitution; }
        if (i % frameInterval === 0) frames.push({ x: sx, y: sy });
        if (Math.abs(svx) < 1 && Math.abs(svy) < 1) {
          frames.push({ x: sx, y: sy });
          break;
        }
      }

      if (frames.length < 2) {
        // Almost no velocity, just stay put
        return;
      }

      const duration = Math.min(frames.length * frameInterval * dt, 1.5);
      gsap.to(chatWindow, {
        keyframes: frames,
        duration,
        ease: "none",
        onUpdate() { d.update(); },
      });
    },
  })[0];
}

// FAB click → open chat
chatFab.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!hasWebGPU()) return;
  openChat();
});

// Close chat via X button
chatClose.addEventListener("click", () => closeChat());

// Close chat by clicking outside (but not after a drag)
document.addEventListener("click", (e) => {
  if (!chatWindow.classList.contains("visible")) return;
  if (wasDragged) { wasDragged = false; return; }
  if (!chatWindow.contains(e.target) && e.target !== chatFab) closeChat();
});

// Reset chat
const chatReset = document.getElementById("chat-reset");
chatReset.addEventListener("click", () => {
  conversationHistory = [];
  chatMessages.innerHTML = "";
  generating = false;
  streamBubble = null;
  streamText = "";
  chatReset.classList.remove("spin");
  void chatReset.offsetWidth;
  chatReset.classList.add("spin");
  chatReset.addEventListener("animationend", () => chatReset.classList.remove("spin"), { once: true });
});

// Send message
chatSend.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || generating) return;

  appendMessage("user", text);
  chatInput.value = "";
  chatInput.style.height = "auto";

  conversationHistory.push({ role: "user", content: text });

  generating = true;
  showTypingIndicator();

  worker.postMessage({ type: "generate", messages: conversationHistory });
}

function appendMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  scrollToBottom();
}

function showTypingIndicator() {
  const existing = chatMessages.querySelector(".typing-indicator");
  if (existing) return;

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(indicator);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = chatMessages.querySelector(".typing-indicator");
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Streaming bubble for bot response
let streamBubble = null;
let streamText = "";

function cleanupOnFailure() {
  hide(chatProgress);
  chatFab.classList.remove("revealed", "loading");
  if (worker) { worker.terminate(); worker = null; }
}

function initWorker() {
  worker = new Worker("chat-worker.js", { type: "module" });

  worker.onerror = () => cleanupOnFailure();

  worker.onmessage = (e) => {
    const { type } = e.data;

    if (type === "status") {
      chatProgressText.textContent = e.data.message;
    } else if (type === "progress") {
      show(chatProgress);
      const pct = Math.round(e.data.progress);
      chatProgressBar.style.width = `${pct}%`;
      chatProgressText.textContent = `Loading model... ${pct}%`;
    } else if (type === "ready") {
      modelReady = true;
      hide(chatProgress);
      chatProgressText.textContent = "";
      // Transition FAB from spinner to emoji
      chatFab.classList.remove("loading");
    } else if (type === "gen_start") {
      hideTypingIndicator();
      streamText = "";
      streamBubble = document.createElement("div");
      streamBubble.className = "chat-bubble bot";
      streamBubble.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
      chatMessages.appendChild(streamBubble);
      scrollToBottom();
    } else if (type === "gen_token") {
      // Clear dots on first token
      const dots = streamBubble.querySelector(".typing-dots");
      if (dots) dots.remove();
      streamText += e.data.token;
      streamBubble.textContent = streamText;
      scrollToBottom();
    } else if (type === "gen_done") {
      if (e.data.truncated) {
        const continuation = [
          ...conversationHistory,
          { role: "assistant", content: streamText },
        ];
        worker.postMessage({ type: "generate", messages: continuation, isContinuation: true });
      } else {
        generating = false;
        conversationHistory.push({ role: "assistant", content: streamText });
        streamBubble = null;
      }
    } else if (type === "error") {
      if (!modelReady) {
        // Model failed to load — quietly hide everything
        cleanupOnFailure();
      } else {
        hideTypingIndicator();
        generating = false;
        appendMessage("bot", "Oops, something went wrong. Try again?");
      }
    }
  };

  worker.postMessage({ type: "load" });
  show(chatProgress);
  chatProgressText.textContent = "Preparing model...";
}

