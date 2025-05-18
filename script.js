gsap.registerPlugin(SplitText, Draggable, InertiaPlugin);

// Click-and-draggable
Draggable.create(".skill-card", {
    inertia: true,
    bounds: ".main-grid",
    edgeResistance: 0.2,
    snap: { x: 1, y: 1 },
});

// Mask split text
document.fonts.ready.then(() => {
    gsap.set(".split", { opacity: 1 });

    SplitText.create(".split", {
        type: "words,lines",
        linesClass: "line",
        autoSplit: true,
        mask: "lines",
        onSplit: (self) => {
            return gsap.from(self.lines, {
                duration: 1.5,
                yPercent: 100,
                opacity: 0,
                stagger: 0.15,
                ease: "expo.out",
            });
        }
    });
});

// Circular highlight on hover
document.querySelectorAll('.skill-card').forEach(card => {
    const highlight = document.createElement('span');
    highlight.className = 'hover-fill';
    card.appendChild(highlight);

    const cardRect = card.getBoundingClientRect();
    const cardIndex = Array.from(card.parentNode.children).indexOf(card);

    card.addEventListener('mouseenter', (e) => {
        const colorOptions = ['var(--color-yellow)', 'var(--color-orange)', 'var(--color-blue)'];
        const highlightColor = colorOptions[cardIndex % 3];

        gsap.set(highlight, {
            width: cardRect.width * 0.5,
            height: cardRect.width * 0.5,
            borderRadius: '50%',
            backgroundColor: highlightColor,
            opacity: 0.7,
        });

        gsap.to(highlight, { opacity: 0.7, duration: 0.3, ease: 'power1.out' });
    });

    card.addEventListener('mousemove', (e) => {
        gsap.to(highlight, {
            x: e.clientX - cardRect.left - (cardRect.width * 0.5),
            y: e.clientY - cardRect.top - (cardRect.width * 0.35),
            duration: 0.2,
            ease: 'power1.out'
        });
    });
});
