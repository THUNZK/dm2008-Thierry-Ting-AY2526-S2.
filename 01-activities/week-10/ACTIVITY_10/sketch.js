let shapes = [];

let sizeSlider, speedSlider;
let shapeSelect, colorSelect;
let addBtn, clearBtn;

function setup() {
  createCanvas(600, 400);

  createSpan('Size: ').position(20, 420);
  sizeSlider = createSlider(10, 80, 30);
  sizeSlider.position(70, 420);

  createSpan('Speed: ').position(20, 450);
  speedSlider = createSlider(1, 8, 3, 0.5);
  speedSlider.position(70, 450);
  createSpan('Shape: ').position(20, 480);
  shapeSelect = createSelect();
  shapeSelect.position(70, 480);
  shapeSelect.option('circle');
  shapeSelect.option('square');
  shapeSelect.option('triangle');

  createSpan('Color: ').position(220, 480);
  colorSelect = createSelect();
  colorSelect.position(270, 480);
  colorSelect.option('tomato');
  colorSelect.option('royalblue');
  colorSelect.option('mediumseagreen');
  colorSelect.option('gold');
  colorSelect.option('mediumpurple');
  colorSelect.option('random');
  addBtn = createButton('Add Shape');
  addBtn.position(20, 520);
  addBtn.mousePressed(addShape);

  clearBtn = createButton('Clear All');
  clearBtn.position(110, 520);
  clearBtn.mousePressed(() => shapes = []);
}

function addShape() {
  let chosen = colorSelect.value();
  let c = (chosen === 'random')
    ? color(random(255), random(255), random(255))
    : color(chosen);

  shapes.push({
    x: random(width),
    y: random(height),
    vx: random(-1, 1),
    vy: random(-1, 1),
    size: sizeSlider.value(),
    type: shapeSelect.value(),
    col: c
  });
}

function draw() {
  background(30, 30, 40);
  fill(200);
  noStroke();
  textSize(12);
  text('shapes: ' + shapes.length, 10, 20);

  let speed = speedSlider.value();

  for (let s of shapes) {
    s.x += s.vx * speed;
    s.y += s.vy * speed;
    if (s.x < s.size/2 || s.x > width - s.size/2) s.vx *= -1;
    if (s.y < s.size/2 || s.y > height - s.size/2) s.vy *= -1;
    fill(s.col);
    noStroke();
    if (s.type === 'circle') {
      circle(s.x, s.y, s.size);
    } else if (s.type === 'square') {
      rectMode(CENTER);
      rect(s.x, s.y, s.size, s.size);
    } else {
      triangle(
        s.x, s.y - s.size/2,
        s.x - s.size/2, s.y + s.size/2,
        s.x + s.size/2, s.y + s.size/2
      );
    }
  }
}