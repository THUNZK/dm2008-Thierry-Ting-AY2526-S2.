// DM2008 — Activity 3b
// One Function Wonder (20 min)
//
// Write a function that draws a shape or group of shapes.
// It should take at least one parameter — try x, y, size, or color.
// Call it several times with different values to create variation.
//
// Ideas: a simple face, a flower, a house, an icon.
// Example: myShape(100, 200, 50); myShape(300, 200, 80);
//
// Stretch: call your function inside a for loop to create a repeating pattern.

function setup() {
  createCanvas(400, 400);
  rectMode(CENTER);
}

function draw() {
  const bg = color(245, 238, 220);
  background(bg);

  glyph(125, 115, 175, color(35, 30, 40), bg);
  glyph(305, 130, 125, color(155, 70, 50), bg); 
  glyph(110, 295, 105, color(55, 85, 110), bg);  

  for (let i = 0; i < 4; i++) {
    let cc = color(80 + i * 25, 65 + i * 15, 130 - i * 20);
    glyph(200 + i * 55, 310, 42, cc, bg);
  }
}

function glyph(x, y, s, c, bg) {
  push();
  translate(x, y);
  noStroke();
  rectMode(CENTER);
  fill(c);

  ellipse(-s * 0.32, -s * 0.55, s * 0.10, s * 0.10);
  ellipse(-s * 0.10, -s * 0.62, s * 0.07, s * 0.07);
  ellipse( s * 0.10, -s * 0.62, s * 0.07, s * 0.07);
  ellipse( s * 0.32, -s * 0.55, s * 0.10, s * 0.10);
  ellipse(-s * 0.45, -s * 0.18, s * 0.13, s * 0.20);
  ellipse( s * 0.45, -s * 0.18, s * 0.13, s * 0.20);
  arc(0, -s * 0.20, s * 0.86, s * 0.86, PI, TWO_PI);
  rect(0, -s * 0.16, s * 0.88, s * 0.09);
  fill(bg);
  arc(0, -s * 0.21, s * 0.64, s * 0.64, PI, TWO_PI);

  stroke(c);
  strokeWeight(s * 0.045);
  push();
  translate(0, -s * 0.21);
  const spokes = 7;
  for (let i = 0; i <= spokes; i++) {
    let theta = PI + i * (PI / spokes);
    line(0, 0, cos(theta) * s * 0.32, sin(theta) * s * 0.32);
  }
  pop();
  noStroke();

  fill(bg);
  ellipse(0, -s * 0.21, s * 0.18, s * 0.18);

  fill(c);
  rect(0, -s * 0.04, s * 0.08, s * 0.26);
  rect(0,  s * 0.09, s * 0.50, s * 0.07);
  ellipse(-s * 0.26, s * 0.09, s * 0.11, s * 0.11);
  ellipse( s * 0.26, s * 0.09, s * 0.11, s * 0.11);
  rect(0,  s * 0.21, s * 0.08, s * 0.16);

  for (let side = -1; side <= 1; side += 2) {
    let px = side * s * 0.45;
    fill(c);
    rect(px, s * 0.02, s * 0.08, s * 0.30);
    ellipse(px, s * 0.22, s * 0.18, s * 0.22);
    fill(bg);
    ellipse(px, s * 0.24, s * 0.03, s * 0.05);
  }

  stroke(c);
  strokeWeight(s * 0.07);
  line(0, s * 0.29, -s * 0.22, s * 0.36);
  line(0, s * 0.29,  s * 0.22, s * 0.36);
  noStroke();

  for (let i = -1; i <= 1; i++) {
    push();
    translate(i * s * 0.22, s * 0.36);
    rotate(i * PI / 6);
    fill(c);
    ellipse(0, s * 0.12, s * 0.16, s * 0.22);
    fill(bg);
    ellipse(0, s * 0.15, s * 0.03, s * 0.05);
    pop();
  }

  pop();
}