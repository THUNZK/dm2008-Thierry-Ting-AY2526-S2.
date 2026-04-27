let balls = [];

function setup() {
  createCanvas(400, 400);
  balls.push(new Ball(100, 200));
  balls.push(new Ball(300, 200));
  balls.push(new Ball(200, 100));
}

function draw() {
  background(230);

  let isColliding = new Array(balls.length).fill(false);

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      let d = dist(balls[i].pos.x, balls[i].pos.y, balls[j].pos.x, balls[j].pos.y);
      if (d < balls[i].r + balls[j].r) {
        isColliding[i] = true;
        isColliding[j] = true;

        let temp = balls[i].vel.copy();
        balls[i].vel = balls[j].vel.copy();
        balls[j].vel = temp;

        let nudge = p5.Vector.sub(balls[i].pos, balls[j].pos).setMag(2);
        balls[i].pos.add(nudge);
        balls[j].pos.sub(nudge);
      }
    }
  }

  for (let i = 0; i < balls.length; i++) {
    balls[i].move();
    balls[i].show(isColliding[i]);
  }
}

class Ball {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2, 2), random(-2, 2));
    this.r = 30;
  }

  move() {
    this.pos.add(this.vel);

    if (this.pos.x - this.r < 0 || this.pos.x + this.r > width) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, this.r, width - this.r);
    }
    if (this.pos.y - this.r < 0 || this.pos.y + this.r > height) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, this.r, height - this.r);
    }
  }

  show(colliding) {
    noStroke();
    if (colliding) {
      fill(220, 80, 80);
    } else {
      fill(100, 180, 220);
    }
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
}