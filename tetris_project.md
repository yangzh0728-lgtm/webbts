---
layout: default
title: Tetris Code Autopsy — Innovator Journal
journal: true
game_project: true
---

## About the project

For this activity, I asked AI to create a Tetris game, add a coin system for buying cheat opportunities, and translate the interface into English. The result is **Blocks & Space**, a browser game made with HTML, CSS, and JavaScript. This journal looks inside that AI-generated code instead of only showing the finished game.

The game includes a preview of upcoming pieces, a hold slot, a landing-position guide, and keyboard and touch controls. It also has a coin wallet and a power-up shop: line clears earn coins that can be exchanged for an I-piece, bottom-row cleanup, or a once-per-game revive. These are in-game coins; there are no real-money purchases.

The aim is to complete horizontal lines and keep the stack from reaching the top. [Play the game below](#play), or read how its parts fit together first. The excerpts below come from the actual game files; some are shortened to focus on one idea.

## Code autopsy

### 1. Setup: representing the board

In `engine.js`, this line creates the empty board:

```javascript
const emptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(null));
```

The board is a list of 20 rows, with 10 spaces in each row. `null` means a space is empty. When a piece lands, the code stores its letter, such as `T` or `I`, in the spaces it occupies. This gives the program a way to remember the board without looking at the picture on the screen. The shape definitions use smaller grids of `1`s and `0`s to describe each piece.

### 2. Input: turning a key press into movement

In `app.js`, these cases connect an action to the engine:

```javascript
case 'left': changed = game.move(-1); break;
case 'right': changed = game.move(1); break;
case 'down': changed = game.softDrop(); break;
```

The keyboard handler maps the arrow keys to these actions. Moving left subtracts one from the piece's horizontal position; moving right adds one. The engine checks whether the move is allowed before changing the position. Separating the key press from the movement rule also lets the on-screen touch buttons use the same actions.

### 3. Collision detection: deciding where a piece can go

This method in `engine.js` checks a proposed position:

```javascript
collides(matrix, x, y) {
  return matrix.some((row, dy) => row.some((cell, dx) => cell &&
    (x + dx < 0 || x + dx >= 10 || y + dy >= 20 || (y + dy >= 0 && this.board[y + dy][x + dx]))));
}
```

`x` and `y` locate the piece, while `dx` and `dy` locate each square within it. Only filled squares are checked. A collision happens if a square would cross a side, go below the board, or overlap an occupied space. `.some()` returns true as soon as any square fails the check. This is why a piece stops at a wall or on top of another piece instead of passing through it.

### 4. The game loop: making the picture keep changing

Near the end of `frame()` in `app.js`, the loop runs these steps:

```javascript
game.tick(elapsed);
```

```javascript
updateUI(); drawBoard(); requestAnimationFrame(frame);
```

While the game is playing, `tick(elapsed)` advances the engine by the time since the previous frame. Then the interface updates, the canvas redraws, and `requestAnimationFrame` asks the browser to call the function again. The drawing code turns the stored board into colored squares. Updating the state and drawing it are separate jobs.

The automatic falling speed comes from this getter in `engine.js`:

```javascript
get interval() { return Math.max(75, 850 * Math.pow(0.8, this.level - 1)); }
```

At level 1, a piece falls one row every 850 milliseconds. Each level makes that interval smaller, with a minimum of 75 milliseconds. A smaller wait means faster falling.

### 5. Clearing lines, scoring, and coins

Inside `lock()` in `engine.js`, these lines find completed rows and award points:

```javascript
const remaining = this.board.filter(row => !row.every(Boolean));
const cleared = 20 - remaining.length;
this.lastClear = cleared; this.placements++;
this.score += [0,100,300,500,800][cleared] * this.level;
```

`row.every(Boolean)` checks whether every space in a row is occupied. The filter keeps rows that are not full. Subtracting the number left from 20 tells the program how many lines were cleared. Clearing one line at level 1 gives 100 points; clearing four together gives 800 points. Other code adds empty rows at the top to keep the board 20 rows tall.

Coins have a separate reward list:

```javascript
const COIN_REWARDS = [0,10,25,45,80];
```

One line earns 10 coins, and four lines earn 80. The shop's `buy(id)` method checks the item and balance, subtracts the price, and adds one item to the inventory. Buying and using are separate actions. `useCheat(id)` checks whether the item can be used at that moment before consuming it. For example, a revive is allowed only after game over, once per round.

The interface saves the wallet and unused items with `localStorage`, so they can survive a reload in the same browser. This does not save an unfinished round, and it depends on browser storage being available.

## One deliberate change

I asked for the game to be changed into English. One small, specific part of that change was the start-button label in `index.html`.

**Before:**

```html
<span id="start-text">开始游戏</span>
```

**After:**

```html
<span id="start-text">Start game</span>
```

**Expected effect:** replacing the text inside the span should change what the player reads. Keeping the same element ID and surrounding button should preserve the connection to the existing game controls.

**Verified result:** the English version displays “Start game,” and activating the button starts the round. The previous and current versions in Git history also show this exact text change. These checks were performed with AI assistance; they are not a claim of independent playtesting.

This example shows that changing a label affects the interface. The falling speed, collision rules, and point values live elsewhere in the JavaScript. Translating the full interface also required updating messages generated by `app.js`, such as the pause and game-over text.

## Reflection

The code separates three important jobs: HTML provides the page elements, CSS controls their appearance, and JavaScript manages the game and draws the board. Inside JavaScript, `engine.js` handles the rules, while `app.js` connects those rules to the screen and controls.

AI produced the implementation, and this explanation was prepared with AI assistance. A useful next step for my own understanding is to trace one key press through the input handler, movement method, collision check, and redraw, then explain that sequence without relying on the code comments.

Today, I saw a variety of games, from complex 3D games to simple dodging games. Seeing these different projects gave me ideas for how I could improve my own Tetris game.

## Future goals

My future goals for this course are to understand JavaScript well enough to explain how my Tetris game handles movement, collisions, graphics, and scoring. Also, improve my game by adding an original feature, testing it, and documenting the changes in my Innovator Journal. Explore how different types of games work. Today, I saw a variety of games, from complex 3D games to simple dodging games, which inspired me to try creating another game, starting with a simple dodging game.

## How to play

Click **Start game** or press **Enter** while the game is focused to start. Click inside the game before using keyboard controls. On a phone, use the on-screen buttons.

| Key | Action |
| --- | --- |
| Left / Right arrows | Move the piece |
| Up arrow / X | Rotate clockwise |
| Z | Rotate counterclockwise |
| Down arrow | Soft drop |
| Space | Hard drop |
| C / Shift | Hold or swap a piece |
| P / Esc | Pause or resume |
| Enter | Start, resume, or start again after game over |

Open **Power-up shop** or select the coin balance to visit the power-up shop. Sound starts muted and can be enabled with the sound button.

## Source code

The complete playable copy is included in this journal's public repository:

- [Game rules — engine.js](https://github.com/yangzh0728-lgtm/webbts/blob/main/games/blocks-and-space/engine.js)
- [Input, drawing, and saved progress — app.js](https://github.com/yangzh0728-lgtm/webbts/blob/main/games/blocks-and-space/app.js)
- [Page structure — index.html](https://github.com/yangzh0728-lgtm/webbts/blob/main/games/blocks-and-space/index.html)
- [Visual design — styles.css](https://github.com/yangzh0728-lgtm/webbts/blob/main/games/blocks-and-space/styles.css)
