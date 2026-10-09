(function (root) {
  'use strict';
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
  };
  const emptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(null));
  const SHOP = Object.freeze({ long: { name: 'I-piece ticket', price: 20 }, clear: { name: 'Clear 3 rows', price: 30 }, revive: { name: 'Second chance', price: 50 } });
  const COIN_REWARDS = [0,10,25,45,80];
  const safeCount = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000000) : 0;
  class Game {
    constructor(random = Math.random, profile = null) {
      this.random = random;
      this.coins = profile == null ? 100 : safeCount(profile.coins);
      this.inventory = Object.fromEntries(Object.keys(SHOP).map(id => [id, safeCount(profile?.inventory?.[id])]));
      this.reset();
    }
    reset() {
      Object.assign(this, { board: emptyBoard(), queue: [], active: null, held: null,
        usedHold: false, score: 0, lines: 0, level: 1, state: 'ready', elapsed: 0,
        fallTime: 0, lockTime: 0, lockResets: 0, lastClear: 0, placements: 0,
        coinsEarned: 0, lastCoinReward: 0, reviveUsed: false });
    }
    exportProfile() { return { coins: this.coins, inventory: { ...this.inventory } }; }
    buy(id) {
      if (!Object.hasOwn(SHOP, id) || this.coins < SHOP[id].price || this.inventory[id] >= 1000000000) return false;
      this.coins -= SHOP[id].price; this.inventory[id]++; return true;
    }
    cheatUnavailable(id) {
      if (!Object.hasOwn(SHOP, id)) return 'Unknown item';
      if (id === 'revive') {
        if (this.reviveUsed) return 'Already revived';
        if (this.state !== 'over') return 'After game over';
      } else {
        if (!['playing','paused'].includes(this.state)) return 'Start a game first';
        if (id === 'long' && this.queue[0] === 'I') return 'I-piece is next';
        if (id === 'clear' && !this.board.slice(17).flat().some(Boolean)) return 'Nothing to clear';
      }
      if (!this.inventory[id]) return 'Buy one first';
      return '';
    }
    useCheat(id) {
      if (this.cheatUnavailable(id)) return false;
      if (id === 'long') this.queue[0] = 'I';
      if (id === 'clear') {
        this.board = [...emptyBoard().slice(0,3), ...this.board.slice(0,17)];
        this.spawn(this.active.type);
      }
      if (id === 'revive') {
        this.board = [...emptyBoard().slice(0,8), ...this.board.slice(8)];
        this.state = 'paused'; this.reviveUsed = true; this.usedHold = false;
        this.spawn(this.active.type);
      }
      this.inventory[id]--; return true;
    }
    get interval() { return Math.max(75, 850 * Math.pow(0.8, this.level - 1)); }
    fillQueue() {
      while (this.queue.length < 7) {
        const bag = Object.keys(SHAPES);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        this.queue.push(...bag);
      }
    }
    start() { this.reset(); this.state = 'playing'; this.spawn(); }
    spawn(type) {
      this.fillQueue();
      type = type || this.queue.shift();
      this.fillQueue();
      const matrix = SHAPES[type].map(row => [...row]);
      this.active = { type, matrix, x: Math.floor((10 - matrix.length) / 2), y: 0, rotation: 0 };
      this.fallTime = 0; this.lockTime = 0; this.lockResets = 0;
      if (this.collides(matrix, this.active.x, this.active.y)) this.state = 'over';
    }
    collides(matrix, x, y) {
      return matrix.some((row, dy) => row.some((cell, dx) => cell &&
        (x + dx < 0 || x + dx >= 10 || y + dy >= 20 || (y + dy >= 0 && this.board[y + dy][x + dx]))));
    }
    grounded() { return this.collides(this.active.matrix, this.active.x, this.active.y + 1); }
    resetLock(wasGrounded) {
      if (wasGrounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
    }
    move(dx) {
      if (this.state !== 'playing') return false;
      const a = this.active;
      if (this.collides(a.matrix, a.x + dx, a.y)) return false;
      const grounded = this.grounded(); a.x += dx; this.resetLock(grounded); return true;
    }
    rotate(direction = 1) {
      if (this.state !== 'playing') return false;
      const a = this.active;
      if (a.type === 'O') return true;
      const n = a.matrix.length;
      const matrix = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) =>
        direction > 0 ? a.matrix[n - 1 - x][y] : a.matrix[x][n - 1 - y]));
      // Try small wall and floor adjustments before rejecting a rotation.
      for (const [dx, dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]) {
        if (!this.collides(matrix, a.x + dx, a.y + dy)) {
          const grounded = this.grounded();
          a.matrix = matrix; a.x += dx; a.y += dy;
          a.rotation = (a.rotation + direction + 4) % 4;
          this.resetLock(grounded); return true;
        }
      }
      return false;
    }
    softDrop() {
      if (this.state !== 'playing' || this.grounded()) return false;
      this.active.y++; this.score++; this.fallTime = 0; this.lockTime = 0; return true;
    }
    ghostY() {
      if (!this.active) return 0;
      let y = this.active.y;
      while (!this.collides(this.active.matrix, this.active.x, y + 1)) y++;
      return y;
    }
    hardDrop() {
      if (this.state !== 'playing') return false;
      const y = this.ghostY(); this.score += (y - this.active.y) * 2;
      this.active.y = y; this.lock(); return true;
    }
    hold() {
      if (this.state !== 'playing' || this.usedHold) return false;
      const old = this.held; this.held = this.active.type;
      this.spawn(old); this.usedHold = true; return true;
    }
    lock() {
      if (this.state !== 'playing') return;
      const a = this.active;
      const cells = [];
      a.matrix.forEach((row, dy) => row.forEach((cell, dx) => { if (cell) cells.push([a.x + dx, a.y + dy]); }));
      if (cells.some(([, y]) => y < 0)) { this.state = 'over'; return; }
      for (const [x, y] of cells) this.board[y][x] = a.type;
      const remaining = this.board.filter(row => !row.every(Boolean));
      const cleared = 20 - remaining.length;
      this.lastClear = cleared; this.placements++;
      this.score += [0,100,300,500,800][cleared] * this.level;
      this.lastCoinReward = COIN_REWARDS[cleared];
      this.coins = Math.min(1000000000, this.coins + this.lastCoinReward);
      this.coinsEarned += this.lastCoinReward;
      this.lines += cleared; this.level = 1 + Math.floor(this.lines / 10);
      this.board = [...Array.from({ length: cleared }, () => Array(10).fill(null)), ...remaining];
      this.usedHold = false; this.spawn();
    }
    pause() {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
    }
    tick(ms) {
      if (this.state !== 'playing') return;
      this.elapsed += ms;
      if (this.grounded()) {
        this.lockTime += ms;
        if (this.lockTime >= 500) this.lock();
        return;
      }
      this.lockTime = 0; this.fallTime += ms;
      while (this.fallTime >= this.interval && !this.grounded()) {
        this.active.y++; this.fallTime -= this.interval;
      }
    }
  }
  const api = { Game, SHAPES, emptyBoard, SHOP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TetrisEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
