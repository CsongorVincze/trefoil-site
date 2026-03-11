const spongebobMatrixSketch = (p) => {
    let spongebob;
    let imgState = 'init'; // init, loading, success, error

    // Sliders
    let sliderA, sliderB, sliderC, sliderD;
    // Buttons
    let btnRandom, btnReset;
    let btnManual, btnAuto; // The two "Apply" style buttons
    let checkAutoPlay; // "Auto Random"

    // Display
    let matrixDiv;

    // Transformation state
    let currentA = 1, currentB = 0, currentC = 0, currentD = 1;
    let targetA = 1, targetB = 0, targetC = 0, targetD = 1;

    // State
    let isAutoMode = false; // "Automatic" mode vs "Manual"

    // Auto Random state
    let lastAutoPlayTime = 0;
    let autoPlayInterval = 2000; // ms

    p.preload = function () {
        spongebob = p.loadImage('/Spongebob_pic.jpg',
            () => { imgState = 'success'; },
            () => {
                spongebob = p.loadImage('Spongebob_pic.jpg',
                    () => { imgState = 'success'; },
                    () => { imgState = 'error'; }
                );
            }
        );
    };

    p.setup = function () {
        let container = p.select('#spongebob-matrix-container');
        let w = 600;
        let h = 600;

        let wrapper = p.createDiv();
        wrapper.style('position', 'relative');
        wrapper.style('width', '100%');
        wrapper.style('max-width', '600px');
        wrapper.style('height', h + 'px');
        wrapper.style('margin', '0 auto');
        wrapper.style('overflow', 'hidden');
        wrapper.style('border', '1px solid #ccc');
        wrapper.style('border-radius', '8px');

        if (container) wrapper.parent(container);

        let canvas = p.createCanvas(w, h);
        canvas.parent(wrapper);
        p.imageMode(p.CENTER);

        // --- UI Panel ---
        let uiPanel = p.createDiv();
        uiPanel.parent(wrapper);
        uiPanel.style('position', 'absolute');
        uiPanel.style('top', '10px');
        uiPanel.style('left', '10px');
        uiPanel.style('background', 'rgba(255,255,255,0.9)');
        uiPanel.style('padding', '15px');
        uiPanel.style('border-radius', '12px');
        uiPanel.style('box-shadow', '0 4px 15px rgba(0,0,0,0.15)');
        uiPanel.style('display', 'flex');
        uiPanel.style('flex-direction', 'column');
        uiPanel.style('gap', '10px');
        uiPanel.style('width', '240px');

        // Sliders Helper
        function createSliderRow(label, min, max, val) {
            let row = p.createDiv();
            row.parent(uiPanel);
            row.style('display', 'flex');
            row.style('justify-content', 'space-between');
            row.style('align-items', 'center');

            let lbl = p.createSpan(label + ': ');
            lbl.parent(row);
            lbl.style('font-weight', 'bold');
            lbl.style('color', '#00008B');

            let sld = p.createSlider(min, max, val, 0.1);
            sld.parent(row);
            sld.style('width', '130px');
            return sld;
        }

        sliderA = createSliderRow('a (xx)', -2, 2, 1);
        sliderB = createSliderRow('b (yx)', -2, 2, 0);
        sliderC = createSliderRow('c (xy)', -2, 2, 0);
        sliderD = createSliderRow('d (yy)', -2, 2, 1);

        // Matrix Display
        matrixDiv = p.createDiv();
        matrixDiv.parent(uiPanel);
        matrixDiv.style('font-family', 'monospace');
        matrixDiv.style('background', '#f5f5f5');
        matrixDiv.style('padding', '8px');
        matrixDiv.style('border-radius', '6px');
        matrixDiv.style('font-size', '14px');
        matrixDiv.style('text-align', 'center');
        matrixDiv.style('color', '#00008B');
        matrixDiv.style('font-weight', 'bold');
        matrixDiv.style('border', '1px solid #e0e0e0');

        // Utility Buttons (Rand / Reset)
        let utilRow = p.createDiv();
        utilRow.parent(uiPanel);
        utilRow.style('display', 'flex');
        utilRow.style('justify-content', 'space-between');
        utilRow.style('gap', '10px');

        btnRandom = p.createButton('🎲 Rand');
        btnRandom.parent(utilRow);
        btnRandom.style('flex', '1');
        btnRandom.style('color', '#00008B');
        btnRandom.style('cursor', 'pointer');
        btnRandom.mousePressed(randomizeSliders);

        btnReset = p.createButton('↺ Reset');
        btnReset.parent(utilRow);
        btnReset.style('flex', '1');
        btnReset.style('color', '#00008B');
        btnReset.style('cursor', 'pointer');
        btnReset.mousePressed(resetTransformation);

        // Auto Random Checkbox
        let autoPlayDiv = p.createDiv();
        autoPlayDiv.parent(uiPanel);
        autoPlayDiv.style('display', 'flex');
        autoPlayDiv.style('align-items', 'center');

        checkAutoPlay = p.createCheckbox(' Continuous Random', false);
        checkAutoPlay.parent(autoPlayDiv);
        checkAutoPlay.style('color', '#00008B');
        checkAutoPlay.style('font-weight', 'bold');
        checkAutoPlay.style('font-size', '0.9em');

        // --- Mode Buttons (The "Apply" Style Buttons) ---
        // We want two buttons: [Manual Apply] and [Auto: ON/OFF]

        let modeLabel = p.createDiv('Apply Mode:');
        modeLabel.parent(uiPanel);
        modeLabel.style('color', '#00008B');
        modeLabel.style('font-weight', 'bold');
        modeLabel.style('margin-bottom', '-5px');
        modeLabel.style('font-size', '0.9em');

        let modeRow = p.createDiv();
        modeRow.parent(uiPanel);
        modeRow.style('display', 'flex');
        modeRow.style('gap', '8px');

        // Manual Button (Green)
        btnManual = p.createButton('Manual');
        btnManual.parent(modeRow);
        styleTheButton(btnManual);
        btnManual.mousePressed(() => {
            // If clicking Manual, we likely want to switch OFF auto mode and Apply
            if (isAutoMode) {
                toggleAutoMode(false);
            }
            applyTransformation();
        });

        // Auto Button (Toggle)
        btnAuto = p.createButton('Auto');
        btnAuto.parent(modeRow);
        styleTheButton(btnAuto); // Base style
        // Override base style for toggle state
        btnAuto.style('background', '#808080'); // Start Gray
        btnAuto.mousePressed(() => {
            toggleAutoMode(!isAutoMode);
        });

        function styleTheButton(b) {
            b.style('flex', '1');
            b.style('font-weight', 'bold');
            b.style('background', '#4CAF50'); // Green
            b.style('color', 'white');
            b.style('border', 'none');
            b.style('padding', '10px');
            b.style('border-radius', '6px');
            b.style('cursor', 'pointer');
            b.style('font-size', '14px');
            b.style('transition', 'background 0.3s');
        }

        // Initialize State
        toggleAutoMode(false);
        updateMatrixDisplay();
    };

    function toggleAutoMode(state) {
        isAutoMode = state;
        if (isAutoMode) {
            btnAuto.style('background', '#4CAF50'); // Green
            btnAuto.html('Auto: ON');

            btnManual.style('background', '#f0f0f0'); // Dim Manual
            btnManual.style('color', '#aaa');
            btnManual.attribute('title', 'Switch to Manual to use this');
            // We apply immediately when switching to Auto
            applyTransformation();
        } else {
            btnAuto.style('background', '#808080'); // Gray
            btnAuto.html('Auto: OFF');

            btnManual.style('background', '#4CAF50'); // Active Green
            btnManual.style('color', 'white');
            btnManual.removeAttribute('title');
        }
    }

    p.draw = function () {
        p.background(240);

        // Auto Random Logic
        if (checkAutoPlay.checked()) {
            if (p.millis() - lastAutoPlayTime > autoPlayInterval) {
                randomizeSliders();
                // Force update regardless of mode because it's an explicit animation request
                applyTransformation();
                lastAutoPlayTime = p.millis();
            }
        }

        // Auto Mode Slider Logic
        if (isAutoMode || checkAutoPlay.checked()) {
            // If Auto Mode OR AutoRandom is running, we continuously update target from sliders
            // Note: randomizeSliders() updates the slider values, so reading them here picks up the random vals
            targetA = parseFloat(sliderA.value());
            targetB = parseFloat(sliderB.value());
            targetC = parseFloat(sliderC.value());
            targetD = parseFloat(sliderD.value());
        }

        // Smoothing
        let lerpAmt = 0.1;
        currentA = p.lerp(currentA, targetA, lerpAmt);
        currentB = p.lerp(currentB, targetB, lerpAmt);
        currentC = p.lerp(currentC, targetC, lerpAmt);
        currentD = p.lerp(currentD, targetD, lerpAmt);

        // Update Display
        updateMatrixDisplay();

        p.push();
        p.translate(p.width / 2, p.height / 2);

        // Apply Transformation
        p.applyMatrix(currentA, currentB, currentC, currentD, 0, 0);

        // Draw Grid
        drawGrid();

        // Draw Image
        if (imgState === 'success') {
            p.image(spongebob, 0, 0);
        } else {
            p.noStroke();
            p.fill(0, 0, 139);
            p.textAlign(p.CENTER);
            p.text("Loading Image...", 0, 0);
        }

        p.pop();
    };

    function drawGrid() {
        p.stroke(200, 0, 0, 50);
        p.strokeWeight(1);
        let gridSize = 400;
        let step = 50;

        for (let x = -gridSize; x <= gridSize; x += step) p.line(x, -gridSize, x, gridSize);
        for (let y = -gridSize; y <= gridSize; y += step) p.line(-gridSize, y, gridSize, y);

        p.stroke(0);
        p.strokeWeight(2);
        p.line(-gridSize, 0, gridSize, 0);
        p.line(0, -gridSize, 0, gridSize);

        p.noFill();
        p.stroke(0);
        p.rect(-200, -200, 400, 400);
    }

    function updateMatrixDisplay() {
        let a = sliderA.value().toFixed(1);
        let b = sliderB.value().toFixed(1);
        let c = sliderC.value().toFixed(1);
        let d = sliderD.value().toFixed(1);

        matrixDiv.html(`
      [ ${a}  ${c} ]<br>
      [ ${b}  ${d} ]
    `);
    }

    function randomizeSliders() {
        sliderA.value(p.random(-2, 2));
        sliderB.value(p.random(-2, 2));
        sliderC.value(p.random(-2, 2));
        sliderD.value(p.random(-2, 2));
    }

    function resetTransformation() {
        sliderA.value(1);
        sliderB.value(0);
        sliderC.value(0);
        sliderD.value(1);

        // Always apply reset immediately
        applyTransformation();

        // Optional: Reset auto mode? The user probably just wants to reset the view.
        // We will keep the current mode.
    }

    function applyTransformation() {
        targetA = parseFloat(sliderA.value());
        targetB = parseFloat(sliderB.value());
        targetC = parseFloat(sliderC.value());
        targetD = parseFloat(sliderD.value());
    }
};

if (document.getElementById('spongebob-matrix-container')) {
    new p5(spongebobMatrixSketch, 'spongebob-matrix-container');
}
