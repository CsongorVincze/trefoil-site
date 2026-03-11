// ── Boid Worker ──
// All physics + rendering runs here, completely off the main thread.
// Communicates via postMessage: { type: 'init'|'mousemove'|'resize', ... }

// ── Config ──
const ALIGN_W = 1;
const COHESION_W = 1;
const SEPARATION_W = 1.2;
const MOUSE_W = 3;
const PERCEPTION = 50;
const PERCEPTION_SQ = PERCEPTION * PERCEPTION;
const MOUSE_RADIUS = 100;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const MAX_FORCE = 0.2;
const MAX_SPEED = 3;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const CELL_SIZE = PERCEPTION;

// ── State ──
let ctx, W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let count = 0;

let px, py, vx, vy, ax, ay; // Float32Arrays
let gridCols = 0, gridRows = 0;
let grid, gridCount, gridBoids; // Int32Arrays

function initArrays() {
    count = Math.max(30, Math.min(150, Math.floor((W * H) / 8000)));
    px = new Float32Array(count);
    py = new Float32Array(count);
    vx = new Float32Array(count);
    vy = new Float32Array(count);
    ax = new Float32Array(count);
    ay = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        px[i] = Math.random() * W;
        py[i] = Math.random() * H;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        vx[i] = Math.cos(angle) * speed;
        vy[i] = Math.sin(angle) * speed;
    }
    rebuildGridArrays();
}

function rebuildGridArrays() {
    gridCols = Math.ceil(W / CELL_SIZE) + 1;
    gridRows = Math.ceil(H / CELL_SIZE) + 1;
    const total = gridCols * gridRows;
    grid = new Int32Array(total);
    gridCount = new Int32Array(total);
    gridBoids = new Int32Array(count || 200);
}

// ── Spatial grid (counting sort) ──
function buildGrid() {
    const total = gridCols * gridRows;
    for (let c = 0; c < total; c++) gridCount[c] = 0;
    for (let i = 0; i < count; i++) {
        const col = Math.min(Math.max((px[i] / CELL_SIZE) | 0, 0), gridCols - 1);
        const row = Math.min(Math.max((py[i] / CELL_SIZE) | 0, 0), gridRows - 1);
        gridCount[row * gridCols + col]++;
    }
    let sum = 0;
    for (let c = 0; c < total; c++) {
        grid[c] = sum;
        sum += gridCount[c];
        gridCount[c] = 0;
    }
    for (let i = 0; i < count; i++) {
        const col = Math.min(Math.max((px[i] / CELL_SIZE) | 0, 0), gridCols - 1);
        const row = Math.min(Math.max((py[i] / CELL_SIZE) | 0, 0), gridRows - 1);
        const ci = row * gridCols + col;
        gridBoids[grid[ci] + gridCount[ci]] = i;
        gridCount[ci]++;
    }
}

// ── Single-pass flocking ──
function computeFlocking() {
    for (let i = 0; i < count; i++) {
        const posX = px[i], posY = py[i];
        const velX = vx[i], velY = vy[i];
        let alignX = 0, alignY = 0;
        let cohX = 0, cohY = 0;
        let sepX = 0, sepY = 0;
        let total = 0;

        const myCol = Math.min(Math.max((posX / CELL_SIZE) | 0, 0), gridCols - 1);
        const myRow = Math.min(Math.max((posY / CELL_SIZE) | 0, 0), gridRows - 1);
        const rStart = Math.max(0, myRow - 1), rEnd = Math.min(gridRows - 1, myRow + 1);
        const cStart = Math.max(0, myCol - 1), cEnd = Math.min(gridCols - 1, myCol + 1);

        for (let r = rStart; r <= rEnd; r++) {
            for (let c = cStart; c <= cEnd; c++) {
                const ci = r * gridCols + c;
                const start = grid[ci];
                const end = start + gridCount[ci];
                for (let k = start; k < end; k++) {
                    const j = gridBoids[k];
                    if (j === i) continue;
                    const dx = px[j] - posX, dy = py[j] - posY;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < PERCEPTION_SQ && dSq > 0) {
                        alignX += vx[j]; alignY += vy[j];
                        cohX += px[j]; cohY += py[j];
                        const inv = 1 / dSq;
                        sepX -= dx * inv; sepY -= dy * inv;
                        total++;
                    }
                }
            }
        }

        let accX = 0, accY = 0;
        if (total > 0) {
            const inv = 1 / total;
            // Alignment
            alignX *= inv; alignY *= inv;
            let m = Math.sqrt(alignX * alignX + alignY * alignY);
            if (m > 0) { alignX = alignX / m * MAX_SPEED; alignY = alignY / m * MAX_SPEED; }
            alignX -= velX; alignY -= velY;
            m = Math.sqrt(alignX * alignX + alignY * alignY);
            if (m > MAX_FORCE) { alignX = alignX / m * MAX_FORCE; alignY = alignY / m * MAX_FORCE; }
            // Cohesion
            cohX = cohX * inv - posX; cohY = cohY * inv - posY;
            m = Math.sqrt(cohX * cohX + cohY * cohY);
            if (m > 0) { cohX = cohX / m * MAX_SPEED; cohY = cohY / m * MAX_SPEED; }
            cohX -= velX; cohY -= velY;
            m = Math.sqrt(cohX * cohX + cohY * cohY);
            if (m > MAX_FORCE) { cohX = cohX / m * MAX_FORCE; cohY = cohY / m * MAX_FORCE; }
            // Separation
            sepX *= inv; sepY *= inv;
            m = Math.sqrt(sepX * sepX + sepY * sepY);
            if (m > 0) { sepX = sepX / m * MAX_SPEED; sepY = sepY / m * MAX_SPEED; }
            sepX -= velX; sepY -= velY;
            m = Math.sqrt(sepX * sepX + sepY * sepY);
            if (m > MAX_FORCE) { sepX = sepX / m * MAX_FORCE; sepY = sepY / m * MAX_FORCE; }

            accX = alignX * ALIGN_W + cohX * COHESION_W + sepX * SEPARATION_W;
            accY = alignY * ALIGN_W + cohY * COHESION_W + sepY * SEPARATION_W;
        }

        // Mouse repulsion
        const mdx = posX - mouseX, mdy = posY - mouseY;
        const mSq = mdx * mdx + mdy * mdy;
        if (mSq < MOUSE_RADIUS_SQ && mSq > 0) {
            const md = Math.sqrt(mSq);
            let msx = mdx / md * MAX_SPEED - velX;
            let msy = mdy / md * MAX_SPEED - velY;
            const mm = Math.sqrt(msx * msx + msy * msy);
            if (mm > MAX_FORCE) { msx = msx / mm * MAX_FORCE; msy = msy / mm * MAX_FORCE; }
            accX += msx * MOUSE_W; accY += msy * MOUSE_W;
        }

        ax[i] = accX; ay[i] = accY;
    }
}

// ── Update positions ──
function updateBoids() {
    for (let i = 0; i < count; i++) {
        vx[i] += ax[i]; vy[i] += ay[i];
        const spSq = vx[i] * vx[i] + vy[i] * vy[i];
        if (spSq > MAX_SPEED * MAX_SPEED) {
            const inv = MAX_SPEED / Math.sqrt(spSq);
            vx[i] *= inv; vy[i] *= inv;
        }
        px[i] += vx[i]; py[i] += vy[i];
        if (px[i] > W) px[i] -= W; else if (px[i] < 0) px[i] += W;
        if (py[i] > H) py[i] -= H; else if (py[i] < 0) py[i] += H;
    }
}

// ── Render ──
function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(168,218,220,0.39)';
    ctx.fillStyle = 'rgba(241,250,238,0.59)';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
        const theta = Math.atan2(vy[i], vx[i]) + Math.PI * 0.5;
        const cosT = Math.cos(theta), sinT = Math.sin(theta);
        const x = px[i], y = py[i];
        ctx.beginPath();
        ctx.moveTo(x + 4 * sinT, y - 4 * cosT);
        ctx.lineTo(x - 2 * cosT - 4 * sinT, y - 2 * sinT + 4 * cosT);
        ctx.lineTo(x + 2 * cosT - 4 * sinT, y + 2 * sinT + 4 * cosT);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

// ── Main loop ──
let lastTime = 0;
function loop(time) {
    if (time - lastTime >= FRAME_INTERVAL) {
        lastTime = time;
        buildGrid();
        computeFlocking();
        updateBoids();
        draw();
    }
    self.requestAnimationFrame(loop);
}

// ── Message handler ──
self.onmessage = (e) => {
    const { type } = e.data;

    if (type === 'init') {
        const { canvas, width, height, dpr } = e.data;
        W = Math.round(width);
        H = Math.round(height);
        ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initArrays();
        self.requestAnimationFrame(loop);
    }

    else if (type === 'mousemove') {
        mouseX = e.data.x;
        mouseY = e.data.y;
    }

    else if (type === 'resize') {
        W = Math.round(e.data.width);
        H = Math.round(e.data.height);
        const { canvas, dpr } = e.data;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rebuildGridArrays();
        // Clamp boids to new bounds
        for (let i = 0; i < count; i++) {
            if (px[i] > W) px[i] = Math.random() * W;
            if (py[i] > H) py[i] = Math.random() * H;
        }
    }
};
