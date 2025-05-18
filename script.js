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
