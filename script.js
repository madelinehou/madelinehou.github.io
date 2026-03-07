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

function syncIcon() {
  const theme = html.getAttribute("data-theme");
  const isDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  themeToggle.classList.toggle("is-sun", isDark);
}
syncIcon();

function toggleTheme() {
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

themeToggle.addEventListener("click", toggleTheme);
themeToggle.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); }
});

// ================================
// HERO HINT + SCROLL INDICATOR
// ================================

const heroHint = document.querySelector(".hero-hint");
const scrollIndicator = document.querySelector(".scroll-indicator");

// Show "drag to spin" hint after a brief delay, then fade it out
gsap.to(heroHint, {
  opacity: 1,
  delay: 1.5,
  duration: 0.8,
  ease: "power1.out",
  onComplete: () => {
    gsap.to(heroHint, { opacity: 0, delay: 3, duration: 1 });
  },
});

// Show scroll indicator
gsap.to(scrollIndicator, {
  opacity: 1,
  delay: 2,
  duration: 0.8,
  ease: "power1.out",
});

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
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
  },
});

gsap.to(".info-tagline", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  delay: 0.15,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
  },
});

gsap.to(".info-links", {
  opacity: 1,
  y: 0,
  duration: 0.8,
  delay: 0.3,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
  },
});
