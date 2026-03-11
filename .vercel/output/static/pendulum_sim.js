const pendulumSketch = (p) => {
  let angle;
  let angleV = 0;
  let angleA = 0;

  let jozsi;
  let len;
  let gravity = 1;

  let mu;
  let origin;
  
  let lenSlider;
  let dampingSlider;

  let angleHistory = [];

  p.setup = function() {
    // Find the container to attach controls to
    let containerId = 'simulation-container';
    let container = p.select('#' + containerId);
    
    // Create a wrapper to ensure layout integrity
    let wrapper = p.createDiv();
    wrapper.style('position', 'relative');
    wrapper.style('width', '1200px');
    wrapper.style('height', '600px');
    if (container) {
      wrapper.parent(container);
    }
    
    let canvas = p.createCanvas(1200, 600);
    canvas.parent(wrapper);
    
    let controls = p.createDiv();
    controls.id('pendulum-controls');
    controls.parent(wrapper);

    origin = p.createVector(300, 0);
    angle = p.PI/4;
    mu = 0.01;
    jozsi = p.createVector();

    // Style controls to overlay on the canvas (bottom left)
    controls.style('position', 'absolute');
    controls.style('bottom', '20px');
    controls.style('left', '20px');
    controls.style('display', 'flex');
    controls.style('gap', '20px');
    controls.style('color', '#FFF'); // White text for black background
    controls.style('background', 'rgba(0, 0, 0, 0.5)'); // Semi-transparent background
    controls.style('padding', '10px');
    controls.style('border-radius', '8px');

    // Container for Length
    let lenContainer = p.createDiv();
    lenContainer.parent(controls);
    lenContainer.style('display', 'flex');
    lenContainer.style('flex-direction', 'column');
    lenContainer.style('align-items', 'center');
    
    let lenLabel = p.createSpan('Pendulum Length');
    lenLabel.parent(lenContainer);
    
    lenSlider = p.createSlider(20, 400, 200); 
    lenSlider.parent(lenContainer);

    // Container for Damping
    let muContainer = p.createDiv();
    muContainer.parent(controls);
    muContainer.style('display', 'flex');
    muContainer.style('flex-direction', 'column');
    muContainer.style('align-items', 'center');

    let muLabel = p.createSpan('Damping (Friction)');
    muLabel.parent(muContainer);
    
    dampingSlider = p.createSlider(0.0, 0.1, 0.01, 0.005);
    dampingSlider.parent(muContainer);
  };

  p.draw = function() {
    p.background(0);

    len = lenSlider.value();
    mu = dampingSlider.value();
    angleA = (-1 * gravity) * p.sin(angle) / len - mu * angleV;
    angleV += angleA;
    angle += angleV;

    jozsi.x = len * p.sin(angle) + origin.x;
    jozsi.y = len * p.cos(angle) + origin.y;

    if (p.mouseIsPressed) {
      if (p.mouseX < 600 && p.mouseY < 600) { 
        angle = p.atan2(p.mouseX - origin.x, p.mouseY - origin.y);
        angleV = 0;
        jozsi.x = len * p.sin(angle) + origin.x;
        jozsi.y = len * p.cos(angle) + origin.y;
      }
    }

    p.stroke(255);
    p.strokeWeight(8);
    p.fill(127);
    p.line(origin.x, origin.y, jozsi.x, jozsi.y);
    p.circle(jozsi.x, jozsi.y, 64);

    // sebesseg nyil
    p.stroke(0, 0, 255);
    p.strokeWeight(8);
    let velocityX = len * angleV * p.cos(angle);
    let velocityY = -len * angleV * p.sin(angle);
    
    p.line(jozsi.x, jozsi.y, jozsi.x + velocityX * 10, jozsi.y + velocityY * 10);
    // gyorsulas nyil
    p.stroke(255, 0, 0);
    p.strokeWeight(8);
    let accelerationX = len * angleA * p.cos(angle);
    let accelerationY = -len * angleA * p.sin(angle);

    p.line(jozsi.x, jozsi.y, jozsi.x + accelerationX * 100, jozsi.y + accelerationY * 100);

    // Graph logic
    angleHistory.push(angle);
    if (angleHistory.length > 500) {
      angleHistory.shift();
    }

    // Draw Graph Background
    p.noStroke();
    p.fill(20);
    p.rect(600, 0, 600, 600);

    // Draw Axes
    p.stroke(255);
    p.strokeWeight(2);
    p.line(650, 300, 1150, 300); // X axis (Time)
    p.line(650, 50, 650, 550);   // Y axis (Angle)

    // Label Axes
    p.noStroke();
    p.fill(255);
    p.textSize(16);
    p.text("Time", 1100, 320);
    p.text("Angle", 600, 50);

    // Draw Graph
    p.noFill();
    p.stroke(0, 255, 0); // Green color for angle
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i < angleHistory.length; i++) {
        let x = 650 + i;
        let y = 300 - angleHistory[i] * 50; 
        p.vertex(x, y);
    }
    p.endShape();
  };
};

if (document.getElementById('simulation-container')) {
    new p5(pendulumSketch, 'simulation-container');
}
