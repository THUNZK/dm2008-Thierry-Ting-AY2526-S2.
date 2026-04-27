// DM2008 — Activity 1a
// Simple Creatures (20 min)

// Run the sketch, then click on the preview to enable keyboard
// Use the 'Option' ('Alt' on Windows) key to view or hide the grid
// Use the 'Shift' key to change overlays between black & white
// Write the code for your creature within the space provided

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background('orange');
  rectMode(CENTER);
  
  push();
  noStroke();
  fill('white')
  circle(width/2-27,height/2-65,10);
  circle(width/2-35,height/2-65,10);
  circle(width/2-43,height/2-65,10);
  circle(width/2-51,height/2-65,10);
  circle(width/2-59,height/2-65,10);
  
  circle(width/2-27,height/2-44,10);
  circle(width/2-35,height/2-44,10);
  circle(width/2-43,height/2-44,10);
  circle(width/2-51,height/2-44,10);
  circle(width/2-59,height/2-44,10);
  pop();
  
  noStroke();
  fill('black')
  rect(width/2,height/2,50,200);
  
  rect(width/2-30,height/2-75,70,20);
  rect(width/2-30,height/2-35,70,20);
  
   push();
  noStroke();
  fill('white')
  circle(width/2,height/2-70,30);
  pop();
  
  circle(width/2,height/2-70,10);
  
  rect(width/2+55,height/2+75,100,50);
  rect(width/2-15,height/2+100,20,70);
  rect(width/2+15,height/2+100,20,70);
   rect(width/2+65,height/2+100,20,70);
  rect(width/2+95,height/2+100,20,70);
  
  triangle(200, 50,175,101,225,101);
  triangle(160, 335,175,316,175,335);
  triangle(240, 335,224,316,224,335);
  triangle(135, 175,176,175,176,201);
  triangle(135, 115,176,115,176,102);
  triangle(280, 250,305,275,318,217);
  
  
  text('Im a party hat eating dog',23,149);
  
  helperGrid(); // do not edit or remove this line
  
}

