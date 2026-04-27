// DM2008 — Mini Project
// FLAPPY BIRD (Starter Scaffold)

// Notes for students:
// 1) Add flap control in keyPressed() (space / ↑ to jump) ✓ 
// 2) Detect collisions between the bird and pipes → game over ✓
// 3) Add scoring when you pass a pipe ✓
// 4) (Stretch) Add start/pause/game-over states

let bird;
let pipes = [];
let score = 0;
let GameOver = false;
let GameBegun = false;
let spawnCounter = 0;
let dead = false;
let paused = false;
let shake = 0;
let flash = 0;
let scoreFlash = 0;
let highScore = 0;

let flapSound;
let deathSound;
let passSound;
let thumpSound;
let bgMusic;
let evilSound;
let startSound;

let Font;
let bg;
let scroll = 0;
let flappy;
let pipeImg;
let fadeAlpha = 0;

const deathFrames = 60;
const SPAWN_RATE = 80;
const PIPE_SPEED = 3;
//const PIPE_GAP = 175
const PIPE_W = 94;

function preload(){
  bg = loadImage ("Artboard 1.png");
  flappy = loadImage("Artboard 3.png");
  pipeImg = loadImage("Artboard 2.png")
  Font = loadFont("CaesarDressing-Regular.ttf")
  
  flapSound = loadSound("Jump.wav");
  deathSound = loadSound("explosion.wav");
  passSound = loadSound("pass.wav")
  thumpSound = loadSound ("thump.wav")
  bgMusic = loadSound ("bgMusic.ogg")
  evilSound = loadSound ("evil.ogg")
  startSound = loadSound ("start.wav")
}

function setup() {
  createCanvas(480, 640);
  noStroke();
  textFont(Font);
  resetGame();
  bgMusic.loop();
  drawingContext.shadowOffsetX = 5; 
  drawingContext.shadowOffsetY = 5;
  drawingContext.shadowBlur = 15; 
  drawingContext.shadowColor = 'black';
}

function draw() {
  if (shake > 0) {
  translate(random(-shake, shake), random(-shake, shake));
  shake *= 0.9;
  }
  
  if (GameOver) {
  drawScore();
  return;
}
  scroll -= 0.4;
  if (scroll <= -1067) scroll = 0;
  image (bg, scroll, 0);
  image (bg, scroll +1067, 0);
  
  if (flash > 0) {
  if (frameCount % 2 == 0) { 
    fill(255, 255, 255, 150);
    rect(0, 0, width, height);
  }
  flash--;
}
  if (scoreFlash > 0) 
  scoreFlash--; 
  
    if (dead) {
    bird.update();
    for (let i = 0; i < pipes.length; i++) {
    pipes[i].show();
  }
      
    bird.show(); {
    if (bird.pos.y >= height - bird.r) {
    GameOver = true;
      shake = 0;
  }
    drawScore();
    if (GameOver) { 
    loop();
      }
    }
    return;
}
  bird.update();
  spawnCounter++;
  if (spawnCounter >= SPAWN_RATE) {
  pipes.push(new Pipe(width + 40));
  spawnCounter = 0;
  shake = 3;
  thumpSound.play();
}
  for (let i = pipes.length - 1; i >= 0; i--) {
  pipes[i].update();
  pipes[i].show();
    if (pipes[i].hits(bird)) {
    dead = true;
    bird.vel.y = -10;                 
    bird.vel.x = 1
    shake = 15;
    flash = 6;
    deathSound.play();
    evilSound.play();
}
  if (pipes[i].offscreen()) {
  pipes.splice(i, 1);
}
  if (pipes[i] && !pipes[i].passed && pipes[i].past(bird)) {
  score++;
  pipes[i].passed = true;
  passSound.play();
    if (score > highScore) highScore = score;
    if (score % 5 == 0) scoreFlash = 9;
  }
}
  bird.show();
  drawScore();
}

function drawScore() {
  push();
  if (scoreFlash > 0 && frameCount % 3 == 0) {
    fill(255, 255, 255);
  } 
  else {
    fill(0);
  }
  stroke(255);
  strokeWeight(5);
  textSize(70);
  textAlign(CENTER);
  text(score, width / 2, 120);
  pop();
  
  push();
  fill(255);
  textSize(20);
  textAlign(CENTER);
  text("Best: " + highScore, width / 2, 40);
  pop();
  
  if (GameOver) {
      fadeAlpha += 0.1; 
  fadeAlpha = min(fadeAlpha, 150);
  fill(255, 0, 0, fadeAlpha);
  rect(0, 0, width, height);
  textAlign(CENTER);
    push();
    stroke(255);
    strokeWeight(5);
  textSize(70);
  fill(0);
  text('GAME OVER', width / 2, height / 2);
    pop();
  textSize(30);
    fill(255)
  text('press SPACE to Retry?', width / 2, height / 2+50);
} 
  else if (dead) {

} 
  else if (GameBegun == false) {
  textAlign(CENTER);
    push();
  textSize(90);
  fill(0);
  stroke(255);
  strokeWeight(5);
  text('TEMPYBIRD', width / 2, height / 2);
    pop();
  textSize(30);
  fill(255);
  text('Press SPACE to Start!', width / 2, height / 2+50);
}
  if (paused) {
  textAlign(CENTER);
    push();
    stroke(255);
    strokeWeight(5);
  textSize(70);
  fill(0);
  text('PAUSED', width / 2, height / 2);
    pop();
  textSize(15);
    fill(255);
  text('Press ESC to Resume', width / 2, height / 2+50);
  return;
  }
    push();
  stroke(255);
  strokeWeight(5);
  fill (0);
  textSize(30);
  text("||", 30, 45);
  textSize(15);
  text("ESC", 30, 65);
  pop();
  
}

function resetGame() {
  score = 0;
  dead = false;
  deathTimer = 0;
  GameOver = false;
  GameBegun = false;
  fadeAlpha = 0;
  scroll = 0;
  bgMusic.stop();
  bgMusic.loop();
  shake = 0;
  pipes = [];
  spawnCounter = 0;
  bird = new Bird(140, height / 2);
  pipes.push(new Pipe(width + 30));
  noLoop();
}

function keyPressed() {
  if ((key === " " || keyCode === UP_ARROW) && !dead) {
  bird.flap();
}
  if (keyCode === 27 ) {
  paused = !paused;
  paused ? noLoop() : loop();
}
  if (GameOver && key == " ") {
  resetGame();
  } 
  else if (GameBegun == false && key == " ") {
  GameBegun = true;
  startSound.play();
  loop();
  }
}

class Bird {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.r = 30;
    this.gravity = 0.5;
    this.flapStrength = -9.0;
  }

  applyForce(fy) {
    this.acc.y += fy;
  }

  flap() {
    this.vel.y = this.flapStrength;
    flapSound.play();
  }

  update() {
    this.applyForce(this.gravity);
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (this.pos.y < this.r) {
      this.pos.y = this.r;
      this.vel.y = 0;
    }
    if (this.pos.y > height - this.r) {
      this.pos.y = height - this.r;
      this.vel.y = 0;
      if (!dead) {
        shake = 15;
        dead = true;
        this.vel.y = -10;
        this.vel.x = 1;
        flash = 6;
        deathSound.play();
        evilSound.play();
      }
    }
  }

  show() {
    push();
    imageMode(CENTER);
    stroke(255);
    strokeWeight(5);
  image(flappy, this.pos.x, this.pos.y, this.r*2.4, this.r*2.4);
    pop();
  //fill(400, 400, 400);
  //circle(this.pos.x, this.pos.y, this.r * 2);
  }
}

class Pipe {
  constructor(x) {
    this.x = x;
    this.w = PIPE_W;
    this.speed = PIPE_SPEED;
    this.gap = random(172, 230); 

    const margin = 40;
    const gapY = random(margin, height - margin - this.gap);

    this.top = gapY;
    this.bottom = gapY + this.gap;
    this.passed = false;
  }
  update() {
    this.x -= this.speed;
  }
  show() {
    image(pipeImg,this.x, this.top-pipeImg.height)
    //rect(this.x, 0, this.w, this.top);
    image(pipeImg, this.x, this.bottom);
  }
  offscreen() {
    return this.x + this.w < 0;
  }
  hits(bird) {
    const adjust = 5; 
    const closestX = constrain(bird.pos.x, this.x, this.x + this.w);
    const closestYTop = constrain(bird.pos.y, 0-adjust, this.top-adjust);
    const closestYBottom = constrain(bird.pos.y, this.bottom, height);
    const dTop = dist(bird.pos.x, bird.pos.y, closestX, closestYTop);
    const dBottom = dist(bird.pos.x, bird.pos.y, closestX, closestYBottom);
    return dTop < bird.r || dBottom < bird.r;
  }
  past(bird) {
    return bird.pos.x - bird.r > this.x + this.w;
  }
}


