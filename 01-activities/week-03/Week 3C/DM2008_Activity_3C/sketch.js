// DM2008 — Activity 3c [Guided]
// Painting App (40 min)
//
// Each brush is its own function, stored in an array
// Switching brushes is as simple as changing the index
// Keys 1, 2, 3 switch brushes. C cycles color. + / - changes size. X clears.
//
// Stretch: add an eraser mode with E — paint using the background color instead.

const palette = ["#f06449", "#009988", "#3c78d8"];
let colorIndex = 0;
let sizeVal = 20;

// Storing brush functions in an array lets us switch between them with an index
const brushes = [brushCircle, brushSquare, brushStreak, eraser];
let currentBrush = 0;

function setup() {
  createCanvas(600, 600);
  background(240);
  rectMode(CENTER);
}

function draw() {
  
  let currentColour = palette[colorIndex % palette.length];
  
  if (mouseIsPressed === true) {
    const col = palette[colorIndex];
    
    colorIndex++;
    if (colorIndex >= palette.length) {
    colorIndex = 0;
    }
    
    brushes[currentBrush](mouseX, mouseY, col, sizeVal);
  } 
}

// All brush functions share the same parameters (x, y, c, s)
// That's what makes them interchangeable in the array
function brushCircle(x, y, c, s) {
  noStroke();
  fill(c);
  ellipse(x, y, s);
}

function brushSquare(x, y, c, s) {
  push();
  translate(x, y);
  noStroke();
  fill(c);
  rect(0, 0, s, s);
  pop();
}

function brushStreak(x, y, c, s) {
  stroke(c);
  strokeWeight(max(2, s / 8));
  point(x, y);
}

function eraser(x,y,c,s){
  noStroke();
  fill(240);
  ellipse(x,y,s);
}

function keyPressed() {
  switch (key) {
    case "1":
      currentBrush = 0;
      break; // circle
    case "2":
      currentBrush = 1;
      break; // square
    case "3":
      currentBrush = 2;
    case "4":// streak
    currentBrush = 3;
    break;
      
  }

  
  
  if (key == "C" || key == "c") {
    colorIndex = (colorIndex + 1) % palette.length;
  }
  if (key == "+" || key == "=") {
    sizeVal += 4;
  }
  if (key == "-" || key == "_") {
    // look at reference to learn what max() does
    sizeVal = max(4, sizeVal - 4);
  }
  if (key == "X" || key == "x") {
    background(240);
  }
}
