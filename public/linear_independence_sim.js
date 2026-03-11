const linearIndependenceSketch = (p) => {
  let v1, v2;
  let slider1, slider2;
  let button, collinearButton;
  let searching = false;

  // Helper to generate a vector from a random integer degree
  function randomIntAngleVector() {
    let deg = p.floor(p.random(360));
    return p5.Vector.fromAngle(p.radians(deg));
  }

  function startCollinearSearch() {
    searching = true;
  }

  function generateVectors() {
    // Stop searching if we manually generate
    searching = false;
    v1 = randomIntAngleVector();
    v2 = randomIntAngleVector();
  }
  
  // Helper function to draw an arrow
  function drawArrow(base, vec, myColor) {
    p.push();
    p.stroke(myColor);
    p.strokeWeight(3);
    p.fill(myColor);
    p.translate(base.x, base.y);
    p.line(0, 0, vec.x, vec.y);
    p.rotate(vec.heading());
    let arrowSize = 7;
    p.translate(vec.mag() - arrowSize, 0); // Move to near the tip
    p.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    p.pop();
  }

  p.setup = function() {
    // Container setup
    let container = p.select('#linear-independence-container');
    let width = 800; 
    let height = 500;
    
    // Create wrapper for relative positioning
    let wrapper = p.createDiv();
    wrapper.style('position', 'relative');
    wrapper.style('width', '100%');
    wrapper.style('height', height + 'px');
    wrapper.style('max-width', '800px');
    if(container) wrapper.parent(container);
    
    let canvas = p.createCanvas(width, height);
    // Make canvas responsive
    canvas.style('width', '100%');
    canvas.style('height', '100%');
    canvas.parent(wrapper);

    // Create UI elements
    slider1 = p.createSlider(-3, 3, 1, 0.1);
    slider1.position(20, 20);
    slider1.parent(wrapper);
    
    slider2 = p.createSlider(-3, 3, 1, 0.1);
    slider2.position(20, 50);
    slider2.parent(wrapper);
    
    button = p.createButton('Generate New Vectors');
    button.position(20, 80);
    button.mousePressed(generateVectors);
    button.parent(wrapper);

    collinearButton = p.createButton('Generate till collinear');
    collinearButton.position(20, 110);
    collinearButton.mousePressed(startCollinearSearch);
    collinearButton.parent(wrapper);
    
    generateVectors();
  };

  p.draw = function() {
    if (searching) {
      v1 = randomIntAngleVector();
      v2 = randomIntAngleVector();
      
      let angle = v1.angleBetween(v2);
      let epsilon = 0.001; 
      if (p.abs(angle) < epsilon || p.abs(p.abs(angle) - p.PI) < epsilon) {
        searching = false;
        console.log("Found collinear vectors!");
      }
    }

    p.background(30);
    
    // Display labels for sliders
    p.fill(255);
    p.noStroke();
    p.textSize(16);
    p.text(`v1 scalar: ${slider1.value()}`, 160, 35);
    p.text(`v2 scalar: ${slider2.value()}`, 160, 65);
    
    // Indicate if searching
    if (searching) {
      p.fill(255, 255, 0);
      p.text("Searching for collinear vectors...", 20, 150);
    }
    
    p.translate(p.width / 2, p.height / 2);
    
    let baseLen = 100;
    let s1 = slider1.value();
    let s2 = slider2.value();
    
    let u1 = p5.Vector.mult(v1, s1 * baseLen);
    let u2 = p5.Vector.mult(v2, s2 * baseLen);
    let sumVec = p5.Vector.add(u1, u2);
    
    p.stroke(100);
    p.strokeWeight(1);
    p.line(-p.width / 2, 0, p.width / 2, 0);
    p.line(0, -p.height / 2, 0, p.height / 2);
    
    p.stroke(150, 150, 150, 100);
    p.strokeWeight(1);
    p.line(u1.x, u1.y, sumVec.x, sumVec.y);
    p.line(u2.x, u2.y, sumVec.x, sumVec.y);
    
    drawArrow(p.createVector(0, 0), u1, p.color(255, 100, 100));
    drawArrow(p.createVector(0, 0), u2, p.color(100, 100, 255));
    drawArrow(p.createVector(0, 0), sumVec, p.color(255, 255, 100));
    
    p.noStroke();
    p.fill(255, 100, 100);
    p.text("v1", u1.x + 10, u1.y);
    p.fill(100, 100, 255);
    p.text("v2", u2.x + 10, u2.y);
    p.fill(255, 255, 100);
    p.text("sum", sumVec.x + 10, sumVec.y);
  };
};

if (document.getElementById('linear-independence-container')) {
  new p5(linearIndependenceSketch, 'linear-independence-container');
}
