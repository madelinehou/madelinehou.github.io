gsap.registerPlugin(Draggable, InertiaPlugin, SplitText, ScrambleTextPlugin, Physics2DPlugin);

// Timeline
const pageLoadTimeline = gsap.timeline();
const gridLinks = document.querySelector('.grid-links');
const links = document.querySelectorAll('.grid-links a');
const originalText = Array.from(links).map(link => link.textContent);

const firstNameCube = document.querySelectorAll('.name-cube')[0];
const lastNameCube = document.querySelectorAll('.name-cube')[1];

document.fonts.ready.then(() => {
    gsap.set(".split", { opacity: 1 });

    const splitText = new SplitText(".split", {
        type: "words,lines",
        linesClass: "line",
        autoSplit: true,
        mask: "lines"
    });

    // Mask split text
    pageLoadTimeline.from(splitText.lines, {
        duration: 1.4,
        yPercent: 100,
        opacity: 0,
        stagger: 0.15,
        ease: "expo.out"
    });

    // 3D split text
    pageLoadTimeline.to(firstNameCube, {
        rotationX: -180,
        duration: 0.6,
        ease: "power2.inOut",
        stagger: 0.15
    }, "-=1.4")

    // Text scramble
    pageLoadTimeline.add(() => {
        links.forEach((link, index) => {
            gsap.to(link, {
                duration: 0.7,
                scrambleText: {
                    text: originalText[index],
                    chars: originalText[index],
                    speed: 0.2,
                    revealDelay: 0.1
                }
            });
        });
    });
});

/* ================================
   NAME SECTION
   ================================ */
// 3D split text
const gridName = document.querySelector('.grid-name');
const nameCubes = document.querySelectorAll('.name-cube');

gridName.addEventListener('mouseenter', () => {
    gsap.to(firstNameCube, {
        rotationX: -90,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0.1
    });
    gsap.to(lastNameCube, {
        rotationX: 90,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0.1
    });
});

gridName.addEventListener('mouseleave', () => {
    gsap.to(nameCubes, {
        rotationX: 0,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0.1
    });
});

document.querySelectorAll('.name-cube-container').forEach(container => {
    const cube = container.querySelector('.name-cube');
    const rotateCube = () => {
        const currentRotation = gsap.getProperty(cube, "rotationX");
        const targetRotation = Math.round(currentRotation / 180) * 180 - 180;
        gsap.to(cube, {
            rotationX: targetRotation,
            duration: 0.4,
            ease: "power2.inOut"
        });
    };
    container.addEventListener('click', rotateCube);
    container.addEventListener('touchstart', rotateCube);
});

/* ================================
   INTERESTS SECTION
   ================================ */
// Circular highlight
document.querySelectorAll('.skill-card').forEach(card => {
    const highlight = document.createElement('span');
    highlight.className = 'hover-fill';
    card.appendChild(highlight);

    const cardIndex = Array.from(card.parentNode.children).indexOf(card);
    const colorOptions = ['var(--color-yellow)', 'var(--color-orange)', 'var(--color-blue)'];
    const highlightColor = colorOptions[cardIndex % 3];

    card.addEventListener('mouseenter', () => {
        const cardRect = card.getBoundingClientRect();
        const sizeAdjustment = Math.floor(Math.random() * 30) * (Math.random() > 0.3 ? 1 : -1);

        gsap.set(highlight, {
            width: cardRect.width * 0.5 + sizeAdjustment,
            height: cardRect.width * 0.5 + sizeAdjustment,
            borderRadius: '50%',
            backgroundColor: highlightColor,
            opacity: 0.7,
        });

        gsap.to(highlight, { opacity: 0.7, duration: 0.3, ease: 'power1.out' });
    });

    card.addEventListener('mousemove', (e) => {
        const cardRect = card.getBoundingClientRect();
        gsap.to(highlight, {
            x: e.clientX - cardRect.left - (cardRect.width * 0.5),
            y: e.clientY - cardRect.top - (cardRect.width * 0.35),
            duration: 0.2,
            ease: 'power1.out'
        });
    });

    card.addEventListener('touchstart', (e) => {
        const cardRect = card.getBoundingClientRect();
        const touch = e.touches[0];

        gsap.set(highlight, {
            width: cardRect.width * 0.5,
            height: cardRect.width * 0.5,
            borderRadius: '50%',
            backgroundColor: highlightColor,
            opacity: 0.7,
            x: touch.clientX - cardRect.left - (cardRect.width * 0.5),
            y: touch.clientY - cardRect.top - (cardRect.width * 0.35)
        });

        gsap.to(highlight, { opacity: 0.7, duration: 0.3, ease: 'power1.out' });
    });

    card.addEventListener('touchmove', (e) => {
        const cardRect = card.getBoundingClientRect();
        const touch = e.touches[0];
        gsap.to(highlight, {
            x: touch.clientX - cardRect.left - (cardRect.width * 0.5),
            y: touch.clientY - cardRect.top - (cardRect.width * 0.35),
            duration: 0.2,
            ease: 'power1.out'
        });
    });
});

// Physics2D Confetti
function initGuaBaoConfetti() {
    const guaBaoText = document.querySelector('.gua-bao-text');
    if (!guaBaoText) return;

    guaBaoText.addEventListener('click', (event) => {
        const confettiCount = gsap.utils.random(12, 25, 1);

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('gua-bao-confetti');

            const img = document.createElement('img');
            img.src = 'static/gua-bao.png';
            img.alt = 'gua bao';
            confetti.appendChild(img);
            document.body.appendChild(confetti);

            gsap.set(confetti, {
                position: 'fixed',
                top: event.clientY - 100,
                left: event.clientX - 100,
                scale: 0,
                rotation: gsap.utils.random(0, 360),
                zIndex: 9999,
                pointerEvents: 'none'
            });

            gsap.timeline({
                onComplete: () => confetti.remove()
            })
                .to(confetti, {
                    scale: gsap.utils.random(0.4, 1),
                    duration: 0.2, // Quick pop-in
                    ease: "back.out(2)"
                })
                .to(confetti, {
                    duration: 2.5,
                    physics2D: {
                        velocity: gsap.utils.random(300, 800),
                        angle: gsap.utils.random(0, 360),
                        gravity: 1200
                    },
                    rotation: `+=${gsap.utils.random(360, 720)}`, // Additional rotation during flight
                    autoAlpha: 0, // Fade out towards the end
                    ease: "none"
                }, "<"); // Start together with the previous tween
        }
    });
}
initGuaBaoConfetti();

/* ================================
   SKILLS SECTION
   ================================ */
// Click-and-drag
Draggable.create(".skill-card", {
    inertia: true,
    bounds: ".main-grid",
    edgeResistance: 0.5,
    snap: { x: 1, y: 1 },
    cursor: 'none',
    onDragStart: function () {
        this.target.classList.add('dragging');
    },
    onDrag: function () {
        const skillText = this.target.querySelector('.skill-text');
        const skillIcon = this.target.querySelector('.skill-icon');

        if (skillText) {
            gsap.to(skillText, {
                x: this.x * -0.1,
                y: this.y * -0.1,
                duration: 0.3,
                ease: "power2.out",
                overwrite: "auto"
            });
        }
        if (skillIcon) {
            gsap.to(skillIcon, {
                x: this.x * -0.1,
                y: this.y * -0.1,
                duration: 0.3,
                ease: "sine.out",
                overwrite: "auto"
            });
        }
    },
    onDragEnd: function () {
        this.target.classList.remove('dragging');
        const skillText = this.target.querySelector('.skill-text');
        const skillIcon = this.target.querySelector('.skill-icon');

        if (skillText) {
            gsap.to(skillText, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)",
                overwrite: "auto"
            });
        }
        if (skillIcon) {
            gsap.to(skillIcon, {
                x: 0,
                y: 0,
                duration: 1.5,
                ease: "elastic.out(1, 0.3)",
                overwrite: "auto"
            });
        }
    }
});
