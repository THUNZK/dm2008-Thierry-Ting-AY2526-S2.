// DM2008 — Activity 3a [Guided]
// Array Sampler (20 min)
//
// An array stores a list of values — here it's colors, but it could be
// sizes, positions, or anything else.
// Press any key to cycle through the array one item at a time.
//
// Try these:
// - Replace the colors with your own values (sizes, positions, text).
// - Use mousePressed() instead of keyPressed().
// - Use push() to add new items or splice() to remove them.
// - Loop through the whole array to draw all items at once.
//
// Stretch: visualize all items in the array simultaneously instead of one at a time.

let palette = ["#f06449", "#009988", "#3c78d8", "#ffeb3b", "#04921", "#f03933", "#3f039", "#033330", "#000000", "#f06401"];
let size = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 190, 180, 170, 160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10]
let shapes = ["circle", "rect", "triangle"]; 
let currentIndex = 0;

function setup() {
  createCanvas(400, 400);
  rectMode(CENTER); 
  noStroke();
}

function draw() {
  background(220); 
  let bgIndex = (currentIndex + 2) % palette.length;
  background(palette[bgIndex]); 
  let currentSize = size[currentIndex % size.length];
  let currentColor = palette[currentIndex % palette.length];
  let currentShape = shapes[currentIndex % shapes.length];

  if (mouseIsPressed=== true) {
  currentIndex++;
  
  // Reset the index if it goes past the length of the size array
  if (currentIndex >= size.length) {
    currentIndex = 0;
  }
}
  fill(currentColor);
  if (currentShape === "circle") {
    circle(200, 200, currentSize);
  } else if (currentShape === "rect") {
    rectMode(CENTER);
    rect(200, 200, currentSize, currentSize);
  } else if (currentShape === "triangle") {
    let s = currentSize / 2;
    triangle(200, 200 - s, 200 - s, 200 + s, 200 + s, 200 + s);
  }
  
}
  
// Advance to the next color each time a key is pressed
function keyPressed() {
  currentIndex++; // shorthand for currentIndex += 1

  // Wrap back to the start when we reach the end
  if (currentIndex >= palette.length) {
    currentIndex = 0;
  }
  console.log("Current index:", currentIndex, "→", palette[currentIndex]);
}
