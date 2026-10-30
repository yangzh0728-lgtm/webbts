---
layout: default
title: Joystick Arcade — Innovator Journal
journal: true
arcade_project: true
---

## The idea

For this project, I wanted to connect a physical Arduino controller to a game running on my laptop. The class activity introduced the idea of reading a sensor with an Arduino, sending its values over serial, and using Python to turn those readings into game controls. Instead of choosing a different sensor for each game, I chose **one analog joystick that could control a small arcade**.

I started by asking Codex for game ideas that could interact with an Arduino. After exploring possibilities such as a distance-controlled flying game and a knob-controlled spaceship, I moved forward with a joystick arcade technical plan. I then asked Codex to implement it. The result is a Python program with five games: **Maze Escape, Snake, Pong, Breakout, and Space Dodge**.

Unlike my earlier browser-based Tetris project, this arcade runs locally on a laptop using **Pygame and PySerial**. This website documents the project; the screenshots are previews, not an embedded playable version.

## My process

The first design decision was to separate the controller from the games. The Arduino reports the joystick's horizontal position, vertical position, and button state. A shared Python controller interprets those readings, and each game uses the same controls. This means adding another game does not require rewriting the Arduino sketch.

With AI assistance, the implementation began with input handling and saved scores, followed by the menu and individual games. Keyboard controls were included so the software could be developed and checked before connecting the hardware. Arrow keys or WASD move the player, while Space or Enter acts as the joystick button.

The games use different parts of the same input. Maze Escape and Snake need four directions; Pong uses the vertical axis; Breakout uses the horizontal axis; Space Dodge uses both axes. Pressing the button selects a game, serves a ball, or restarts a round. Holding it for one second returns to the arcade menu.

<div class="project-photos">
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-menu.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-menu.png' | relative_url }}" alt="Joystick Arcade menu listing Maze Escape, Snake, Pong, Breakout, and Space Dodge, with saved best scores." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>One controller, five games.</strong> A development screenshot of the shared menu in keyboard mode.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-maze.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-maze.png' | relative_url }}" alt="Maze Escape with a yellow player near the upper-left corner and a green exit near the lower-right corner." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>A new route each time.</strong> Maze Escape generates its layout when a game or level begins.</figcaption>
  </figure>
</div>

## In-game gallery

These previews show all five games in progress, captured from the running game code with scripted inputs. Select a picture to open it at full size.

<div class="project-photos arcade-gallery">
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-maze-gameplay.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-maze-gameplay.png' | relative_url }}" alt="Maze Escape in progress, with a yellow player partway through the maze and a dotted trail marking visited passages." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>Maze Escape · follow the trail.</strong> Navigate the random passages and reach the green exit before the countdown ends.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-snake-gameplay.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-snake-gameplay.png' | relative_url }}" alt="Snake gameplay with a longer green body, yellow head, red food, and a score of 100." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>Snake · room to grow.</strong> Ten pieces of food bring the score to 100 and make the snake longer and faster.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-pong-gameplay.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-pong-gameplay.png' | relative_url }}" alt="An active Pong rally with a white ball between the blue player paddle and yellow computer paddle." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>Pong · keep the rally going.</strong> Move the blue paddle up and down to return the ball against the computer.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-breakout-gameplay.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-breakout-gameplay.png' | relative_url }}" alt="Breakout in progress with gaps in the colored brick wall, a moving ball, and a score of 160." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>Breakout · open up the wall.</strong> Missing bricks show the ball's progress. Higher rows award more points.</figcaption>
  </figure>
  <figure>
    <a href="{{ '/assets/images/joystick-arcade-space-dodge-gameplay.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-space-dodge-gameplay.png' | relative_url }}" alt="Space Dodge gameplay with a blue spaceship, falling asteroids, and a score of 255 after 13 seconds." width="800" height="600" loading="lazy" decoding="async"></a>
    <figcaption><strong>Space Dodge · move and fire.</strong> Steer through falling asteroids and fire in short bursts for bonus points.</figcaption>
  </figure>
</div>

## Connecting the joystick

An important change came from comparing the initial code with the wiring diagram I supplied. The technical plan used **D2** for the joystick button, but my diagram used **D7**. I asked for the implementation to match the diagram, and the firmware was updated accordingly.

| Joystick pin | Arduino Uno pin | Purpose |
| --- | --- | --- |
| GND | GND | Common ground |
| VCC | 5V | Power |
| VRX | A0 | Horizontal position |
| VRY | A1 | Vertical position |
| SW | D7 | Joystick push button |

The button uses `INPUT_PULLUP`, so the pin reads `LOW` when pressed. The firmware converts that into `1` before sending it to Python. An optional passive buzzer can connect to D8 and GND for feedback; it is not shown in this diagram.

<figure class="arcade-wiring">
  <a href="{{ '/assets/images/joystick-arcade-wiring.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-wiring.png' | relative_url }}" alt="Joystick wiring reference: black GND wire, red 5V wire, yellow VRX to A0, green VRY to A1, and blue SW to digital pin 7 on an Arduino Uno." width="1504" height="624" loading="lazy" decoding="async"></a>
  <figcaption>The wiring reference I supplied for this project. This is a diagram, not a photograph of a tested circuit.</figcaption>
</figure>

The USB cable carries the readings from the Arduino to the laptop. Both programs use **115200 baud**. After uploading the sketch, the Serial Monitor can show whether moving and pressing the joystick changes the values. It must then be closed before starting the game, because the game needs access to the same serial port.

[View the Arduino sketch](https://github.com/yangzh0728-lgtm/webbts/blob/main/arduino/arcade_joystick/arcade_joystick.ino).

## Technical tidbit

The Arduino sends a line approximately every 20 milliseconds. A typical reading is:

```text
512,512,0
```

The first two numbers are analog readings from 0 to 1023; the last number is the button state. A resting joystick is usually near the middle, but it may not sit at exactly 512. Python records the first valid reading as its center and applies a **dead zone** so small resting variations do not make the player drift. The stick should be centered when the game connects.

Python also keeps the newest complete reading instead of processing old readings one at a time. This prevents a growing input delay. If readings stop arriving for more than half a second, the controller releases the old movement and button input, while keyboard controls remain available.

I also asked whether the maze could be random every time. The implementation already regenerates it when starting a game, retrying after a loss, or entering the next level. It uses a randomized backtracking algorithm: choose an unvisited neighboring cell, carve a passage, and backtrack when there are no unvisited neighbors. The start and exit stay in opposite corners, while the route changes. The algorithm connects all maze cells, so the exit remains reachable.

## Testing and troubleshooting

Codex ran **31 automated tests**, including controller calibration, button timing, menu transitions, score saving, and game rules. A serial integration test used a local simulated device connection to exercise PySerial. Each game also completed three minutes of simulated play with scripted inputs. These checks provide software evidence, but they are not the same as playing for three minutes with a physical joystick.

One application test exposed a crash when repeatedly closing and reopening Pygame. Cached font objects were surviving after Pygame had shut down. Clearing those objects during shutdown fixed the crash, and the tests then passed. The Arduino sketch also compiled successfully for an Uno after the button pin was changed to D7.

**At the time of this entry, physical upload and joystick playtesting have not been confirmed.** When we checked the Mac's serial devices during setup, an Arduino port was not listed. The next hardware check is to connect the board with a USB data cable, select its port, upload the sketch, and inspect the live readings before launching the game.

## Reflection

This project shows why hardware and software need a clear agreement. A working game cannot recognize the joystick button if its sketch reads the wrong pin. The D2-to-D7 correction was small, but it mattered to the whole interaction.

The shared controller also gives me a useful programming pattern to study. Each game can focus on its own rules because calibration, serial input, and button timing are handled in one place. My next learning task is to trace one joystick movement from `analogRead()` through the serial message to a change in the player's position, and explain that sequence in my own words.

AI generated the implementation and assisted with the tests and this journal. My contributions so far were choosing the project direction, supplying the technical plan and wiring reference, and asking how random mazes and the Arduino connection work. I still need to verify the physical experience myself.

## Next steps

- Upload the D7 version of the sketch and confirm both axes and the button in Serial Monitor.
- Play all five games with the real joystick, checking direction, sensitivity, and the one-second return gesture.
- Unplug the board during a game and confirm that keyboard controls still work.
- Test the optional buzzer and confirm that sounds do not interrupt movement readings.
- Ask a classmate to try the controls and record their feedback. In particular, Space Dodge currently requires short firing bursts because holding for one second exits to the menu; that tradeoff needs playtesting.

*Journal entry: October 29, 2026.*
