gsap.registerPlugin(SplitText, Draggable, InertiaPlugin);

Draggable.create(".skill-card", {
    inertia: true,
    bounds: ".main-grid",
    edgeResistance: 0.2,
    snap: { x: 1, y: 1 },
});

document.fonts.ready.then(() => {
    gsap.set(".split", { opacity: 1 });

    let split;
    SplitText.create(".split", {
        type: "words,lines",
        linesClass: "line",
        autoSplit: true,
        mask: "lines",
        onSplit: (self) => {
            split = gsap.from(self.lines, {
                duration: 1.5,
                yPercent: 100,
                opacity: 0,
                stagger: 0.15,
                ease: "expo.out",
            });
            return split;
        }
    });
});

document.querySelectorAll('.skill-card').forEach(card => {
    const fillElement = document.createElement('span');
    fillElement.className = 'hover-fill';
    card.appendChild(fillElement);
    let hoverTl;
    let isHovering = false;

    card.addEventListener('mouseenter', (e) => {
        isHovering = true;
        const rect = card.getBoundingClientRect();

        let fillColor;
        const cardIndex = Array.from(card.parentNode.children).indexOf(card);
        if (cardIndex % 3 === 0) {
            fillColor = 'var(--color-yellow)';
        } else if (cardIndex % 3 === 1) {
            fillColor = 'var(--color-orange)';
        } else {
            fillColor = 'var(--color-blue)';
        }

        gsap.set(fillElement, {
            width: rect.width * 0.5,
            height: rect.width * 0.5,
            borderRadius: '50%',
            backgroundColor: fillColor,
            opacity: 0.7,
        });

        gsap.to(fillElement, {
            opacity: 0.7,
            duration: 0.3,
            ease: 'power1.out'
        });
    });

    card.addEventListener('mousemove', (e) => {
        if (!isHovering) return;
        const rect = card.getBoundingClientRect();

        gsap.to(fillElement, {
            x: e.clientX - rect.left - (rect.width * 0.5),
            y: e.clientY - rect.top - (rect.width * 0.35),
            duration: 0.2,
            ease: 'power1.out'
        });
    });
});
