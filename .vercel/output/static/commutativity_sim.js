const commutativitySketch = (p) => {
    // State
    let redPos;
    let yellowPos;
    let targetRedPos;
    let targetYellowPos;

    const ORIGINAL_RED = { x: 3, y: 0 };
    const ORIGINAL_YELLOW = { x: 0, y: 2 };

    let queue = [];
    let isAnimating = false;
    let waitCounter = 0;

    const scale = 40;
    const lerpSpeed = 0.08;

    p.setup = function () {
        let container = p.select('#commutativity-sim-container');
        let canvas = p.createCanvas(600, 400);

        if (container) {
            canvas.parent(container);
        }

        resetSimulation();
        setupButtons();
    };

    function setupButtons() {
        const btnAB = document.getElementById('btn-AB');
        const btnBA = document.getElementById('btn-BA');
        const btnReset = document.getElementById('btn-reset');

        if (btnAB) btnAB.onclick = () => startSequence('AB');
        if (btnBA) btnBA.onclick = () => startSequence('BA');
        if (btnReset) btnReset.onclick = () => resetSimulation();
    }

    function resetSimulation() {
        redPos = p.createVector(ORIGINAL_RED.x, ORIGINAL_RED.y);
        yellowPos = p.createVector(ORIGINAL_YELLOW.x, ORIGINAL_YELLOW.y);
        targetRedPos = redPos.copy();
        targetYellowPos = yellowPos.copy();
        queue = [];
        isAnimating = false;
        waitCounter = 0;
    }

    function startSequence(type) {
        resetSimulation();

        if (type === 'AB') {
            // A: Project to X axis (y -> 0)
            // Red(3,0) stays at (3,0), Yellow(0,2) -> (0,0)
            queue.push({
                red: p.createVector(3, 0),
                yellow: p.createVector(0, 0)
            });
            // B: Rotate 90 deg positive (CCW)
            // (3,0) -> (0,3), (0,0) -> (0,0)
            queue.push({
                red: p.createVector(0, 3),
                yellow: p.createVector(0, 0)
            });
        } else if (type === 'BA') {
            // B: Rotate 90 deg positive first
            // (3,0) -> (0,3), (0,2) -> (-2,0)
            queue.push({
                red: p.createVector(0, 3),
                yellow: p.createVector(-2, 0)
            });
            // A: Project to X axis
            // (0,3) -> (0,0), (-2,0) -> (-2,0)
            queue.push({
                red: p.createVector(0, 0),
                yellow: p.createVector(-2, 0)
            });
        }

        nextStep();
    }

    function nextStep() {
        if (queue.length > 0) {
            const step = queue.shift();
            targetRedPos = step.red;
            targetYellowPos = step.yellow;
            isAnimating = true;
            waitCounter = 0;
        } else {
            isAnimating = false;
        }
    }

    p.draw = function () {
        p.background(245, 245, 250);
        p.translate(p.width / 2, p.height / 2);

        drawGrid();
        drawAxes();

        // Draw shadows of original positions
        drawShadowPoint(ORIGINAL_RED, p.color(220, 50, 50, 50));
        drawShadowPoint(ORIGINAL_YELLOW, p.color(255, 200, 0, 50));

        if (isAnimating) {
            redPos.x = p.lerp(redPos.x, targetRedPos.x, lerpSpeed);
            redPos.y = p.lerp(redPos.y, targetRedPos.y, lerpSpeed);
            yellowPos.x = p.lerp(yellowPos.x, targetYellowPos.x, lerpSpeed);
            yellowPos.y = p.lerp(yellowPos.y, targetYellowPos.y, lerpSpeed);

            if (p.dist(redPos.x, redPos.y, targetRedPos.x, targetRedPos.y) < 0.02 &&
                p.dist(yellowPos.x, yellowPos.y, targetYellowPos.x, targetYellowPos.y) < 0.02) {

                redPos.set(targetRedPos);
                yellowPos.set(targetYellowPos);

                if (queue.length > 0) {
                    if (waitCounter === 0) waitCounter = 50;
                    waitCounter--;
                    if (waitCounter <= 0) {
                        nextStep();
                    }
                } else {
                    isAnimating = false;
                }
            }
        }

        drawPoint(redPos, p.color(220, 50, 50), 'Piros');
        drawPoint(yellowPos, p.color(255, 200, 0), 'Sárga');
    };

    function drawGrid() {
        p.stroke(210);
        p.strokeWeight(1);

        for (let i = -7; i <= 7; i++) {
            p.line(i * scale, -200, i * scale, 200);
        }
        for (let i = -5; i <= 5; i++) {
            p.line(-300, i * scale, 300, i * scale);
        }
    }

    function drawAxes() {
        p.stroke(60);
        p.strokeWeight(2);
        p.line(-300, 0, 300, 0);
        p.line(0, -200, 0, 200);

        // Arrow heads for axes
        p.fill(60);
        p.noStroke();
        // X arrow
        p.triangle(290, 0, 280, -5, 280, 5);
        // Y arrow (pointing up, so at negative y in canvas coords)
        p.triangle(0, -190, -5, -180, 5, -180);

        p.fill(60);
        p.textSize(12);

        for (let i = -6; i <= 6; i++) {
            if (i === 0) continue;
            p.textAlign(p.CENTER, p.TOP);
            p.text(i, i * scale, 8);
        }

        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            p.textAlign(p.RIGHT, p.CENTER);
            p.text(i, -8, -i * scale);
        }
    }

    function drawShadowPoint(vec, col) {
        const sx = vec.x * scale;
        const sy = -vec.y * scale;

        // Dashed line to origin for shadow
        p.stroke(col);
        p.strokeWeight(2);
        p.drawingContext.setLineDash([5, 5]);
        p.line(0, 0, sx, sy);
        p.drawingContext.setLineDash([]);

        // Shadow Point circle
        p.noStroke();
        p.fill(col);
        p.circle(sx, sy, 18);
    }

    function drawPoint(vec, col, label) {
        const sx = vec.x * scale;
        const sy = -vec.y * scale;

        // Line to origin
        p.stroke(col);
        p.strokeWeight(2);
        p.line(0, 0, sx, sy);

        // Point circle
        p.noStroke();
        p.fill(col);
        p.circle(sx, sy, 18);

        // Coordinates label
        p.fill(30);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(14);
        p.text(`(${vec.x.toFixed(0)}, ${vec.y.toFixed(0)})`, sx + 12, sy - 8);
    }
};

// Initialize when container exists
if (document.getElementById('commutativity-sim-container')) {
    new p5(commutativitySketch, 'commutativity-sim-container');
}
