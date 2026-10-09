---
layout: default
title: Blocks & Space — Tetris Project
game_project: true
---

## About the project

Blocks & Space (方块之间) is my browser-based Tetris project. Rotate and place falling blocks on a 10-column, 20-row board, complete horizontal lines, and keep the stack from reaching the top. Clearing lines earns points and increases the level, making the pieces fall faster.

The game includes a preview of upcoming pieces, a hold slot, a landing-position guide, and keyboard and touch controls. It also has a coin wallet and a power-up shop: line clears earn coins that can be exchanged for an I-piece, bottom-row cleanup, or a once-per-game revive. These are in-game coins; there are no real-money purchases.

The interface is in Chinese, with an English keyboard guide below. High scores, coins, and unused items are saved in the current browser when local storage is available. An unfinished round is not saved.

## How to play

Click **开始游戏** or press **Enter** while the game is focused to start. Click inside the game before using keyboard controls. On a phone, use the on-screen buttons.

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

Open **作弊商店** or select the coin balance to visit the power-up shop. Sound starts muted and can be enabled with the sound button.

## Behind the game

The project uses HTML, CSS, and JavaScript with a canvas-based game board. The game engine handles piece movement, collisions, rotation, line clearing, scoring, and the power-up rules. A separate interface script draws the board, handles input, updates the controls, and saves progress such as the coin wallet and high score.

[View the source repository on GitHub](https://github.com/yangzh0728-lgtm/blocks-and-space). The repository is currently private, so viewing the source requires access; the game on this website is available to everyone.
