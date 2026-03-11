const pNormSketch = (p) => {
    let pSlider;

    p.setup = function () {
        // Container setup
        let container = p.select('#p-norm-container');
        let width = 400;
        let height = 400;

        // Create wrapper for relative positioning
        // This ensures elements like sliders are positioned relative to the sketch, not the page
        let wrapper = p.createDiv();
        wrapper.style('position', 'relative');
        wrapper.style('width', '100%');
        wrapper.style('height', height + 'px');
        wrapper.style('max-width', '400px'); // Keep it constrained
        if (container) wrapper.parent(container);

        let canvas = p.createCanvas(width, height);
        canvas.parent(wrapper);

        // Slider for p value
        // Range from 0.1 to 10, default 2, step 0.1
        // Matches requirement for "only positive p values"
        pSlider = p.createSlider(1, 10, 2, 0.1);
        pSlider.position(10, 10);
        pSlider.parent(wrapper);
    };

    p.draw = function () {
        p.background(220);
        let pVal = pSlider.value();

        p.fill(0);
        p.noStroke();
        p.textSize(16);
        p.text('p = ' + pVal, 20, 45); // Adjusted text position slightly

        p.translate(p.width / 2, p.height / 2);

        // Draw axes
        p.stroke(150);
        p.strokeWeight(1);
        p.line(-p.width / 2, 0, p.width / 2, 0);
        p.line(0, -p.height / 2, 0, p.height / 2);

        let r_scale = 100; // Radius in pixels representing 1 unit

        p.noFill();
        p.stroke(0);
        p.strokeWeight(2);
        p.beginShape();
        let totalSteps = 500;
        for (let i = 0; i < totalSteps; i++) {
            let angle = p.map(i, 0, totalSteps, 0, p.TWO_PI);
            let absCos = p.abs(p.cos(angle));
            let absSin = p.abs(p.sin(angle));

            let den = p.pow(absCos, pVal) + p.pow(absSin, pVal);

            if (den !== 0) {
                let r = 1 / p.pow(den, 1 / pVal);
                let x = r * p.cos(angle) * r_scale;
                let y = r * p.sin(angle) * r_scale;
                p.vertex(x, y);
            }
        }
        p.endShape(p.CLOSE);
    };
};

if (document.getElementById('p-norm-container')) {
    new p5(pNormSketch, 'p-norm-container');
}
