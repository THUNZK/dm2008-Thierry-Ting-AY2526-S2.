let cookie;

function setup() {
  createCanvas(400, 400);
  noStroke();
  cookie = new Cookie("chocolate", 80, width / 2, height / 2);
}

function draw() {
  background(230);
  cookie.update();
  cookie.show();
}

class Cookie {
  constructor(flavor, sz, x, y) {
    this.flavor = flavor;
    this.sz = sz;
    this.x = x;
    this.y = y;
    this.vx = 3;
    this.vy = 2;
  }

  show() {
    switch (this.flavor) {
      case "chocolate":  fill(196, 146,  96); break;
      case "vanilla":    fill(255, 223, 150); break;
      case "matcha":     fill(160, 200, 120); break;
      case "strawberry": fill(240, 150, 170); break;
      default:           fill(220, 180, 120);
    }
    ellipse(this.x, this.y, this.sz);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    const r = this.sz / 2;

    if (this.x - r < 0 || this.x + r > width) {
      this.vx *= -1;
      this.x = constrain(this.x, r, width - r);
      this.randomFlavor();
    }
    if (this.y - r < 0 || this.y + r > height) {
      this.vy *= -1;
      this.y = constrain(this.y, r, height - r);
      this.randomFlavor();
    }
  }

  move() {
    const step = 10;
    if (keyCode === LEFT_ARROW)  this.x -= step;
    if (keyCode === RIGHT_ARROW) this.x += step;
    if (keyCode === UP_ARROW)    this.y -= step;
    if (keyCode === DOWN_ARROW)  this.y += step;
  }

  randomFlavor() {
    const flavors = ["chocolate", "vanilla", "matcha", "strawberry"];
    this.flavor = random(flavors);
  }
}

function keyPressed() {
  cookie.move();
}

function mousePressed() {
  cookie.randomFlavor();
}