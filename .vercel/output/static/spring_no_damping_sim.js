const springSketch = (p) => {
  let x = 300;
  let originallen = 250;
  let k = 0.1;
  let velocity = 0;
  let F;
  let A;
  let m = 10;
  
  let massSlider;
  let kSlider;
  
  let dispHistory = [];
  let velHistory = [];
  let accHistory = [];

  const updateGraphs = (disp, vel, acc) => {
      dispHistory.push(disp);
      velHistory.push(vel);
      accHistory.push(acc);
      
      if (dispHistory.length > 300) {
        dispHistory.shift();
        velHistory.shift();
        accHistory.shift();
      }
  };

  const drawSpring = (x1, y1, x2, y2) => {
      p.stroke(0);
      p.strokeWeight(2);
      p.noFill();
      let dist = x2 - x1;
      let zigzags = 20;
      let step = dist / zigzags;
      
      p.beginShape();
      p.vertex(x1, y1);
      for (let i = 1; i < zigzags; i++) {
        let y = (i % 2 === 0) ? y1 - 10 : y1 + 10;
        p.vertex(x1 + i * step, y);
      }
      p.vertex(x2, y2);
      p.endShape();
  };

  const drawArrow = (x, y, vecMag, col, label) => {
      p.push();
      p.translate(x, y);
      p.stroke(col);
      p.strokeWeight(3);
      p.fill(col);
      p.line(0, 0, vecMag, 0);
      
      let arrowSize = 6;
      if (vecMag > 0) {
        p.triangle(vecMag, 0, vecMag - arrowSize, -arrowSize/2, vecMag - arrowSize, arrowSize/2);
      } else if (vecMag < 0) {
        p.triangle(vecMag, 0, vecMag + arrowSize, -arrowSize/2, vecMag + arrowSize, arrowSize/2);
      }
      
      p.noStroke();
      p.text(label, vecMag, -10);
      p.pop();
  };

  const drawGraph = (history, label, x, y, col) => {
      p.push();
      p.translate(x, y);
      
      // Background and axes
      p.fill(255);
      p.stroke(200);
      p.rect(0, 0, 500, 150);
      
      // Axes (Midline and Y-axis)
      p.stroke(180);
      p.line(0, 75, 500, 75); // X-axis
      p.line(2, 0, 2, 150);   // Y-axis
      
      // Axes Labels
      p.noStroke();
      p.fill(100);
      p.textSize(10);
      p.text("0", 5, 75);
      p.text("Time", 470, 140);
      p.text("+", 5, 15);
      p.text("-", 5, 145);
      
      // Plot data
      p.noFill();
      p.stroke(col);
      p.strokeWeight(1.5);
      p.beginShape();
      for (let i = 0; i < history.length; i++) {
        let px = p.map(i, 0, 300, 0, 500);
        
        let val = history[i];
        if (label === "Acceleration") val *= 15;
        if (label === "Velocity") val *= 2;
        if (label === "Displacement") val *= 0.3;
        
        let py = 75 - val; 
        
        // Clamp to box (0-150)
        py = p.constrain(py, 0, 150); 
      
        p.vertex(px, py);
      }
      p.endShape();
      
      p.noStroke();
      p.fill(0);
      p.textSize(12);
      p.text(label, 10, 20);
      p.pop();
  };

  p.setup = function() {
    // Make container relative so we can position absolute sliders inside
    let containerId = 'spring-simulation-container';
    let container = p.select('#' + containerId);
    
    // Create a wrapper to ensure sliders stay relative to canvas
    let wrapper = p.createDiv();
    wrapper.style('position', 'relative');
    wrapper.style('width', '1200px');
    wrapper.style('height', '600px');
    if (container) {
        wrapper.parent(container);
    }

    let canvas = p.createCanvas(1200, 600);
    canvas.parent(wrapper);
    canvas.style('display', 'block');

    massSlider = p.createSlider(1, 20, 5);
    massSlider.style('position', 'absolute');
    massSlider.style('left', '20px');
    massSlider.style('top', '520px');
    massSlider.parent(wrapper);

    kSlider = p.createSlider(0.01, 1, 0.1, 0.01);
    kSlider.style('position', 'absolute');
    kSlider.style('left', '220px');
    kSlider.style('top', '520px');
    kSlider.parent(wrapper);
  };

  p.draw = function() {
    m = massSlider.value();
    k = kSlider.value();

    p.background(220);
    
    // Draw Environment (Wall and Ground)
    p.fill(150);
    p.rect(0, 150, 20, 100); // Wall
    p.stroke(100);
    p.line(0, 222, 600, 222); // Ground line
    
    // Draw Slider Labels
    p.noStroke();
    p.fill(0);
    p.text("Mass: " + m, 20, 510);
    p.text("Spring Constant (k): " + k, 220, 510);
    
    // Update Physics
    F = -k * (x - originallen);
    A = F / m;
    
    if (p.mouseIsPressed && p.mouseX > 50 && p.mouseX < 400 && p.mouseY < 400) {
      x = p.mouseX;
      velocity = 0; 
      A = 0;
    } else {
      velocity += A;
      x += velocity;
      
      // Damping (optional, keeps it stable)
      //velocity *= 0.99; 
    }

    // Draw Spring
    drawSpring(20, 200, x, 200);

    // Draw Mass
    p.noStroke();
    p.fill(45, 197, 244);
    p.circle(x, 200, 40); 

    // Draw Vectors
    drawArrow(x, 200, velocity * 10, p.color(0, 0, 255), "v"); 
    drawArrow(x, 200, A * 100, p.color(255, 0, 0), "a"); 

    // Update Data for Graphs
    updateGraphs(x - originallen, velocity, A);

    // Draw Graphs
    drawGraph(dispHistory, "Displacement", 600, 10, p.color(0));
    drawGraph(velHistory, "Velocity", 600, 210, p.color(0, 0, 255));
    drawGraph(accHistory, "Acceleration", 600, 410, p.color(255, 0, 0));
  };
};

if(document.getElementById('spring-simulation-container')) {
    new p5(springSketch, 'spring-simulation-container');
}
