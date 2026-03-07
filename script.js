gsap.registerPlugin(ScrollTrigger);

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
