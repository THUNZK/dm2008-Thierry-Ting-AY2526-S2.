// DM2008 — Activity 4b [Guided]
// Objects in Motion (50 min)
//
// You have a working Agent class to start with — your job is to bring it to life.
// Each agent moves, changes over time, and is drawn to the screen.
// Mouse click adds a new agent. C clears them all.
//
// Things to try:
//
// Stretch: give each agent a lifespan — shrink or fade it over time, then remove it.
// Hint: a backward loop lets you safely splice items while iterating.

let agents = [];
const NUM_START = 12;

function setup() {
  createCanvas(600, 400);
  noStroke();
  for (let i = 0; i < NUM_START; i++) {
    let x = random(width);
    let y = random(height);
    let sz = random(12, 36);
    let speedX = random(-2, 2);
    let speedY = random(-2, 2);
    agents.push(new Agent(x, y, sz, speedX, speedY));
  }
}

function draw() {
  background(230);
  for (let i = agents.length - 1; i >= 0; i--) {
    agents[i].update();
    if (agents[i].isDead()) {
      agents.splice(i, 1);
    } else {
      agents[i].show();
    }
  }
}

function mousePressed() {
  let sz = random(5, 100);
  let speedX = random(-10, 10);
  let speedY = random(-10, 10);
  agents.push(new Agent(mouseX, mouseY, sz, speedX, speedY));
}

function keyPressed() {
  if (key === "C") {
    agents = [];
  }
}

class Agent {
  constructor(x, y, sz, speedX, speedY) {
    this.x = x;
    this.y = y;
    this.sz = 1;
    this.maxSz = sz;
    this.dx = speedX;
    this.dy = speedY;
    this.col = random(255);
    this.growthRate = 0.6;
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.col = (this.col + 1) % 255;
    const r = this.sz / 2;
    if (this.x - r < 0 || this.x + r > width) {
      this.dx *= -1;
      this.x = constrain(this.x, r, width - r);
    }
    if (this.y - r < 0 || this.y + r > height) {
      this.dy *= -1;
      this.y = constrain(this.y, r, height - r);
    }
    this.grow(this.growthRate);
    if (this.sz >= this.maxSz) {
      this.growthRate = -0.3;
    }
  }

  grow(amount) {
    this.sz += amount;
  }

  isDead() {
    return this.sz <= 0;
  }
  show() {
    fill(this.col, 200, 200);
    ellipse(this.x, this.y, this.sz);
  }
}
