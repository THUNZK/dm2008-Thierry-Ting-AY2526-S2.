// DM2008 — Activity 2a [Guided]
// Mode Switch (20 min)
//
// Keys 1, 2, 3 switch between modes — each one changes the background color.
// Try extending each mode to also change the fill, size, or speed of the ellipse.
// Keep it simple: one clear change per mode that's easy to see on screen.
//
// Stretch: add a 4th mode, or make the ellipse change shape between modes.

let x = 0;       // ellipse x-position
let size = 50;   // ellipse size
let bgColor;     // background color, changed by key presses
let bgValue = 0;

function setup() {
  createCanvas(400, 400);
  bgColor = color(0);
}

function draw() {
  background(bgColor);
noStroke();
  // Draw the ellipse at its current position
  if (mouseIsPressed === true) {
    fill('grey'); 
  } else {
    fill('white');
  }
  
     if (mouseIsPressed === true) {
  background(bgValue);
  bgValue = (bgValue + 100) % 256;
    } else{
      
       background(bgValue);
  bgValue = (bgValue + 1) % 256;
}

  // Move the ellipse
 if (mouseIsPressed === true) {
  x += 50;
 } else {
   x += 2
 }
  
   if (mouseIsPressed === true) {
  size = 50
 } else {
   size = 100
 }
  
   if (mouseIsPressed === true) {
   ellipse(x, height / 2, size);
     ellipse(x, height/2 + 60, size);
      ellipse(x, height/2 - 60 , size);
     ellipse(x, height/2 + 120, size);
      ellipse(x, height/2 - 120 , size);
     ellipse(x, height/2 + 180, size);
      ellipse(x, height/2 - 180 , size);
     
      ellipse(x-60, height / 2, size);
     ellipse(x-60, height/2 + 60, size);
      ellipse(x-60, height/2 - 60 , size);
     ellipse(x-60, height/2 + 120, size);
      ellipse(x-60, height/2 - 120 , size);
     ellipse(x-60, height/2 + 180, size);
      ellipse(x-60, height/2 - 180 , size);
     
     ellipse(x-120, height / 2, size);
     ellipse(x-120, height/2 + 60, size);
      ellipse(x-120, height/2 - 60 , size);
     ellipse(x-120, height/2 + 120, size);
      ellipse(x-120, height/2 - 120 , size);
     ellipse(x-120, height/2 + 180, size);
      ellipse(x-120, height/2 - 180 , size);
     
     ellipse(x-180, height / 2, size);
     ellipse(x-180, height/2 + 60, size);
      ellipse(x-180, height/2 - 60 , size);
     ellipse(x-180, height/2 + 120, size);
      ellipse(x-180, height/2 - 120 , size);
     ellipse(x-180, height/2 + 180, size);
      ellipse(x-180, height/2 - 180 , size);
 } else {
   ellipse(x, height / 2, size);
 }

  // Wrap around when it exits the right edge
  if (x > width + size / 2) {
    x = 0;
  }

 
  // --- Your if/else goes here ---
  // Try swapping this out for your own rule.
}

// Keys 1, 2, 3 change the background color — this is your mode switch
function keyPressed() {
  switch (key) {
    case "1":
      bgColor = color(100, 100, 100);
      break; // red
    case "2":
      bgColor = color(60, 60, 60);
      break; // green
    case "3":
      bgColor = color(30, 30, 30);
      break; // blue
    default:
      bgColor = color(0,0,0); // grey
  }
}
