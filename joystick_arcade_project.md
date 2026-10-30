---
layout: default
title: Joystick Arcade — Innovator Journal
journal: true
arcade_project: true
---

### Video demonstration

<figure class="arcade-video">
  <video controls playsinline preload="metadata" aria-label="Joystick Arcade project demonstration" aria-describedby="arcade-video-caption">
    <source src="{{ '/assets/videos/joystick-arcade-demo.mp4' | relative_url }}" type="video/mp4">
    Your browser does not support embedded video. <a href="{{ '/assets/videos/joystick-arcade-demo.mp4' | relative_url }}">Open the demonstration video.</a>
  </video>
  <figcaption id="arcade-video-caption"><strong>Joystick Arcade demonstration.</strong> My approximately two-minute recording demonstrates the arcade working with the physical Arduino joystick. Use the player controls to play, pause, adjust the volume, or view it full screen.</figcaption>
</figure>

[Open the video directly]( {{ '/assets/videos/joystick-arcade-demo.mp4' | relative_url }} ).

<span id="the-idea"></span>

## My plan

For this project, I wanted to use a physical sensor to control a game on my laptop. I chose an **analog joystick connected to an Arduino Uno-compatible board**. The joystick contains two potentiometers: one measures horizontal movement and the other measures vertical movement. It also has a push button. This gives me two movement values and one action input from a single controller.

I chose the joystick because moving it left, right, up, or down matches the movements I want in an arcade game. It can provide both simple directions for a maze and smooth movement for a paddle or spaceship. My plan was to use **one joystick for five games: Maze Escape, Snake, Pong, Breakout, and Space Dodge**.

I expected the connection to work like this:

**Joystick movement → Arduino readings → USB serial message → Python controller → game movement.**

The Arduino would read the sensor and send numbers to the laptop. Python would use **PySerial** to receive them, then **Pygame** would update the game. Keeping the controller separate from the game rules would let all five games share the same input code. Keyboard controls would provide a fallback while developing or troubleshooting the hardware.

| Game | How I planned to use the joystick |
| --- | --- |
| Maze Escape | Tilt to move through passages; press to continue after a round. |
| Snake | Tilt to choose a direction without reversing into the snake's body. |
| Pong | Use the vertical axis to move the paddle; press to serve. |
| Breakout | Use the horizontal axis to move the paddle; press to launch. |
| Space Dodge | Use both axes to steer; hold briefly to fire. |

## My process

### How I used AI

I first asked **Codex** for ideas for games that could interact with an Arduino. After reviewing the ideas, I supplied a joystick arcade technical plan and asked Codex to start coding. AI generated the Python game framework, the five game implementations, and the Arduino sketch. It also helped explain the code, run software checks, and prepare this journal.

My role was to choose the project direction, supply the plan and wiring reference, ask for changes, and provide the project photo and demonstration video. For example, I asked whether the maze could be random each time, and I showed the actual pin arrangement so the sketch could match it. The code and automated tests were produced with AI assistance; I am not presenting them as work I wrote independently.

### Connecting the joystick

The initial technical plan assigned the joystick button to **D2**, but the wiring diagram I supplied used **D7**. The firmware was changed to read D7. This was a useful reminder that the physical wiring and the code must agree.

| Joystick pin | Arduino pin | Purpose |
| --- | --- | --- |
| GND | GND | Common ground |
| VCC | 5V | Power |
| VRX | A0 | Horizontal position |
| VRY | A1 | Vertical position |
| SW | D7 | Push button |

The button pin uses `INPUT_PULLUP`. It reads `LOW` when pressed, so the sketch converts a pressed button into `1` for the serial message. A short debounce interval prevents a single physical press from being interpreted as several presses. An optional passive buzzer can connect to D8 and GND.

<figure class="arcade-wiring">
  <a href="{{ '/assets/images/joystick-arcade-wiring.png' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-wiring.png' | relative_url }}" alt="Joystick wiring reference: black GND wire, red 5V wire, yellow VRX to A0, green VRY to A1, and blue SW to digital pin 7 on an Arduino Uno." width="1504" height="624" loading="lazy" decoding="async"></a>
  <figcaption>The wiring reference I supplied for this project. This is a diagram, not a photograph of a tested circuit.</figcaption>
</figure>

### Sending meaningful values from the Arduino

The firmware starts serial communication at **115200 baud** and sends a reading every **20 milliseconds**, or about 50 times per second. These lines from the sketch send the two analog values and the button state:

```cpp
Serial.print(analogRead(PIN_X));
Serial.print(',');
Serial.print(analogRead(PIN_Y));
Serial.print(',');
Serial.println(stableButton ? 1 : 0);
```

The commas separate the fields, and `Serial.println()` ends the reading with a newline. Each analog value is between **0 and 1023**. A centered joystick is usually near 512, and the button value is either 0 or 1. For example:

| Example message | What it means |
| --- | --- |
| `512,512,0` | Stick near the center; button released. |
| `1023,512,0` | X axis at its high end; button released. |
| `512,0,1` | Y axis at its low end; button pressed. |

These examples explain the message format; they are not a saved log from my board. Serial Monitor at 115200 baud is the place to check the actual readings. It must be closed before launching the game so Python can use the port.

<span id="technical-tidbit"></span>

### Reading the values in Python

Python opens the serial port with `timeout=0`, so waiting for the next sensor message does not freeze the game. The shared `SerialLink` reads the bytes already available, separates complete lines at newline characters, and keeps any unfinished line for the next frame.

The controller then splits each line at the commas and checks it before using it. This excerpt comes from `Controller.update()`:

```python
parts = line.split(',')
if len(parts) != 3 or not all(p.isascii() and p.isdigit() for p in parts):
    continue
x, y, button = map(int, parts)
if not (0 <= x <= 1023 and 0 <= y <= 1023 and button in (0, 1)):
    continue
self.raw = x, y, button
```

The controller keeps the **newest valid reading**, which prevents a backlog of old movements. It records the first valid X and Y values as the resting center, so the joystick should be centered when the game connects. It then converts the axes to values between **−1 and +1** and applies a **dead zone** around the center to prevent drift.

Each game receives this interpreted input once per frame. For example, Pong uses the vertical value multiplied by paddle speed and elapsed time. Maze Escape turns a strong tilt into one of four directions. The controller also detects a new button press and a one-second hold, which returns to the menu. If serial readings stop for more than half a second, it releases the old hardware input while leaving keyboard controls available.

[View the complete Arduino sketch](https://github.com/yangzh0728-lgtm/webbts/blob/main/arduino/arcade_joystick/arcade_joystick.ino).

### Testing and troubleshooting

Codex ran **31 automated tests** covering calibration, button timing, serial input, menu transitions, score saving, and game rules. A local simulated serial connection tested PySerial, and scripted inputs ran each game for three simulated minutes. These are software checks, rather than a claim that I personally playtested every game for that duration.

One test found a crash when repeatedly closing and reopening Pygame. Cached font objects survived after Pygame shut down; clearing them during shutdown fixed the problem. The Arduino sketch also compiled successfully for an Uno after the D7 change.

During an earlier connection check, the Mac did not list an Arduino port. The troubleshooting steps were to check the USB data cable, choose the board's port, upload the sketch, inspect the readings, and close Serial Monitor before starting Python. Compiling successfully and receiving live sensor data are separate checks.

## My result

The project now has a **five-game laptop arcade**, a shared joystick controller, keyboard fallback, saved high scores, and an Arduino sketch that matches the D7 button wiring. I successfully controlled the games with the physical Arduino joystick in my recorded demo. This confirmed that joystick readings traveled from the Arduino over USB serial into Python and became game inputs. The demonstration video is at the top of this page. Below are a photo of the assembled controller and game previews.

The video is the demonstration for this submission. The photo documents the physical setup, while the gallery shows the games' appearance and rules. The arcade itself runs locally in Python; the website plays the recording and displays the pictures.

### My actual joystick setup

<figure class="arcade-wiring arcade-hardware-photo">
  <a href="{{ '/assets/images/joystick-arcade-hardware.jpg' | relative_url }}"><img src="{{ '/assets/images/joystick-arcade-hardware.jpg' | relative_url }}" alt="An ELEGOO Uno R3 connected to an analog joystick with colored jumper wires and a blue USB cable, with the board's indicator lights illuminated on a wooden desk." width="1280" height="1707" loading="lazy" decoding="async"></a>
  <figcaption><strong>The physical controller.</strong> My Uno-compatible board and joystick connected with jumper wires and a USB cable. Select the photo to see the wiring at full size.</figcaption>
</figure>

### In-game gallery

These previews were captured from the running game code with scripted inputs. Select a picture to open it at full size.

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

### Menu and first maze

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

### Reflection

The most useful lesson from this project is that sensor readings need interpretation before they become good game controls. Raw values alone do not explain whether the joystick is centered, whether a button was just pressed, or which direction a player intends to move. Calibration, a dead zone, and button timing give the games usable inputs.

The D2-to-D7 correction also showed why checking the wiring matters. Even correct Python logic cannot respond to a button if the Arduino sketch reads the wrong pin. Separating the controller from the games makes this easier to troubleshoot because the input can be checked in one place.

I also asked for random mazes. The implementation generates a new connected maze when starting, retrying after a loss, or entering the next level. The start and exit remain in opposite corners, but the passages change, so replaying does not depend on memorizing one route.

### Next steps

With the physical joystick working in the demo, my next checks are to measure its reliability across all five games, test the one-second return gesture, and unplug the board during play to check the keyboard fallback. The optional buzzer also needs its own check.

I would like a classmate to try the controls and give feedback. Space Dodge currently requires short firing bursts because holding the same button for one second exits to the menu. Testing that interaction will help me decide whether the control scheme needs to change. I also want to explain one full input path—from `analogRead()` to the player's movement—in my own words.

*Journal entry: October 29, 2026. Written with AI assistance.*
