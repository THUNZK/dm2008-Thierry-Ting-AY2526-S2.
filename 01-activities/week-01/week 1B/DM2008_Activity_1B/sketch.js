// DM2008 — Activity 1b [Georg Nees]
// Learning By Making (40 min)

let x;
let y;
let w;

function setup() {
  createCanvas(800, 800)
  background(240);
}

function draw() {
  
  x = random(width);
  y = random(height);
  w = random(80, 80);
  
  background(100,100,100);
  
  stroke('grey');
  strokeWeight(random(1, 500));
  noFill();
  rect(1, 0, height/2, width/2);
  rect(1, height/2, w, width/2);
  rect(height/2, height/2, w, width/2);
   rect(1, height/2, width, width/2);
  rect(1, height, w, width/2);
  
  stroke(100,100,100);
   strokeWeight(random(1, 100));
  noFill();
  rect(height/3, height/3, width/3, width/3);
  rect(height/2, height/2, width, width);
  rect(1, 0, height/2, width/2);
  rect(1, height/2, width/4, width/2);
   rect(1, height/4, width, width/2);
}

function keyPressed() {
    saveCanvas("activity1b-image", "jpg");
}