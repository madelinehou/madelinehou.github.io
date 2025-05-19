gsap.registerPlugin(Draggable, InertiaPlugin, SplitText, ScrambleTextPlugin);

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
    edgeResistance: 0.2,
    snap: { x: 1, y: 1 },
    cursor: 'none'
});

// Circular highlight
document.querySelectorAll('.skill-card').forEach(card => {
    const highlight = document.createElement('span');
    highlight.className = 'hover-fill';
    card.appendChild(highlight);

    const cardIndex = Array.from(card.parentNode.children).indexOf(card);
    const colorOptions = ['var(--color-yellow)', 'var(--color-orange)', 'var(--color-blue)'];
    const highlightColor = colorOptions[cardIndex % 3];

    const highlightShapes = [
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
            clipPath: highlightShapes[Math.floor(Math.random() * highlightShapes.length)],
            backgroundColor: highlightColor,
            opacity: 0.7,
            x: touch.clientX - cardRect.left - (cardRect.width * 0.5),
            y: touch.clientY - cardRect.top - (cardRect.width * 0.35)
        });

        gsap.to(highlight, { opacity: 0.7, duration: 0.3, ease: 'power1.out' });
    });
});
