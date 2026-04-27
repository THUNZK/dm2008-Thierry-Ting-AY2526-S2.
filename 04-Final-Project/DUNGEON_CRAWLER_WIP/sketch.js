// ============================================================
// DUNGEON CRAWLER — turn-based RPG, grid-menu UI
// ============================================================

const CONFIG = {
  PLAYER_MAX_HP: 10,
  PLAYER_MAX_ENERGY: 10,
  ENEMY_HP: 3,

  POTION_HEAL: 3,
  POTIONS_PER_FLOOR: 2,

  PUNCH_DMG: 1, PUNCH_COST: 1,
  SWORD_DMG: 2, SWORD_COST: 2,
  BOW_DMG: 2,   BOW_COST:  2,
  BOW_RANGE: 6,

  // Level-up
  LEVEL_DMG_BONUS: 10,
  UNLOCK_POTION: 1,
  UNLOCK_SWORD:  3,
  UNLOCK_BOW:    5,

  // Enemies
  MAX_ENEMIES: 50,
  MIN_SPAWN_DISTANCE: 5,
  RESPAWN_INTERVAL: 15,
  MOVE_HOLD_DELAY: 0,
  MOVE_HOLD_INTERVAL: 0,

  // Feel
  ENEMY_TURN_DELAY_FRAMES: 4
};

// ---------------- MAP / VIEW ----------------
const COLS = 50;
const ROWS = 50;
const TILE = 40;
const REVEAL_R = 6;
const FLASH_TTL = 14;

const VIEW_TILES = 13;
const VIEW_HALF  = Math.floor(VIEW_TILES / 2);
const VIEW_SIZE  = VIEW_TILES * TILE;

// ---------------- LAYOUT ----------------
const OUTER_PAD = 8;
const PANEL_GAP = 10;

const LEFT_W = 80;
const LEFT_X = OUTER_PAD;
const LEFT_Y = OUTER_PAD;

const VIEW_X = LEFT_X + LEFT_W + PANEL_GAP;
const VIEW_Y = OUTER_PAD;

const MM_TILE = 5;
const MM_SIZE = COLS * MM_TILE;
const SIDEBAR_W = MM_SIZE;
const MM_X = VIEW_X + VIEW_SIZE + PANEL_GAP;
const MM_Y = OUTER_PAD;

const STATUS_Y = MM_Y + MM_SIZE + PANEL_GAP;
const STATUS_H = 70;

const ACTIONS_Y = STATUS_Y + STATUS_H + PANEL_GAP;
const ACTIONS_H = 180;

const HUD_Y = VIEW_Y + VIEW_SIZE + PANEL_GAP;
const HUD_H = 50;

const CANVAS_W = MM_X + SIDEBAR_W + OUTER_PAD;
const CANVAS_H = HUD_Y + HUD_H + OUTER_PAD;

// ---------------- SPRITES ----------------
let spriteImages = {};

function preload() {
  spriteImages = {};
  if (typeof window === 'undefined' || !window.GAME_ASSETS) return;
  for (let key in window.GAME_ASSETS) {
    let paths = [].concat(window.GAME_ASSETS[key]);
    spriteImages[key] = [];
    for (let p of paths) {
      if (!p || p.trim() === '') continue;
      spriteImages[key].push(loadImage(p, () => {}, () => {}));
    }
  }
}
function pickVariant(key, seed) {
  let arr = spriteImages[key];
  if (!arr || arr.length === 0) return null;
  return arr[((seed * 2654435761) >>> 0) % arr.length];
}
function drawSprite(key, x, y, seed, fallbackFn, size = TILE) {
  let img = pickVariant(key, seed);
  if (img) image(img, x, y, size, size);
  else fallbackFn();
}

// ---------------- STATE ----------------
let grid = [], visited = [], rooms = [];

let player = { x: 0, y: 0 };
let stairs = { x: 0, y: 0 };
let lastDir = { dx: 1, dy: 0 };

let playerHP = CONFIG.PLAYER_MAX_HP;
let energy   = CONFIG.PLAYER_MAX_ENERGY;
let potions  = CONFIG.POTIONS_PER_FLOOR;

let charLevel = 1;
let xp = 0;

let score = 0, depth = 1, highScore = 0, turnCount = 0;

let enemies = [];
let attackFlash = [];

// ---- NEW: Attack animations ----
let activeAnimations = [];

let heldMoveFrames = 0, heldMoveDir = '';
let hitFlash = 0, shakeTimer = 0;

const ACTIONS = [
  { id: 'PUNCH',  col: 0, row: 0 },
  { id: 'SWORD',  col: 1, row: 0 },
  { id: 'BOW',    col: 0, row: 1 },
  { id: 'POTION', col: 1, row: 1 }
];
let menuMode = 'closed';
let cursor   = 0;
let lastUsed = 0;

let pendingEnemyTurn = 0;

let message = '', messageTTL = 0;
function showMessage(txt, ttl = 150) { message = txt; messageTTL = ttl; }

// ---------------- SETUP ----------------
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  textFont('monospace');
  imageMode(CORNER);
  noSmooth();
  initLevel();
}

function initLevel() {
  for (let x = 0; x < COLS; x++) {
    grid[x] = []; visited[x] = [];
    for (let y = 0; y < ROWS; y++) {
      grid[x][y] = 1;
      visited[x][y] = false;
    }
  }
  rooms = []; enemies = []; attackFlash = []; activeAnimations = [];
  turnCount = 0;
  heldMoveFrames = 0; heldMoveDir = '';
  pendingEnemyTurn = 0;
  potions = CONFIG.POTIONS_PER_FLOOR;
  energy = CONFIG.PLAYER_MAX_ENERGY;
  menuMode = 'closed'; cursor = lastUsed;

  generateDungeon();
  placePlayer();
  placeStairs();
  spawnEnemies(3 + depth);
  revealAround(player.x, player.y, REVEAL_R);
}

// ---------------- DUNGEON ----------------
function generateDungeon() {
  const TARGET_ROOMS = 14;
  const MAX_TRIES = 300;

  for (let i = 0; i < MAX_TRIES && rooms.length < TARGET_ROOMS; i++) {
    let w = floor(random(5, 9));
    let h = floor(random(5, 9));
    let x = floor(random(1, COLS - w - 1));
    let y = floor(random(1, ROWS - h - 1));

    let overlaps = rooms.some(r =>
      x < r.x + r.w + 1 && x + w + 1 > r.x &&
      y < r.y + r.h + 1 && y + h + 1 > r.y
    );
    if (overlaps) continue;

    rooms.push({ x, y, w, h });
    for (let rx = x; rx < x + w; rx++) {
      for (let ry = y; ry < y + h; ry++) grid[rx][ry] = 0;
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    let c = roomCenter(rooms[i]);
    let best = rooms[0], bestD = 99999;
    for (let j = 0; j < i; j++) {
      let oc = roomCenter(rooms[j]);
      let d = manhattan(c.x, c.y, oc.x, oc.y);
      if (d < bestD) { bestD = d; best = rooms[j]; }
    }
    carveCorridor(rooms[i], best);
  }
}
function roomCenter(r) { return { x: floor(r.x + r.w / 2), y: floor(r.y + r.h / 2) }; }
function carveCorridor(a, b) {
  let ac = roomCenter(a), bc = roomCenter(b);
  let x = ac.x, y = ac.y;
  if (random() < 0.5) {
    while (x !== bc.x) { grid[x][y] = 0; x += bc.x > x ? 1 : -1; }
    while (y !== bc.y) { grid[x][y] = 0; y += bc.y > y ? 1 : -1; }
  } else {
    while (y !== bc.y) { grid[x][y] = 0; y += bc.y > y ? 1 : -1; }
    while (x !== bc.x) { grid[x][y] = 0; x += bc.x > x ? 1 : -1; }
  }
  grid[bc.x][bc.y] = 0;
}
function placePlayer() { let c = roomCenter(rooms[0]); player.x = c.x; player.y = c.y; }
function placeStairs() {
  let best = rooms[0], bestD = -1;
  for (let r of rooms) {
    let c = roomCenter(r);
    let d = manhattan(c.x, c.y, player.x, player.y);
    if (d > bestD) { bestD = d; best = r; }
  }
  let c = roomCenter(best);
  stairs.x = c.x; stairs.y = c.y;
  grid[stairs.x][stairs.y] = 2;
}
function nextFloor() {
  depth++; score += 50;
  showMessage('Descending to floor ' + depth + '...');
  initLevel();
}

// ---------------- ENEMIES ----------------
function randomEnemyWeapon() {
  if (random() < 0.75) return 'fist';
  return random() < 0.5 ? 'sword' : 'bow';
}
function newEnemy(x, y) {
  return { x, y, hp: CONFIG.ENEMY_HP, state: 'idle',
           attackReady: false, weapon: randomEnemyWeapon() };
}
function spawnEnemies(count) {
  let spots = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (grid[x][y] === 0 &&
          manhattan(x, y, player.x, player.y) > CONFIG.MIN_SPAWN_DISTANCE) {
        spots.push({ x, y });
      }
    }
  }
  shuffle(spots, true);
  for (let i = 0; i < min(count, spots.length); i++) {
    enemies.push(newEnemy(spots[i].x, spots[i].y));
  }
}
function respawnEnemy() {
  let spots = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (grid[x][y] === 0 && !visited[x][y]) spots.push({ x, y });
    }
  }
  if (spots.length === 0) return;
  let s = random(spots);
  enemies.push(newEnemy(s.x, s.y));
}

// ---------------- HELPERS ----------------
function manhattan(ax, ay, bx, by) { return abs(ax - bx) + abs(ay - by); }
function isWalkable(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && grid[x][y] !== 1;
}
function tileOccupied(x, y, skip = null) {
  if (x === player.x && y === player.y) return true;
  return enemies.some(e => e !== skip && e.x === x && e.y === y);
}
function revealAround(cx, cy, r) {
  for (let x = cx - r; x <= cx + r; x++) {
    for (let y = cy - r; y <= cy + r; y++) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
      if (dist(cx, cy, x, y) <= r) visited[x][y] = true;
    }
  }
}
function inSight(x, y) { return dist(player.x, player.y, x, y) <= REVEAL_R; }

// ---------------- LEVEL UP ----------------
function xpForNextLevel(lv) { return 5 + (lv - 1) * 2; }
function isUnlocked(actionId) {
  if (actionId === 'PUNCH')  return true;
  if (actionId === 'POTION') return charLevel >= CONFIG.UNLOCK_POTION;
  if (actionId === 'SWORD')  return charLevel >= CONFIG.UNLOCK_SWORD;
  if (actionId === 'BOW')    return charLevel >= CONFIG.UNLOCK_BOW;
  return false;
}
function unlockLevelFor(actionId) {
  if (actionId === 'POTION') return CONFIG.UNLOCK_POTION;
  if (actionId === 'SWORD')  return CONFIG.UNLOCK_SWORD;
  if (actionId === 'BOW')    return CONFIG.UNLOCK_BOW;
  return 1;
}
function damageBonus() { return charLevel >= CONFIG.LEVEL_DMG_BONUS ? 1 : 0; }
function gainXP(amount) {
  xp += amount;
  while (xp >= xpForNextLevel(charLevel)) {
    xp -= xpForNextLevel(charLevel);
    charLevel++;
    onLevelUp(charLevel);
  }
}
function onLevelUp(lv) {
  let unlock = '';
  if (lv === CONFIG.UNLOCK_POTION) unlock = ' — Potion unlocked!';
  else if (lv === CONFIG.UNLOCK_SWORD)  unlock = ' — Sword unlocked!';
  else if (lv === CONFIG.UNLOCK_BOW)    unlock = ' — Bow unlocked!';
  else if (lv === CONFIG.LEVEL_DMG_BONUS) unlock = ' — +1 damage to all attacks!';
  showMessage('LEVEL UP! Now level ' + lv + unlock, 200);
  playerHP = CONFIG.PLAYER_MAX_HP;
  energy   = CONFIG.PLAYER_MAX_ENERGY;
}

// ---------------- ATTACK SHAPES ----------------
function getSwordTiles(cx, cy, dx, dy) {
  let px = -dy, py = dx;
  return [
    { x: cx + dx,      y: cy + dy },
    { x: cx + dx + px, y: cy + dy + py },
    { x: cx + dx - px, y: cy + dy - py },
    { x: cx + px,      y: cy + py },
    { x: cx - px,      y: cy - py }
  ];
}
function getBowTiles(cx, cy, dx, dy, stopAtPlayer) {
  let tiles = [];
  for (let n = 1; n <= CONFIG.BOW_RANGE; n++) {
    let x = cx + dx * n, y = cy + dy * n;
    if (!isWalkable(x, y)) break;
    tiles.push({ x, y });
    if (stopAtPlayer && x === player.x && y === player.y) break;
    if (!stopAtPlayer && enemies.some(e => e.x === x && e.y === y)) break;
  }
  return tiles;
}
function facingToward(ex, ey, tx, ty) {
  let dx = tx - ex, dy = ty - ey;
  if (abs(dx) > abs(dy)) return { dx: dx > 0 ? 1 : -1, dy: 0 };
  if (abs(dy) > 0)       return { dx: 0, dy: dy > 0 ? 1 : -1 };
  return { dx: 1, dy: 0 };
}
function flashTiles(tiles, rgb) {
  for (let t of tiles) {
    if (t.x < 0 || t.x >= COLS || t.y < 0 || t.y >= ROWS) continue;
    attackFlash.push({ x: t.x, y: t.y, ttl: FLASH_TTL,
                      r: rgb[0], g: rgb[1], b: rgb[2] });
  }
}
function damageEnemies(tiles, dmg) {
  let hit = new Set();
  for (let t of tiles) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      if (e.x === t.x && e.y === t.y && !hit.has(e)) {
        hit.add(e);
        e.hp -= dmg;
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          score += 10;
          gainXP(1);
        }
      }
    }
  }
}

// ============================================================
// NEW: ANIMATION SYSTEM
// ============================================================

// Spawn a punch impact animation at target tile
function spawnPunchAnim(tx, ty) {
  activeAnimations.push({
    type: 'punch',
    ttl: 0, maxTtl: 18,
    tx, ty
  });
}

// Spawn a sword swing arc animation
function spawnSwordAnim(cx, cy, dx, dy) {
  activeAnimations.push({
    type: 'sword',
    ttl: 0, maxTtl: 20,
    cx, cy, dx, dy
  });
}

// Spawn an arrow travel animation along a path
function spawnArrowAnim(sx, sy, dx, dy, path) {
  activeAnimations.push({
    type: 'arrow',
    ttl: 0, maxTtl: max(14, path.length * 3 + 4),
    sx, sy, dx, dy,
    path: path.slice()
  });
}

// Draw and tick all active animations (called in world/camera space)
function drawAnimations() {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    let a = activeAnimations[i];
    a.ttl++;
    let t = a.ttl / a.maxTtl; // 0..1 progress

    if (a.type === 'punch') {
      drawPunchAnim(a, t);
    } else if (a.type === 'sword') {
      drawSwordAnim(a, t);
    } else if (a.type === 'arrow') {
      drawArrowAnim(a, t);
    }

    if (a.ttl >= a.maxTtl) activeAnimations.splice(i, 1);
  }
}

function drawPunchAnim(a, t) {
  let cx = a.tx * TILE + TILE / 2;
  let cy = a.ty * TILE + TILE / 2;

  push();
  // Outer expanding ring
  let r1 = t * TILE * 1.1;
  noFill();
  stroke(255, 200, 80, (1 - t) * 255);
  strokeWeight(3);
  ellipse(cx, cy, r1 * 2, r1 * 2);

  // Inner ring slightly behind
  let r2 = max(0, (t - 0.15)) * TILE * 0.9;
  stroke(255, 240, 160, (1 - t) * 180);
  strokeWeight(2);
  ellipse(cx, cy, r2 * 2, r2 * 2);

  // Impact burst lines
  let numLines = 6;
  strokeWeight(2);
  for (let k = 0; k < numLines; k++) {
    let angle = (TWO_PI / numLines) * k + t * 0.5;
    let d1 = t * TILE * 0.3;
    let d2 = t * TILE * 0.9;
    let alpha = (1 - t) * 220;
    stroke(255, 230, 100, alpha);
    line(
      cx + cos(angle) * d1, cy + sin(angle) * d1,
      cx + cos(angle) * d2, cy + sin(angle) * d2
    );
  }

  // Central flash
  if (t < 0.3) {
    noStroke();
    fill(255, 255, 200, (0.3 - t) / 0.3 * 200);
    ellipse(cx, cy, TILE * 0.5, TILE * 0.5);
  }
  pop();
}

function drawSwordAnim(a, t) {
  let cx = a.cx * TILE + TILE / 2;
  let cy = a.cy * TILE + TILE / 2;
  let baseAngle = atan2(a.dy, a.dx);

  // Sweep from -65° to +65° relative to facing
  let sweepHalf = radians(65);
  let sweepStart = baseAngle - sweepHalf;
  let sweepEnd   = baseAngle + sweepHalf;

  // Progress drives the blade tip along the arc
  let progress = min(1, t * 1.6); // slightly faster draw
  let currentAngle = sweepStart + (sweepEnd - sweepStart) * progress;

  let bladeLen = TILE * 1.6;
  let alpha = (1 - t) * 255;

  push();

  // Trailing arc glow (drawn as a thick arc from start to current angle)
  noFill();
  strokeWeight(6);
  stroke(255, 240, 60, alpha * 0.4);
  arc(cx, cy, bladeLen * 2, bladeLen * 2, sweepStart, currentAngle);

  strokeWeight(3);
  stroke(255, 240, 100, alpha * 0.7);
  arc(cx, cy, bladeLen * 1.6, bladeLen * 1.6, sweepStart, currentAngle);

  // Bright leading edge line (the blade)
  let bx = cx + cos(currentAngle) * bladeLen;
  let by = cy + sin(currentAngle) * bladeLen;
  strokeWeight(3);
  stroke(255, 255, 220, alpha);
  line(cx + cos(currentAngle) * TILE * 0.3, cy + sin(currentAngle) * TILE * 0.3, bx, by);

  // Sparkle at blade tip
  noStroke();
  fill(255, 255, 200, alpha);
  ellipse(bx, by, 6, 6);

  // Small cross sparks at tip
  if (t < 0.7) {
    strokeWeight(1.5);
    stroke(255, 255, 200, alpha * 0.8);
    let sk = 5;
    line(bx - sk, by, bx + sk, by);
    line(bx, by - sk, bx, by + sk);
  }

  pop();
}

function drawArrowAnim(a, t) {
  if (a.path.length === 0) return;

  // Calculate position along path
  let totalSegs = a.path.length;
  let rawPos = t * (totalSegs + 0.5); // slightly overshoot end
  let segIdx = floor(rawPos);
  let segT   = rawPos - segIdx;

  let ax, ay;
  if (segIdx <= 0) {
    // Between spawn and first tile
    ax = lerp(a.sx * TILE + TILE / 2, a.path[0].x * TILE + TILE / 2, constrain(rawPos, 0, 1));
    ay = lerp(a.sy * TILE + TILE / 2, a.path[0].y * TILE + TILE / 2, constrain(rawPos, 0, 1));
  } else if (segIdx < totalSegs) {
    let prev = a.path[segIdx - 1];
    let curr = a.path[segIdx];
    ax = lerp(prev.x * TILE + TILE / 2, curr.x * TILE + TILE / 2, segT);
    ay = lerp(prev.y * TILE + TILE / 2, curr.y * TILE + TILE / 2, segT);
  } else {
    // Past end
    let last = a.path[totalSegs - 1];
    ax = last.x * TILE + TILE / 2 + a.dx * segT * TILE;
    ay = last.y * TILE + TILE / 2 + a.dy * segT * TILE;
  }

  let alpha = segIdx >= totalSegs ? (1 - segT) * 200 : 230;
  let angle = atan2(a.dy, a.dx);

  push();
  translate(ax, ay);
  rotate(angle);

  // Arrow shaft
  stroke(180, 140, 70, alpha);
  strokeWeight(2);
  noFill();
  line(-14, 0, 10, 0);

  // Arrowhead
  noStroke();
  fill(220, 180, 80, alpha);
  triangle(10, 0, 2, -4, 2, 4);

  // Fletching
  stroke(180, 60, 60, alpha);
  strokeWeight(1.5);
  line(-14, 0, -8, -4);
  line(-14, 0, -8, 4);

  // Motion trail
  for (let k = 1; k <= 3; k++) {
    let ta = alpha * (1 - k * 0.28);
    stroke(200, 180, 100, ta);
    strokeWeight(1.5 - k * 0.3);
    line(-14 - k * 7, 0, -14 - k * 7 + 4, 0);
  }
  pop();
}

// ---------------- PLAYER ACTIONS ----------------
function doPunch() {
  if (!isUnlocked('PUNCH') || energy < CONFIG.PUNCH_COST) return false;
  energy -= CONFIG.PUNCH_COST;
  let tx = player.x + lastDir.dx;
  let ty = player.y + lastDir.dy;
  let tiles = [{ x: tx, y: ty }];
  flashTiles(tiles, [220, 220, 220]);
  damageEnemies(tiles, CONFIG.PUNCH_DMG + damageBonus());
  // NEW: spawn punch animation
  spawnPunchAnim(tx, ty);
  return true;
}
function doSword() {
  if (!isUnlocked('SWORD') || energy < CONFIG.SWORD_COST) return false;
  energy -= CONFIG.SWORD_COST;
  let tiles = getSwordTiles(player.x, player.y, lastDir.dx, lastDir.dy);
  flashTiles(tiles, [230, 210, 55]);
  damageEnemies(tiles, CONFIG.SWORD_DMG + damageBonus());
  // NEW: spawn sword swing animation
  spawnSwordAnim(player.x, player.y, lastDir.dx, lastDir.dy);
  return true;
}
function doBow() {
  if (!isUnlocked('BOW') || energy < CONFIG.BOW_COST) return false;
  energy -= CONFIG.BOW_COST;
  let tiles = getBowTiles(player.x, player.y, lastDir.dx, lastDir.dy, false);
  flashTiles(tiles, [185, 85, 240]);
  damageEnemies(tiles, CONFIG.BOW_DMG + damageBonus());
  // NEW: spawn arrow animation
  spawnArrowAnim(player.x, player.y, lastDir.dx, lastDir.dy, tiles);
  return true;
}
function doPotion() {
  if (!isUnlocked('POTION')) return false;
  if (potions <= 0) return false;
  if (playerHP >= CONFIG.PLAYER_MAX_HP) return false;
  potions--;
  playerHP = min(CONFIG.PLAYER_MAX_HP, playerHP + CONFIG.POTION_HEAL);
  return true;
}

function actionCost(id) {
  if (id === 'PUNCH')  return CONFIG.PUNCH_COST;
  if (id === 'SWORD')  return CONFIG.SWORD_COST;
  if (id === 'BOW')    return CONFIG.BOW_COST;
  return 0;
}
function canAfford(id) {
  if (!isUnlocked(id)) return false;
  if (id === 'POTION') return potions > 0 && playerHP < CONFIG.PLAYER_MAX_HP;
  return energy >= actionCost(id);
}

// ---------------- MENU ----------------
function openMenu() {
  menuMode = 'actions';
  cursor = lastUsed;
  heldMoveFrames = 0; heldMoveDir = '';
}
function closeMenu() { menuMode = 'closed'; }

function moveCursor(dx, dy) {
  let cur = ACTIONS[cursor];
  let ncol = constrain(cur.col + dx, 0, 1);
  let nrow = constrain(cur.row + dy, 0, 1);
  let next = ACTIONS.findIndex(a => a.col === ncol && a.row === nrow);
  if (next >= 0) cursor = next;
}

function menuConfirm() {
  let id = ACTIONS[cursor].id;
  if (!canAfford(id)) return;
  let ok = false;
  if (id === 'PUNCH')  ok = doPunch();
  if (id === 'SWORD')  ok = doSword();
  if (id === 'BOW')    ok = doBow();
  if (id === 'POTION') ok = doPotion();
  if (ok) {
    lastUsed = cursor;
    closeMenu();
    pendingEnemyTurn = CONFIG.ENEMY_TURN_DELAY_FRAMES;
  }
}

// ---------------- ENEMY TURNS ----------------
function getEnemyAttackTiles(e) {
  let f = facingToward(e.x, e.y, player.x, player.y);
  if (e.weapon === 'fist')  return [{ x: e.x + f.dx, y: e.y + f.dy }];
  if (e.weapon === 'sword') return getSwordTiles(e.x, e.y, f.dx, f.dy);
  if (e.weapon === 'bow')   return getBowTiles(e.x, e.y, f.dx, f.dy, true);
  return [];
}
function enemyCanHitPlayer(e) {
  return getEnemyAttackTiles(e).some(t => t.x === player.x && t.y === player.y);
}
function enemyDamage(w) { return w === 'bow' ? 0.5 : 1; }
function enemyAttack(e) {
  let tiles = getEnemyAttackTiles(e);
  flashTiles(tiles, [255, 80, 80]);
  if (tiles.some(t => t.x === player.x && t.y === player.y)) {
    playerHP -= enemyDamage(e.weapon);
    hitFlash = 10; shakeTimer = 6;
  }
}
function runEnemyTurns() {
  turnCount++;
  if (turnCount % CONFIG.RESPAWN_INTERVAL === 0 &&
      enemies.length < CONFIG.MAX_ENEMIES) respawnEnemy();

  for (let e of enemies) {
    let d = manhattan(e.x, e.y, player.x, player.y);
    if (d < 12) e.state = 'chase';
    if (d > 16) { e.state = 'idle'; e.attackReady = false; }

    if (e.state === 'chase') {
      if (enemyCanHitPlayer(e)) {
        if (e.attackReady) { enemyAttack(e); e.attackReady = false; }
        else e.attackReady = true;
      } else {
        e.attackReady = false;
        let path = findPath(e.x, e.y, player.x, player.y, e);
        if (path.length > 0) {
          let n = path[0];
          if (!(n.x === player.x && n.y === player.y) &&
              !tileOccupied(n.x, n.y, e)) {
            e.x = n.x; e.y = n.y;
          }
        }
      }
    } else {
      e.attackReady = false;
      if (random() < 0.3) {
        let [dx, dy] = random([[0, -1], [0, 1], [-1, 0], [1, 0]]);
        let wx = e.x + dx, wy = e.y + dy;
        if (grid[wx]?.[wy] === 0 && !tileOccupied(wx, wy, e)) {
          e.x = wx; e.y = wy;
        }
      }
    }
  }
}

// ---------------- MOVEMENT ----------------
function tryMove(dx, dy) {
  lastDir = { dx, dy };
  let nx = player.x + dx, ny = player.y + dy;

  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if (grid[nx][ny] === 1) return;
  if (enemies.some(e => e.x === nx && e.y === ny)) return;

  player.x = nx; player.y = ny;
  gainEnergy();
  afterPlayerMove();
}
function gainEnergy() { energy = min(CONFIG.PLAYER_MAX_ENERGY, energy + 1); }
function afterPlayerMove() {
  revealAround(player.x, player.y, REVEAL_R);
  if (player.x === stairs.x && player.y === stairs.y) { nextFloor(); return; }
  runEnemyTurns();
}

// ---------------- HELD MOVEMENT ----------------
function arrowKeyDir() {
  if (keyCode === UP_ARROW    || key === 'w' || key === 'W') return { dx: 0, dy: -1 };
  if (keyCode === DOWN_ARROW  || key === 's' || key === 'S') return { dx: 0, dy:  1 };
  if (keyCode === LEFT_ARROW  || key === 'a' || key === 'A') return { dx: -1, dy: 0 };
  if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') return { dx:  1, dy: 0 };
  return null;
}
function getHeldDirection() {
  if (keyIsDown(UP_ARROW)    || keyIsDown(87)) return { dx: 0, dy: -1 };
  if (keyIsDown(DOWN_ARROW)  || keyIsDown(83)) return { dx: 0, dy:  1 };
  if (keyIsDown(LEFT_ARROW)  || keyIsDown(65)) return { dx: -1, dy: 0 };
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) return { dx:  1, dy: 0 };
  return null;
}
function handleHeldMovement() {
  if (playerHP <= 0 || menuMode !== 'closed' || pendingEnemyTurn > 0) return;
  let dir = getHeldDirection();
  if (!dir) { heldMoveFrames = 0; heldMoveDir = ''; return; }
  let sig = dir.dx + ',' + dir.dy;
  if (sig !== heldMoveDir) { heldMoveDir = sig; heldMoveFrames = 1; return; }
  heldMoveFrames++;
  if (heldMoveFrames > CONFIG.MOVE_HOLD_DELAY &&
      (heldMoveFrames - CONFIG.MOVE_HOLD_DELAY) % CONFIG.MOVE_HOLD_INTERVAL === 0) {
    tryMove(dir.dx, dir.dy);
  }
}

// ---------------- INPUT ----------------
function isConfirmKey() { return key === 'z' || key === 'Z' || keyCode === ENTER; }
function isCancelKey()  { return key === 'x' || key === 'X' || keyCode === BACKSPACE || keyCode === ESCAPE; }

function keyPressed() {
  if (playerHP <= 0) { if (key === 'r' || key === 'R') restartGame(); return; }
  if (pendingEnemyTurn > 0) return;

  if (menuMode === 'actions') {
    if (isConfirmKey()) { menuConfirm(); return; }
    if (isCancelKey())  { closeMenu();   return; }
    let dir = arrowKeyDir();
    if (dir) moveCursor(dir.dx, dir.dy);
    return;
  }

  if (isConfirmKey()) { openMenu(); return; }

  let dir = arrowKeyDir();
  if (!dir) return;
  heldMoveDir = dir.dx + ',' + dir.dy;
  heldMoveFrames = 1;
  tryMove(dir.dx, dir.dy);
}
function keyReleased() {
  if (!getHeldDirection()) { heldMoveFrames = 0; heldMoveDir = ''; }
}
function restartGame() {
  playerHP = CONFIG.PLAYER_MAX_HP;
  energy = CONFIG.PLAYER_MAX_ENERGY;
  score = 0; depth = 1;
  charLevel = 1; xp = 0;
  lastUsed = 0;
  lastDir = { dx: 1, dy: 0 };
  hitFlash = 0; shakeTimer = 0;
  activeAnimations = [];
  initLevel();
  loop();
}

// ---------------- DRAW ----------------
function draw() {
  background(6, 8, 12);

  if (pendingEnemyTurn > 0) {
    pendingEnemyTurn--;
    if (pendingEnemyTurn === 0 && playerHP > 0) runEnemyTurns();
  }
  if (messageTTL > 0) messageTTL--;

  // Game view
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(VIEW_X, VIEW_Y, VIEW_SIZE, VIEW_SIZE);
  drawingContext.clip();

  push();
  if (shakeTimer > 0) { shakeTimer--; translate(random(-4, 4), random(-4, 4)); }
  translate(VIEW_X + VIEW_HALF * TILE - player.x * TILE,
            VIEW_Y + VIEW_HALF * TILE - player.y * TILE);

  drawMap();
  drawEnemyRanges();    // NEW: enemy attack range overlays (under enemies)
  drawEnemies();
  drawFlashes();
  drawWeaponRangePreview(); // NEW: selected weapon range when menu open
  drawAnimations();     // NEW: attack animations
  drawFacingGlow();
  drawPlayer();

  pop();
  drawingContext.restore();

  if (hitFlash > 0) {
    hitFlash--;
    fill(255, 0, 0, map(hitFlash, 0, 12, 0, 110));
    noStroke();
    rect(VIEW_X, VIEW_Y, VIEW_SIZE, VIEW_SIZE);
  }
  noFill(); stroke(60); rect(VIEW_X, VIEW_Y, VIEW_SIZE, VIEW_SIZE); noStroke();

  drawLeftPanel();
  drawMinimap();
  drawStatusPanel();
  drawActionsPanel();
  drawBottomHud();

  handleHeldMovement();

  if (playerHP <= 0) drawGameOver();
}

// ============================================================
// NEW: WEAPON RANGE PREVIEW (shown when action menu is open)
// ============================================================
function drawWeaponRangePreview() {
  if (menuMode !== 'actions') return;
  let a = ACTIONS[cursor];
  if (!a || !isUnlocked(a.id)) return;

  let tiles = [];
  let rgb;

  if (a.id === 'PUNCH') {
    tiles = [{ x: player.x + lastDir.dx, y: player.y + lastDir.dy }];
    rgb = [255, 180, 60];
  } else if (a.id === 'SWORD') {
    tiles = getSwordTiles(player.x, player.y, lastDir.dx, lastDir.dy);
    rgb = [255, 235, 70];
  } else if (a.id === 'BOW') {
    tiles = getBowTiles(player.x, player.y, lastDir.dx, lastDir.dy, false);
    rgb = [200, 100, 255];
  } else if (a.id === 'POTION') {
    // Show heal range (self only)
    tiles = [{ x: player.x, y: player.y }];
    rgb = [60, 220, 100];
  }

  // Pulsing alpha
  let pulse = 70 + 40 * sin(frameCount * 0.18);

  for (let t of tiles) {
    if (t.x < 0 || t.x >= COLS || t.y < 0 || t.y >= ROWS) continue;
    if (!visited[t.x][t.y]) continue;

    // Fill overlay
    fill(rgb[0], rgb[1], rgb[2], pulse);
    noStroke();
    rect(t.x * TILE, t.y * TILE, TILE, TILE);

    // Bright border
    noFill();
    stroke(rgb[0], rgb[1], rgb[2], 200);
    strokeWeight(2);
    rect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
    strokeWeight(1);
  }
  noStroke();

  // Draw a small range label on the outermost tile for bow
  if (a.id === 'BOW' && tiles.length > 0) {
    let last = tiles[tiles.length - 1];
    fill(220, 160, 255, 220);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(tiles.length, last.x * TILE + TILE / 2, last.y * TILE + TILE / 2);
  }
}

// ============================================================
// NEW: ENEMY ATTACK RANGE OVERLAYS
// ============================================================
function drawEnemyRanges() {
  for (let e of enemies) {
    if (!inSight(e.x, e.y)) continue;
    if (e.state !== 'chase') continue; // only show ranges for chasing enemies

    let tiles = getEnemyAttackTiles(e);
    let wRgb = weaponRGB(e.weapon);

    // Dim base overlay for all tiles in range
    let baseAlpha = e.attackReady ? 75 : 30;
    fill(wRgb[0], wRgb[1], wRgb[2], baseAlpha);
    noStroke();
    for (let t of tiles) {
      if (t.x < 0 || t.x >= COLS || t.y < 0 || t.y >= ROWS) continue;
      rect(t.x * TILE, t.y * TILE, TILE, TILE);
    }

    // If attackReady — bright warning border + pulsing
    if (e.attackReady) {
      let pulse = 120 + 80 * sin(frameCount * 0.3);
      noFill();
      stroke(255, 50, 50, pulse);
      strokeWeight(2);
      for (let t of tiles) {
        if (t.x < 0 || t.x >= COLS || t.y < 0 || t.y >= ROWS) continue;
        rect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
      }

      // Extra "danger!" highlight on player tile if it's in range
      let playerInRange = tiles.some(t => t.x === player.x && t.y === player.y);
      if (playerInRange) {
        noStroke();
        fill(255, 30, 30, 80 + 40 * sin(frameCount * 0.5));
        rect(player.x * TILE, player.y * TILE, TILE, TILE);
      }
      strokeWeight(1);
    }
  }
  noStroke();
}

// --- Game view drawers ---
function drawMap() {
  let minX = max(0, player.x - VIEW_HALF - 1);
  let maxX = min(COLS - 1, player.x + VIEW_HALF + 1);
  let minY = max(0, player.y - VIEW_HALF - 1);
  let maxY = min(ROWS - 1, player.y + VIEW_HALF + 1);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (!visited[x][y]) continue;
      let seed = x * 73 + y * 31;
      if (grid[x][y] === 1) {
        drawSprite('wall', x * TILE, y * TILE, seed, () => {
          fill(40, 40, 50); noStroke(); rect(x * TILE, y * TILE, TILE, TILE);
        });
      } else if (grid[x][y] === 2) {
        drawSprite('stairs', x * TILE, y * TILE, seed, () => {
          fill(255, 210, 40); noStroke(); rect(x * TILE, y * TILE, TILE, TILE);
        });
      } else {
        drawSprite('floor', x * TILE, y * TILE, seed, () => {
          fill(100, 90, 80); noStroke(); rect(x * TILE, y * TILE, TILE, TILE);
        });
      }
      if (!inSight(x, y)) {
        fill(0, 0, 0, 110); noStroke();
        rect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}
function drawEnemies() {
  for (let e of enemies) {
    if (!inSight(e.x, e.y)) continue;
    let spriteKey = 'enemyFist';
    if (e.weapon === 'sword') spriteKey = 'enemySword';
    if (e.weapon === 'bow')   spriteKey = 'enemyBow';
    let base = weaponRGB(e.weapon);
    let c = e.attackReady ? base
      : [floor(base[0] * 0.5), floor(base[1] * 0.5), floor(base[2] * 0.5)];
    drawSprite(spriteKey, e.x * TILE, e.y * TILE, e.x * 17 + e.y * 13, () => {
      fill(c[0], c[1], c[2]); noStroke();
      rect(e.x * TILE, e.y * TILE, TILE, TILE);
      fill(0); textAlign(CENTER, CENTER); textSize(8);
      text(weaponLabel(e.weapon), e.x * TILE + TILE / 2, e.y * TILE + TILE / 2);
    });

    // NEW: HP pip dots above enemy
    let hp = e.hp;
    let maxHp = CONFIG.ENEMY_HP;
    let pipW = 6, pipH = 4, pipGap = 2;
    let totalW = maxHp * (pipW + pipGap) - pipGap;
    let startX = e.x * TILE + TILE / 2 - totalW / 2;
    let pipY = e.y * TILE + 2;
    for (let p = 0; p < maxHp; p++) {
      fill(p < hp ? color(80, 220, 80) : color(40, 40, 40));
      noStroke();
      rect(startX + p * (pipW + pipGap), pipY, pipW, pipH, 1);
    }

    // NEW: Small facing indicator on enemy (dot showing direction toward player)
    if (e.state === 'chase') {
      let f = facingToward(e.x, e.y, player.x, player.y);
      let ecx = e.x * TILE + TILE / 2;
      let ecy = e.y * TILE + TILE / 2;
      let dotX = ecx + f.dx * TILE * 0.35;
      let dotY = ecy + f.dy * TILE * 0.35;
      fill(255, 60, 60, e.attackReady ? 255 : 150);
      noStroke();
      circle(dotX, dotY, e.attackReady ? 8 : 5);
    }
  }
}
function weaponRGB(t) {
  if (t === 'sword') return [230, 210, 55];
  if (t === 'bow')   return [185, 85, 240];
  return [220, 220, 220];
}
function weaponLabel(t) {
  if (t === 'sword') return 'SW';
  if (t === 'bow')   return 'BW';
  return 'FI';
}
function drawFlashes() {
  for (let i = attackFlash.length - 1; i >= 0; i--) {
    let f = attackFlash[i];
    f.ttl--;
    if (f.ttl <= 0) { attackFlash.splice(i, 1); continue; }
    fill(f.r, f.g, f.b, map(f.ttl, 0, FLASH_TTL, 0, 180));
    noStroke();
    rect(f.x * TILE, f.y * TILE, TILE, TILE);
  }
}
function drawFacingGlow() {
  let fx = player.x + lastDir.dx;
  let fy = player.y + lastDir.dy;
  if (fx < 0 || fx >= COLS || fy < 0 || fy >= ROWS) return;
  fill(255, 255, 180, 40); noStroke();
  rect(fx * TILE, fy * TILE, TILE, TILE);
}
function drawPlayer() {
  drawSprite('player', player.x * TILE, player.y * TILE, 0, () => {
    fill(0, 255, 100); noStroke();
    rect(player.x * TILE, player.y * TILE, TILE, TILE);
  });

  // NEW: Facing direction dot on the player model
  let cx = player.x * TILE + TILE / 2;
  let cy = player.y * TILE + TILE / 2;
  let dotX = cx + lastDir.dx * TILE * 0.28;
  let dotY = cy + lastDir.dy * TILE * 0.28;

  // Outer glow
  noStroke();
  fill(255, 255, 100, 80);
  circle(dotX, dotY, 12);
  // Inner bright dot
  fill(255, 255, 60);
  circle(dotX, dotY, 7);
  // Tiny white center
  fill(255, 255, 255);
  circle(dotX, dotY, 3);
}

// --- Panels ---
function panelBox(x, y, w, h, label, active) {
  fill(180); noStroke(); textAlign(LEFT, TOP); textSize(10);
  if (label) text(label, x, y - 12);
  fill(12, 14, 20); stroke(active ? 220 : 70);
  strokeWeight(active ? 2 : 1);
  rect(x, y, w, h);
  strokeWeight(1); noStroke();
}

function drawLeftPanel() {
  panelBox(LEFT_X, LEFT_Y, LEFT_W, VIEW_SIZE, null, false);
  let cx = LEFT_X + LEFT_W / 2;

  let portraitY = LEFT_Y + 8;
  drawSprite('portrait', LEFT_X + 8, portraitY, 0, () => {
    fill(25, 30, 40); stroke(80); rect(LEFT_X + 8, portraitY, LEFT_W - 16, LEFT_W - 16);
    noStroke();
    fill(120); textAlign(CENTER, CENTER); textSize(9);
    text('HERO', cx, portraitY + (LEFT_W - 16) / 2);
  }, LEFT_W - 16);

  let lvY = portraitY + (LEFT_W - 16) + 8;
  fill(220); textAlign(CENTER, TOP); textSize(10);
  text('LEVEL', cx, lvY);
  fill(255, 230, 100); textSize(24); textStyle(BOLD);
  text(charLevel, cx, lvY + 12);
  textStyle(NORMAL);

  let xpY = lvY + 48;
  fill(180); textAlign(LEFT, TOP); textSize(9);
  text('XP', LEFT_X + 8, xpY);
  let need = xpForNextLevel(charLevel);
  let bx = LEFT_X + 8, bw = LEFT_W - 16, bh = 6;
  fill(30); noStroke(); rect(bx, xpY + 12, bw, bh);
  fill(180, 140, 240); rect(bx, xpY + 12, bw * (xp / need), bh);
  noFill(); stroke(90); rect(bx, xpY + 12, bw, bh); noStroke();
  fill(200); textAlign(CENTER, TOP); textSize(9);
  text(xp + ' / ' + need, cx, xpY + 22);

  let floorY = LEFT_Y + VIEW_SIZE - 40;
  fill(180); textAlign(CENTER, TOP); textSize(9);
  text('FLOOR', cx, floorY);
  fill(255); textSize(18);
  text(depth, cx, floorY + 12);
}

function drawMinimap() {
  panelBox(MM_X, MM_Y, MM_SIZE, MM_SIZE, 'MAP', false);
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!visited[x][y])        fill(20);
      else if (grid[x][y] === 1) fill(55);
      else if (grid[x][y] === 2) fill(255, 210, 40);
      else                       fill(120, 100, 90);
      noStroke();
      rect(MM_X + x * MM_TILE, MM_Y + y * MM_TILE, MM_TILE, MM_TILE);
    }
  }
  for (let e of enemies) {
    if (!inSight(e.x, e.y)) continue;
    fill(255, 60, 60);
    rect(MM_X + e.x * MM_TILE, MM_Y + e.y * MM_TILE, MM_TILE, MM_TILE);
  }
  fill(0, 255, 100);
  rect(MM_X + player.x * MM_TILE, MM_Y + player.y * MM_TILE, MM_TILE, MM_TILE);
}

function drawStatusPanel() {
  panelBox(MM_X, STATUS_Y, SIDEBAR_W, STATUS_H, 'STATUS', false);
  let x = MM_X + 10, y = STATUS_Y + 10;
  drawBar(x, y,      'HP', playerHP, CONFIG.PLAYER_MAX_HP,     [60, 220, 100]);
  drawBar(x, y + 20, 'EN', energy,   CONFIG.PLAYER_MAX_ENERGY, [90, 200, 255]);
  fill(200); textAlign(LEFT, TOP); textSize(11);
  text('POTIONS ' + potions, x,       y + 44);
  text('SCORE ' + score,     x + 100, y + 44);
}
function drawBar(x, y, label, val, max, rgb) {
  fill(200); textAlign(LEFT, TOP); textSize(11);
  text(label, x, y);
  let bx = x + 25, bw = SIDEBAR_W - 70, bh = 9;
  fill(30); noStroke(); rect(bx, y, bw, bh);
  fill(rgb[0], rgb[1], rgb[2]); rect(bx, y, bw * (val / max), bh);
  noFill(); stroke(90); rect(bx, y, bw, bh); noStroke();
  fill(220); textSize(10);
  text(formatHP(val) + '/' + max, bx + bw + 6, y);
}

function drawActionsPanel() {
  let active = menuMode === 'actions';
  panelBox(MM_X, ACTIONS_Y, SIDEBAR_W, ACTIONS_H, active ? 'ACTIONS ▸ SELECT' : 'ACTIONS', active);

  const SLOT = 70;
  const GAP = 10;
  const gridW = SLOT * 2 + GAP;
  const gridH = SLOT * 2 + GAP;
  const gx = MM_X + (SIDEBAR_W - gridW) / 2;
  const gy = ACTIONS_Y + 20;

  for (let i = 0; i < ACTIONS.length; i++) {
    let a = ACTIONS[i];
    let sx = gx + a.col * (SLOT + GAP);
    let sy = gy + a.row * (SLOT + GAP);
    drawActionSlot(i, sx, sy, SLOT);
  }

  fill(130); textAlign(CENTER, BOTTOM); textSize(9);
  let hint = active ? 'ARROWS • Z use • X back'
                    : 'Z to open • last used highlighted';
  text(hint, MM_X + SIDEBAR_W / 2, ACTIONS_Y + ACTIONS_H - 4);
}

function drawActionSlot(idx, x, y, size) {
  let a = ACTIONS[idx];
  let unlocked = isUnlocked(a.id);
  let affordable = canAfford(a.id);
  let isCursor = (menuMode === 'actions') && cursor === idx;
  let isLast = lastUsed === idx;

  if (isCursor)        { fill(50, 80, 130); stroke(240, 220, 140); strokeWeight(2); }
  else if (isLast)     { fill(30, 30, 20);  stroke(180, 150, 60);  strokeWeight(1); }
  else if (!unlocked)  { fill(15, 15, 18);  stroke(50);             strokeWeight(1); }
  else                 { fill(22, 26, 34);  stroke(80);             strokeWeight(1); }
  rect(x, y, size, size, 4);
  strokeWeight(1); noStroke();

  let iconKey = null;
  if (a.id === 'PUNCH')  iconKey = 'iconPunch';
  if (a.id === 'SWORD')  iconKey = 'iconSword';
  if (a.id === 'BOW')    iconKey = 'iconBow';
  if (a.id === 'POTION') iconKey = 'iconPotion';

  let iconSize = size - 24;
  let ix = x + (size - iconSize) / 2;
  let iy = y + 6;

  push();
  if (!unlocked) drawingContext.globalAlpha = 0.3;
  drawSprite(iconKey, ix, iy, 0, () => drawActionIconFallback(a.id, ix, iy, iconSize), iconSize);
  pop();

  fill(unlocked ? (affordable ? 255 : 110) : 80);
  textAlign(CENTER, TOP); textSize(10);
  text(a.id, x + size / 2, y + size - 20);

  textSize(9);
  if (!unlocked) {
    fill(200, 80, 80);
    text('LOCKED L' + unlockLevelFor(a.id), x + size / 2, y + size - 10);
  } else if (a.id === 'POTION') {
    fill(affordable ? color(140, 220, 140) : color(90));
    text(potions + ' LEFT', x + size / 2, y + size - 10);
  } else {
    fill(affordable ? color(150, 200, 255) : color(100));
    text(actionCost(a.id) + ' ENERGY', x + size / 2, y + size - 10);
  }
}

function drawActionIconFallback(id, x, y, s) {
  push();
  translate(x + s / 2, y + s / 2);
  noStroke();
  if (id === 'PUNCH') {
    fill(230, 210, 170);
    rect(-s/3, -s/3, s*0.22, s*0.5, 3);
    rect(-s/10, -s/3, s*0.22, s*0.55, 3);
    rect(s/6, -s/3, s*0.22, s*0.5, 3);
  } else if (id === 'SWORD') {
    stroke(200); strokeWeight(2); fill(240, 240, 210);
    push(); rotate(-PI/4);
    rect(-2, -s/2 + 4, 4, s - 10);
    fill(120, 80, 40); rect(-s/8, s/2 - 8, s/4, 4);
    rect(-3, s/2 - 5, 6, 8);
    pop();
  } else if (id === 'BOW') {
    noFill(); stroke(180, 120, 60); strokeWeight(2);
    arc(-s/6, 0, s*0.7, s*0.9, -PI/2 - 0.7, PI/2 + 0.7);
    stroke(200); strokeWeight(1);
    line(-s/3, 0, s/3, 0);
    fill(200); noStroke();
    triangle(s/3, 0, s/3 - 5, -3, s/3 - 5, 3);
  } else if (id === 'POTION') {
    fill(120, 80, 40); rect(-s/10, -s/3, s/5, s/7);
    fill(180, 60, 180); stroke(230, 160, 230); strokeWeight(1);
    beginShape();
    vertex(-s/6, -s/6); vertex(s/6, -s/6);
    vertex(s/3, s/6);  vertex(s/3, s/3);
    vertex(-s/3, s/3); vertex(-s/3, s/6);
    endShape(CLOSE);
    fill(230, 160, 230); noStroke();
    ellipse(-s/8, 0, s/8, s/12);
  }
  pop();
}

function drawBottomHud() {
  panelBox(VIEW_X, HUD_Y, VIEW_SIZE, HUD_H, null, false);

  if (messageTTL > 0) {
    let a = messageTTL > 60 ? 255 : map(messageTTL, 0, 60, 0, 255);
    fill(255, 230, 120, a); textAlign(CENTER, CENTER); textSize(14);
    text(message, VIEW_X + VIEW_SIZE / 2, HUD_Y + HUD_H / 2);
  } else {
    fill(150); textAlign(LEFT, CENTER); textSize(11);
    let hint = (menuMode === 'actions')
      ? 'ARROWS pick   •   Z use   •   X back'
      : 'ARROWS move/face   •   Z open actions   •   bump enemies to face them';
    text(hint, VIEW_X + 10, HUD_Y + HUD_H / 2);
  }
}

function formatHP(v) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

// ---------------- GAME OVER ----------------
function drawGameOver() {
  if (score > highScore) highScore = score;
  fill(0, 0, 0, 220); noStroke();
  rect(0, 0, width, height);
  fill(255, 50, 50); textAlign(CENTER, CENTER); textSize(40);
  text('GAME OVER', width / 2, height / 2 - 80);
  fill(255); textSize(20);
  text('Hero Level: ' + charLevel, width / 2, height / 2 - 30);
  text('Floor: ' + depth,          width / 2, height / 2);
  text('Score: ' + score,          width / 2, height / 2 + 30);
  text('Best: '  + highScore,      width / 2, height / 2 + 60);
  fill(180); textSize(14);
  text('Press R to play again', width / 2, height / 2 + 110);
  noLoop();
}

// ---------------- A* ----------------
function findPath(sx, sy, gx, gy, skip = null) {
  let open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
  let closed = new Set();
  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    let cur = open.shift();
    if (cur.x === gx && cur.y === gy) {
      let path = []; let n = cur;
      while (n.parent) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
      return path;
    }
    closed.add(cur.x + ',' + cur.y);
    for (let [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      let nx = cur.x + dx, ny = cur.y + dy;
      let nk = nx + ',' + ny;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (grid[nx][ny] === 1) continue;
      if (closed.has(nk)) continue;
      if (!(nx === gx && ny === gy) && tileOccupied(nx, ny, skip)) continue;
      let g = cur.g + 1;
      let h = manhattan(nx, ny, gx, gy);
      let found = open.find(n => n.x === nx && n.y === ny);
      if (!found) open.push({ x: nx, y: ny, g, f: g + h, parent: cur });
      else if (g < found.g) { found.g = g; found.f = g + h; found.parent = cur; }
    }
  }
  return [];
}