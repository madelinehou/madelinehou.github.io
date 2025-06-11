gsap.registerPlugin(Draggable, InertiaPlugin, SplitText, ScrambleTextPlugin);

// 3D split text
const gridName = document.querySelector('.grid-name');
const nameCubes = document.querySelectorAll('.name-cube');
gsap.set(nameCubes, { rotationX: 0 });

gridName.addEventListener('mouseenter', () => {
    gsap.to(nameCubes, {
        rotationX: -90,
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

// Timeline animations
const pageLoadTimeline = gsap.timeline();
const gridLinks = document.querySelector('.grid-links');
const links = document.querySelectorAll('.grid-links a');
const originalText = Array.from(links).map(link => link.textContent);

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
        duration: 1.5,
        yPercent: 100,
        opacity: 0,
        stagger: 0.15,
        ease: "expo.out"
    });

    // 3D split text
    pageLoadTimeline.to(nameCubes, {
        rotationX: -180,
        duration: 0.6,
        ease: "power2.inOut",
        stagger: 0.1
    }, "-=1.7")

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

// Circular highlight
document.querySelectorAll('.skill-card').forEach(card => {
    const highlight = document.createElement('span');
    highlight.className = 'hover-fill';
    card.appendChild(highlight);

    const cardIndex = Array.from(card.parentNode.children).indexOf(card);
    const colorOptions = ['var(--color-yellow)', 'var(--color-orange)', 'var(--color-blue)'];
    const highlightColor = colorOptions[cardIndex % 3];

    const highlightShapesForMobile = [
        'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
        'polygon(50% 0%, 0% 100%, 100% 100%)', // Triangle
        'circle(50% at 50% 50%)',
    ]

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
            clipPath: highlightShapesForMobile[Math.floor(Math.random() * highlightShapesForMobile.length)],
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
