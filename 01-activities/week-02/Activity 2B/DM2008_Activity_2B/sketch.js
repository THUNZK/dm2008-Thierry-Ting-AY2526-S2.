// DM2008 — Activity 2b
// (Patern Making, 40 min)
size = 50
let reversedMouseX;
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(240);
  noStroke();
  reversedMouseX = map(mouseX, 0, width, width, 0);

  // A simple horizontal row of shapes using a 1D loop
let even = map(mouseX, 0, width, 0, 255);
let odd = map(reversedMouseX, 0, width, 0, 255);

for (let i = 0; i < 1000; i++) {

  if (i % 3 == 0) {
    fill(even, 50, 150);

  } else if (i % 4 == 0) {
    fill(100, odd, 200);

  } else if (i % 5 == 0) {
    fill(255 - even, 200, odd);
  }
  
  rect(i*i/reversedMouseX*-1+reversedMouseX-mouseY , 0, size);
  rect(i*i/reversedMouseX+reversedMouseX-mouseY , 0, size);
    
  rect(i*i/mouseX*-1+mouseX+mouseY , 0+ size, size);
  rect(i*i/mouseX+mouseX+mouseY , 0+ size, size);
    
  rect(i*i/reversedMouseX*-1+reversedMouseX-mouseY , 0+ 2*size, size);
  rect(i*i/reversedMouseX+reversedMouseX-mouseY , 0+ 2*size, size);
  
  rect(i*i/mouseX*-1+mouseX+mouseY ,0+ 3*size, size);
  rect(i*i/mouseX+mouseX+mouseY,0+ 3*size, size);
    
  rect(i*i/reversedMouseX*-1+reversedMouseX-mouseY , 0+ 4*size, size);
  rect(i*i/reversedMouseX+reversedMouseX-mouseY , 0+ 4*size, size);
  
  rect(i*i/mouseX*-1+mouseX+mouseY ,0+ 5*size, size);
  rect(i*i/mouseX+mouseX+mouseY ,0+ 5*size, size);
    
  rect(i*i/reversedMouseX*-1+reversedMouseX-mouseY , 0+ 6*size, size);
  rect(i*i/reversedMouseX+reversedMouseX-mouseY , 0+ 6*size, size);
    
  rect(i*i/mouseX*-1+mouseX+mouseY , 0+ 7*size, size);
  rect(i*i/mouseX+mouseX+mouseY , 0+ 7*size, size);
    
    

  

    // TODO: add an if() condition to alternate shape, size, or color
    // (hint: use % modulo to alternate every other shape)
  }

  // TODO: add one interaction (mouse or key) to change the rule
  // (hint: try changing fill() or size when mouseIsPressed)
}