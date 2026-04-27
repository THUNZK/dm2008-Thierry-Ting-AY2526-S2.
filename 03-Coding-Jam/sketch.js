let port; // Serial Communication port
let connectBtn;
const spacing = 20
let cols = 25
let rows = 25
let sensorVal;
let circleSize = 50;
let targetSize = 50; // used for Option 2

let cWidth, cHeight;
let xSpacing, ySpacing;

function setup() {
  createCanvas(windowWidth, windowHeight);
   
  
  port = createSerial(); // creates the Serial Port


  // Connection helpers
  connectBtn = createButton("Connect to Arduino");
  connectBtn.position(20, 20);
  connectBtn.mousePressed(connectBtnClick);
}

function draw() {
  rectMode(CENTER);
   background(100);
    ellipse (width/2, height/2, 200, 50);
  fill(100)
   ellipse (width/2, height/2, 150, 25);
    cWidth = circleSize/rows;
    cHeight = targetSize/cols;
   xSpacing = circleSize/2;
   ySpacing = cHeight/2;
  for(let y = 0; y < cols; y++) {
    for(let x = 0; x < rows; x++) {
      noStroke();
      //change color based on x and y
      fill(330, circleSize * 100/cols, circleSize * 100/rows);
      //draw circle, size based on x
      ellipse(y * cWidth + xSpacing, y * cHeight + ySpacing, cWidth * x/10 + random(10));
    }
  }
  // fill(0)

    
  // fill (0);
  // stroke(circleSize);
  // strokeWeight(circleSize, targetSize);

  // ellipse(width / 2, height / 2, circleSize);
   
   

  // Receive data from Arduino
  if (port.opened()) {
    sensorVal = port.readUntil("\n");
    // Only log data that has information, not empty signals
    if (sensorVal[0]) {
      // Once you verify data is coming in,
      // disable logging to improve performance
      console.log(sensorVal);

      // OPTION 1:
      // Update circle's size with sensor's data directly
      // Reduce delay() value in Ardiuno to get smoother changes

      // use float() to convert from data from string to number
      // circleSize = float(sensorVal);

      // OPTION 2:
      // Update circle's size using lerp() to smoothly change values
      // This method even works with longer delay() values in Arduino

      targetSize = float(sensorVal);
      // last value in lerp() controls speed of change
      circleSize = lerp(circleSize, targetSize, 0.1);
  }
}
}

// DO NOT REMOVE THIS FUNCTION
function connectBtnClick(e) {
  // If port is not already open, open on click,
  // otherwise close the port
  if (!port.opened()) {
    port.open(9600); // opens port with Baud Rate of 9600
    e.target.innerHTML = "Disconnect Arduino";
    e.target.classList.add("connected");
  } else {
    port.close();
    e.target.innerHTML = "Connect to Arduino";
    e.target.classList.remove("connected");
  }
}
