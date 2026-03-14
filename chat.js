const chatFab = document.getElementById("chat-fab");
const chatFabEmoji = document.getElementById("chat-fab-emoji");
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

// WebGPU check
function hasWebGPU() {
  return !!navigator.gpu;
}

// Show/hide helpers
function show(el) { el.classList.add("visible"); }
function hide(el) { el.classList.remove("visible"); }

// Secret triggered — show spinner, start loading model, then reveal icon
window.addEventListener("egg-tart-secret", () => {
  if (!hasWebGPU()) {
    showNoBrowserSupport();
    return;
  }
  chatFab.classList.add("revealed");
  chatFab.classList.add("loading");
  initWorker();
}, { once: true });

// FAB click → toggle chat
chatFab.addEventListener("click", () => {
  if (!hasWebGPU()) {
    showNoBrowserSupport();
    return;
  }
  if (chatWindow.classList.contains("visible")) {
    hide(chatWindow);
  } else {
    show(chatWindow);
    chatInput.focus();
  }
});

// Close chat
chatClose.addEventListener("click", () => {
  hide(chatWindow);
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

function initWorker() {
  worker = new Worker("chat-worker.js", { type: "module" });

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
      hideTypingIndicator();
      generating = false;
      appendMessage("bot", `Oops, something went wrong: ${e.data.error}`);
    }
  };

  worker.postMessage({ type: "load" });
  show(chatProgress);
  chatProgressText.textContent = "Preparing model...";
}

function showNoBrowserSupport() {
  const overlay = document.createElement("div");
  overlay.className = "chat-no-webgpu";
  overlay.innerHTML = `
    <div class="chat-no-webgpu-content">
      <div class="chat-no-webgpu-emoji">🥲</div>
      <p>WebGPU isn't available in this browser.</p>
      <p>Try Chrome or Edge on desktop for the full experience!</p>
      <button class="chat-no-webgpu-close">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  overlay.querySelector(".chat-no-webgpu-close").addEventListener("click", () => {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 300);
  });
}
