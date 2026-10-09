(() => {
  'use strict';
  const { Game, SHAPES, SHOP } = window.TetrisEngine;
  const PROFILE_KEY = 'blocks-space-wallet-v1';
  let profile = null, storageAvailable = true;
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved !== null) {
      try { profile = JSON.parse(saved); } catch (_) { profile = {}; }
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) profile = {};
    }
  } catch (_) { storageAvailable = false; }
  const game = new Game(Math.random, profile);
  const $ = id => document.getElementById(id);
  const canvas = $('board');
  const ctx = canvas.getContext('2d');
  const COLORS = { I:'#83d5d6', O:'#e9c777', T:'#b69cdb', S:'#a6d49c', Z:'#df8f91', J:'#83a9d5', L:'#e4af7d' };
  let best = 0, sound = false, audio = null, lastState = '', lastPlacement = 0;
  let previewKey = '', lastTime = performance.now(), toastTimer, resumeAfterDialog = false;
  const heldKeys = new Map();
  let savedProfile = '', shopKey = '', resumeAfterShop = false;
  try { best = Math.max(0, Number(localStorage.getItem('blocks-space-best')) || 0); } catch (_) {}
  $('best').textContent = best.toLocaleString();
  const shopDetails = {
    long: { icon:'▰', text:'Make the next piece an I-piece. Your current piece stays the same.', success:'An I-piece is up next. Make it count!' },
    clear: { icon:'≋', text:'Remove the bottom 3 rows and return your piece to the top. No extra points or coins.', success:'Bottom 3 rows cleared. Your piece is back at the top.' },
    revive: { icon:'↻', text:'After game over, clear the top 8 rows and keep your score. Once per game.', success:'You are back! Return to the game and press Resume when you are ready.' },
  };
  $('shop-items').innerHTML = Object.entries(SHOP).map(([id,item]) => `<article class="shop-item"><span class="item-icon item-${id}" aria-hidden="true">${shopDetails[id].icon}</span><div class="item-info"><h3>${item.name}<span id="owned-${id}">Owned: 0</span></h3><p>${shopDetails[id].text}</p><div class="item-actions"><button id="buy-${id}" class="buy-button" aria-label="Buy ${item.name}">${item.price} coins · Buy</button><button id="use-${id}" class="use-button" aria-label="Use ${item.name}">Use once</button></div></div></article>`).join('');

  function updateEconomy() {
    const encoded = JSON.stringify(game.exportProfile());
    if (encoded !== savedProfile) {
      savedProfile = encoded;
      try { localStorage.setItem(PROFILE_KEY, encoded); }
      catch (_) { storageAvailable = false; }
      $('coins').textContent = game.coins.toLocaleString();
      $('shop-coins').textContent = game.coins.toLocaleString();
      $('wallet').setAttribute('aria-label', `Open coin shop, balance ${game.coins} coins`);
      $('save-status').textContent = storageAvailable ? 'Coins and unused items are saved automatically, even when you restart.' : 'Storage is unavailable. Coins and items will only last until you close or reload this page.';
    }
    $('round-coins').textContent = `Earned +${game.coinsEarned}`;
    const reasons = Object.keys(SHOP).map(id => game.cheatUnavailable(id));
    const key = encoded + game.state + reasons.join('|');
    if (key === shopKey) return;
    shopKey = key;
    Object.entries(SHOP).forEach(([id,item], index) => {
      $('owned-' + id).textContent = `Owned: ${game.inventory[id]}`;
      const buy = $('buy-' + id), use = $('use-' + id);
      buy.disabled = game.coins < item.price;
      buy.textContent = buy.disabled ? `${item.price} coins · Need more` : `${item.price} coins · Buy`;
      use.disabled = Boolean(reasons[index]);
      use.textContent = reasons[index] || 'Use once';
    });
    $('shop-game-state').textContent = {ready:'Stock up anytime',playing:'Game in progress',paused:'Game paused',over:game.reviveUsed ? 'Revive already used' : 'Get a second chance'}[game.state];
  }
  function openShop() {
    if ($('restart-dialog').open || $('shop-dialog').open) return;
    resumeAfterShop = game.state === 'playing';
    if (resumeAfterShop) game.pause();
    heldKeys.clear();
    $('shop-message').textContent = game.state === 'over' ? 'Keep this round going: buy and use a Second chance.' : 'Buy now and keep it in your bag. Use it when you need it.';
    updateUI(); drawBoard(); $('shop-dialog').showModal();
  }
  function closeShop() {
    $('shop-dialog').close();
    if (resumeAfterShop && game.state === 'paused' && !document.hidden) game.pause();
    updateUI(); drawBoard();
    if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
  }
  $('wallet').addEventListener('click', openShop);
  $('shop-open').addEventListener('click', openShop);
  $('shop-close').addEventListener('click', closeShop);
  $('shop-done').addEventListener('click', closeShop);
  $('shop-dialog').addEventListener('cancel', event => { event.preventDefault(); closeShop(); });
  Object.keys(SHOP).forEach(id => {
    $('buy-' + id).addEventListener('click', () => {
      if (game.buy(id)) { $('shop-message').textContent = `Added 1 ${SHOP[id].name} to your bag.`; tone(660,.12); }
      else $('shop-message').textContent = 'Not enough coins. Clear more lines to earn them.';
      updateUI();
    });
    $('use-' + id).addEventListener('click', () => {
      if (game.useCheat(id)) { $('shop-message').textContent = shopDetails[id].success; tone(520,.12); tone(780,.15,.1); }
      else $('shop-message').textContent = game.cheatUnavailable(id);
      updateUI(); drawBoard();
    });
  });

  function tone(frequency, duration = .08, delay = 0, volume = .035) {
    if (!sound || !audio) return;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + duration);
  }
  function block(context, x, y, size, type, ghost = false) {
    const color = COLORS[type];
    const gap = Math.max(1.5, size * .06), px = x + gap, py = y + gap, w = size - gap * 2;
    context.save();
    if (ghost) {
      context.fillStyle = color + '10'; context.fillRect(px, py, w, w);
      context.strokeStyle = color + '90'; context.lineWidth = Math.max(1, size * .025);
      context.setLineDash([size * .13, size * .09]); context.strokeRect(px + 1, py + 1, w - 2, w - 2);
    } else {
      context.fillStyle = color;
      context.beginPath(); context.roundRect(px, py, w, w, size * .095); context.fill();
      context.fillStyle = '#ffffff27'; context.fillRect(px + 2, py + 2, w - 4, Math.max(2, size * .07));
      context.fillStyle = '#00000015'; context.fillRect(px + 2, py + w - Math.max(3, size * .09), w - 4, Math.max(2, size * .06));
      context.strokeStyle = '#ffffff15'; context.lineWidth = 1; context.strokeRect(px + 3, py + 3, w - 6, w - 6);
    }
    context.restore();
  }
  function drawPreview(id, type, faded = false) {
    const c = $(id), context = c.getContext('2d');
    context.clearRect(0, 0, c.width, c.height);
    if (!type) {
      context.strokeStyle = '#405a47'; context.setLineDash([3,4]);
      context.strokeRect(c.width / 2 - 16, c.height / 2 - 16, 32, 32); context.setLineDash([]);
      context.fillStyle = '#5a7562'; context.font = '18px sans-serif'; context.textAlign = 'center';
      context.fillText('+', c.width / 2, c.height / 2 + 6); return;
    }
    const cells = [];
    SHAPES[type].forEach((row,y) => row.forEach((v,x) => { if(v) cells.push([x,y]); }));
    const minX = Math.min(...cells.map(c => c[0])), minY = Math.min(...cells.map(c => c[1]));
    const width = Math.max(...cells.map(c => c[0])) - minX + 1;
    const height = Math.max(...cells.map(c => c[1])) - minY + 1;
    const size = id === 'next-0' ? 25 : 22;
    context.globalAlpha = faded ? .35 : 1;
    cells.forEach(([x,y]) => block(context, (c.width - width * size) / 2 + (x - minX) * size, (c.height - height * size) / 2 + (y - minY) * size, size, type));
    context.globalAlpha = 1;
  }
  function drawBoard() {
    const size = canvas.width / 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0e1712'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#b4ecc809'; ctx.lineWidth = 1;
    for(let x = 1; x < 10; x++) { ctx.beginPath(); ctx.moveTo(x * size, 0); ctx.lineTo(x * size, canvas.height); ctx.stroke(); }
    for(let y = 1; y < 20; y++) { ctx.beginPath(); ctx.moveTo(0, y * size); ctx.lineTo(canvas.width, y * size); ctx.stroke(); }
    if (game.state === 'ready') {
      const decoration = [ ['J',0,18],['J',0,19],['J',1,19],['J',2,19],['O',3,18],['O',4,18],['O',3,19],['O',4,19],['S',5,19],['S',6,19],['S',6,18],['S',7,18],['L',8,19],['L',9,19],['L',9,18],['L',9,17],['T',0,16],['T',0,17],['T',1,17],['T',0,15],['I',5,0],['I',6,0],['I',7,0],['I',8,0] ];
      ctx.globalAlpha = .22;
      decoration.forEach(([type,x,y]) => block(ctx, x * size, y * size, size, type));
      ctx.globalAlpha = 1; return;
    }
    ctx.globalAlpha = game.state === 'paused' ? .3 : 1;
    game.board.forEach((row,y) => row.forEach((type,x) => { if(type) block(ctx,x * size,y * size,size,type); }));
    if (game.active && game.state !== 'over') {
      const a = game.active, ghost = game.ghostY();
      a.matrix.forEach((row,y) => row.forEach((v,x) => {
        if(v && ghost + y >= 0) block(ctx,(a.x + x) * size,(ghost + y) * size,size,a.type,true);
      }));
      a.matrix.forEach((row,y) => row.forEach((v,x) => {
        if(v && a.y + y >= 0) block(ctx,(a.x + x) * size,(a.y + y) * size,size,a.type);
      }));
    }
    ctx.globalAlpha = 1;
  }
  function updateUI() {
    updateEconomy();
    $('score').textContent = String(game.score).padStart(6, '0');
    $('level').textContent = String(game.level).padStart(2, '0');
    $('lines').textContent = game.lines;
    $('progress').style.width = (game.lines % 10) * 10 + '%';
    $('progress-text').textContent = `${game.lines % 10} / 10 lines`;
    const seconds = Math.floor(game.elapsed / 1000);
    $('time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    if (game.score > best) {
      best = game.score; $('best').textContent = best.toLocaleString();
      try { localStorage.setItem('blocks-space-best', String(best)); } catch (_) {}
    }
    const key = [game.held, game.usedHold, ...game.queue.slice(0,5)].join(',');
    if (key !== previewKey) {
      drawPreview('hold', game.held, game.usedHold);
      for (let i = 0; i < 5; i++) drawPreview(`next-${i}`, game.queue[i]);
      $('hold-hint').textContent = game.usedHold ? 'Place this piece to swap again.' : 'Save a piece for later.';
      previewKey = key;
    }
    if (game.placements !== lastPlacement) {
      lastPlacement = game.placements;
      if (game.lastClear) {
        const toast = $('clear-toast');
        toast.textContent = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'][game.lastClear] + ` +${game.lastCoinReward} coins`;
        toast.classList.remove('pop'); void toast.offsetWidth; toast.classList.add('pop');
        clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('pop'), 1100);
        [440,554,659,880].slice(0,game.lastClear + 1).forEach((f,i) => tone(f,.22,i*.065));
      } else tone(150,.08,0,.055);
    }
    if (lastState !== game.state) {
      lastState = game.state; heldKeys.clear();
      const playing = game.state === 'playing';
      $('overlay').classList.toggle('hidden', playing);
      $('pause').disabled = game.state === 'ready' || game.state === 'over';
      $('pause-text').textContent = game.state === 'paused' ? 'Resume' : 'Pause';
      $('status').textContent = {ready:'Ready to play',playing:'Playing',paused:'Paused',over:'Game over'}[game.state];
      $('status-dot').style.background = playing ? '#b4ecc8' : '#e8b383';
      if (game.state === 'paused') {
        $('overlay-eyebrow').textContent = 'TAKE YOUR TIME'; $('overlay-title').innerHTML = 'Take a breath.<br>Find your flow.';
        $('overlay-description').textContent = 'Your blocks can wait. Take your time.'; $('start-text').textContent = 'Resume game';
        $('start-hint').textContent = 'Press P or Enter to resume';
      } else if (game.state === 'over') {
        $('overlay-eyebrow').textContent = 'ONE MORE LITTLE BREAK'; $('overlay-title').innerHTML = 'Every ending.<br>A new beginning.';
        $('overlay-description').textContent = `${game.score.toLocaleString()} points · ${game.coinsEarned} coins earned`;
        $('start-text').textContent = 'Play again'; $('start-hint').textContent = 'Press Enter for a new game';
        tone(330,.25); tone(220,.35,.2);
      }
    }
  }
  function start() {
    game.start(); previewKey = ''; lastPlacement = 0;
    clearTimeout(toastTimer); $('clear-toast').classList.remove('pop');
    tone(440,.12); tone(660,.18,.1); updateUI(); drawBoard();
  }
  function act(action) {
    if ($('restart-dialog').open || $('shop-dialog').open) return;
    let changed = false;
    switch(action) {
      case 'left': changed = game.move(-1); break;
      case 'right': changed = game.move(1); break;
      case 'down': changed = game.softDrop(); break;
      case 'rotate': changed = game.rotate(); if(changed) tone(340,.035); break;
      case 'reverse': changed = game.rotate(-1); if(changed) tone(300,.035); break;
      case 'hold': changed = game.hold(); if(changed) tone(520,.06); break;
      case 'drop':
        changed = game.hardDrop();
        if(changed) { const frame = $('board-frame'); frame.classList.remove('impact'); void frame.offsetWidth; frame.classList.add('impact'); }
        break;
      case 'pause': game.pause(); break;
    }
    updateUI(); drawBoard();
  }
  $('start').addEventListener('click', () => { if(game.state === 'paused') act('pause'); else start(); $('start').blur(); });
  $('pause').addEventListener('click', () => { act('pause'); $('pause').blur(); });
  $('sound').addEventListener('click', () => {
    sound = !sound;
    if(sound) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(Audio) { audio ||= new Audio(); audio.resume().catch(() => {}); } else sound = false;
    }
    $('sound').setAttribute('aria-pressed', String(sound));
    $('sound').setAttribute('aria-label', sound ? 'Mute sound' : 'Enable sound');
    $('sound').title = sound ? 'Mute sound' : 'Enable sound';
    $('sound-waves').setAttribute('d', sound ? 'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : 'm16 9 6 6m0-6-6 6');
    tone(660,.1); $('sound').blur();
  });
  $('restart').addEventListener('click', () => {
    if(game.state === 'ready' || game.state === 'over') { start(); $('restart').blur(); return; }
    resumeAfterDialog = game.state === 'playing';
    if(resumeAfterDialog) game.pause();
    updateUI(); $('restart-dialog').showModal();
  });
  function cancelRestart() {
    $('restart-dialog').close();
    if(resumeAfterDialog && game.state === 'paused') game.pause();
    updateUI(); $('restart').blur();
  }
  $('cancel-restart').addEventListener('click', cancelRestart);
  $('restart-dialog').addEventListener('cancel', event => { event.preventDefault(); cancelRestart(); });
  $('confirm-restart').addEventListener('click', () => { $('restart-dialog').close(); start(); $('restart').blur(); });

  const mapping = { ArrowLeft:'left', ArrowRight:'right', ArrowDown:'down', ArrowUp:'rotate', KeyX:'rotate', KeyZ:'reverse', KeyC:'hold', ShiftLeft:'hold', ShiftRight:'hold', Space:'drop', KeyP:'pause', Escape:'pause' };
  window.addEventListener('keydown', event => {
    if($('restart-dialog').open || $('shop-dialog').open || event.ctrlKey || event.metaKey || event.altKey) return;
    // Preserve native keyboard activation and focus navigation for buttons.
    if(event.target instanceof HTMLButtonElement && (event.code === 'Enter' || event.code === 'Space')) return;
    if(event.code === 'Enter') {
      event.preventDefault();
      if(event.repeat) return;
      if(game.state === 'ready' || game.state === 'over') start();
      else if(game.state === 'paused') act('pause');
      return;
    }
    const action = mapping[event.code];
    if(!action) return;
    event.preventDefault();
    if(event.repeat) return;
    act(action);
    if(['left','right','down'].includes(action) && game.state === 'playing') heldKeys.set(event.code, { action, next: performance.now() + (action === 'down' ? 60 : 160) });
  });
  window.addEventListener('keyup', event => heldKeys.delete(event.code));
  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      const action = button.dataset.action; act(action);
      if(['left','right','down'].includes(action) && game.state === 'playing') heldKeys.set(`touch-${event.pointerId}`, {action, next:performance.now() + 150});
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(name, event => heldKeys.delete(`touch-${event.pointerId}`));
    button.addEventListener('click', event => { if(event.detail === 0) act(button.dataset.action); });
  });
  function autoPause() { heldKeys.clear(); if(game.state === 'playing') { game.pause(); updateUI(); drawBoard(); } }
  document.addEventListener('visibilitychange', () => { if(document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  function frame(now) {
    const elapsed = Math.min(now - lastTime, 100); lastTime = now;
    if(game.state === 'playing') {
      for(const input of heldKeys.values()) {
        if(now >= input.next) { act(input.action); input.next = now + (input.action === 'down' ? 35 : 55); }
      }
      game.tick(elapsed);
    }
    updateUI(); drawBoard(); requestAnimationFrame(frame);
  }
  updateUI(); drawBoard(); requestAnimationFrame(frame);
})();
