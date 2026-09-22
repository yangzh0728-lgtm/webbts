---
layout: default
title: Arduino Parking Sensor — Innovator Journal
---

# Arduino Parking Sensor

*By Sam Yang*

> **Draft checklist:** Replace the bracketed prompts with your actual final test results, photos/video, and classmate interaction before submitting. The behavior table describes what the code is designed to do; it is not a record of successful hardware tests.

## My process

### Why I chose this project

I am interested in cars, technology, and engineering, so I chose to build a small Arduino parking sensor. I wanted to explore how a device could detect an obstacle and communicate its distance through lights and sound. This project built on the circuit wiring and programming we practiced in class, while giving me a chance to work with an ultrasonic sensor and a potentiometer.

The problem I focused on was judging how close something is without constantly reading a measurement. My device is a classroom prototype: moving an object toward the sensor is supposed to change the LED color and buzzer pattern.

### My starting point and resources

I started with [SunFounder’s Parking Sensor 3.0 tutorial](https://docs.sunfounder.com/projects/summary-of-fun-projects/en/latest/arduino/parking_sensor3.0.html). It provides a circuit and example code using an ultrasonic sensor, one LED, and an active buzzer. The tutorial uses an Uno R4, while the board identified during my troubleshooting was an Arduino Uno using the AVR board package.

I used ChatGPT/Codex to help adapt the example, explain the code, interpret error messages, and check the sketch with the Arduino compiler. It also helped read the board’s serial output. I still needed to check the physical wiring and test whether the device actually behaved as intended. A successful compilation could not prove that the circuit worked.

I extended the tutorial by adding three separate LED indicators and a potentiometer to adjust the beep speed. I also added Serial Monitor output for both distance and the potentiometer reading, which made troubleshooting more specific.

### Components and connections

My build uses an Arduino Uno, an HC-SR04 ultrasonic distance sensor, three LEDs, three 1 kΩ LED resistors, an active buzzer, a potentiometer, a breadboard, and jumper wires.

| Component | Connection used in my sketch |
|---|---|
| HC-SR04 TRIG | D11 |
| HC-SR04 ECHO | D10 |
| HC-SR04 power | VCC to 5V; GND to Arduino GND |
| Green LED | D6 through its own 1 kΩ resistor to the anode; cathode to GND |
| Yellow LED | D5 through its own 1 kΩ resistor to the anode; cathode to GND |
| Red LED | D4 through its own 1 kΩ resistor to the anode; cathode to GND |
| Active buzzer | Positive to D3; negative to GND |
| Potentiometer | Wiper/middle terminal to A3; outer terminals to 5V and GND |

For the LEDs, a resistor limits the current, and the circuit needs a complete path back to GND. Breadboard rails and groups of connected holes matter: placing an LED’s two legs in the same connected strip would not create the intended circuit.

### How I developed the design

I first used the tutorial as a starting point for the sensor and buzzer. I then expanded the visual output to three LEDs. During this process, I corrected the code’s pin assignments to match my wiring: green on D6, yellow on D5, and red on D4.

Later, I changed the color order in the code. My current version uses red for far away, yellow for the middle range, and green for close. This showed me that changing which LED represents a condition does not require moving the wires. It requires changing the conditions passed to `digitalWrite()`.

I also considered adding a four-digit seven-segment display. The first display example was a TM1637 module, but the type I meant was a bare four-digit display with many legs. Those parts need different wiring. I decided to leave the display out of this version so I could focus on the sensor, LEDs, buzzer, and potentiometer.

For the potentiometer, I wanted turning a knob to change the sound. I learned that an active buzzer has an internal oscillator, so this sketch adjusts the timing of the beeps instead of producing different musical notes. A passive buzzer would be a different choice for controlling pitch. [SunFounder’s buzzer explanation](https://docs.sunfounder.com/projects/sf-components/en/latest/component_buzzer.html) helped clarify the distinction.

### What did not work, and what I changed

Several problems made me separate the different stages of getting an Arduino project to work.

| Problem I encountered | What I checked or changed | What I learned |
|---|---|---|
| `bad CPU type in executable` | With AI assistance, I checked the Mac and compiler architectures. The Mac was ARM-based and the compiler was Intel-based. After troubleshooting, the compiler could run. | A development-tool problem can happen before the sketch is even compiled. |
| `expected '}' at end of input` | We compared the temporary IDE sketch with the complete saved file. The IDE copy was cut off, so the missing ending had to be restored and the complete file opened. | Copying only part of a sketch can remove braces, functions, or the call that updates the outputs. |
| The selected USB port disappeared | I checked for the connected board and needed to use its available USB port. At some points, no USB Arduino was detected. | Compilation and uploading are separate steps. Correct code still needs a working USB connection. |
| All three LEDs stayed off | I checked the LED pin assignments and considered polarity and shared ground. A separate LED-only test was prepared to isolate the lights from the sensor. | Testing a smaller part of the circuit can help distinguish a wiring problem from a sensor or program problem. |
| The potentiometer did not seem to change the sound | A3 readings were added to the serial output. One recorded check stayed at 520, while the distance stayed around 80 cm. | At 80 cm, this program intentionally silences the buzzer. Testing the knob’s effect requires an object in the beeping range and checking whether A3 changes while the knob is actually turned. |

The constant A3 reading alone did not prove the potentiometer was broken, because the check did not establish whether I moved it during the recording. This is an example of why I need both measurements and clear test conditions before deciding what failed.

Arduino’s [guide to the compiler architecture error](https://support.arduino.cc/hc/en-us/articles/7765785712156-Error-bad-CPU-type-in-executable-on-macOS) was another troubleshooting resource.

### How the current code is designed to behave

| Measured distance | LED | Buzzer |
|---|---|---|
| Above 17 cm | Red | Silent |
| Above 13 cm, up to 17 cm | Yellow | Slow beeps |
| Above 9 cm, up to 13 cm | Yellow | Medium beeps |
| Above 5 cm, up to 9 cm | Green | Fast beeps |
| 5 cm or less | Green | Continuous sound |
| No echo received | All off | Silent; Serial Monitor reports `No echo` |

The potentiometer scales the intervals between beeps. It does not change the distance thresholds, and it does not affect the continuous sound at 5 cm or less. To test the knob, I can hold a flat object about 12 cm away and turn it through its range.

### Coding concepts I practiced

`setup()` configures the input and output pins and starts serial communication. `loop()` repeatedly checks whether it is time for another measurement. About every 70 milliseconds, it reads A3, measures distance, and prints the results. `updateOutputs()` uses `if` statements to select the LED and buzzer behavior.

The potentiometer is an analog input because its voltage can vary across a range. On this Uno, `analogRead(A3)` normally represents that voltage with a number from 0 to 1023. A digital input is interpreted as a HIGH or LOW state. Arduino’s [Analog Read Serial example](https://docs.arduino.cc/built-in-examples/basics/AnalogReadSerial/) explains how to read a potentiometer.

The following lines convert the knob reading into a percentage and use it to adjust the beep interval:

```cpp
unsigned long speedPercent = map(potValue, 0, 1023, 50, 200);
interval = interval * speedPercent / 100UL;
if (interval < 150UL) interval = 150UL;
```

A shorter interval means faster beeping. The minimum interval leaves a gap after each 100-millisecond beep. The code uses elapsed time from `millis()` for the buzzer instead of a long `delay()`. However, the echo measurement can still wait for up to 25 milliseconds inside `pulseIn()`.

### Final testing and evidence

The latest saved sketch compiled for Arduino Uno using 4,868 bytes of program storage and 249 bytes of RAM. During earlier troubleshooting, the board produced distance readings around 28–31 cm and, during a later check, around 80 cm. These readings confirmed that data was being received; they were not a calibration against a ruler.

I have not documented a final successful test of every LED and the potentiometer yet. Before submitting, I need to replace the prompts below with what I actually observed.

**[FINAL RESULT: Describe which functions worked in your final build and any remaining problem. If you fixed the LED or potentiometer issue, explain the exact connection or code change that solved it.]**

| Test to perform | Expected result | My actual observation |
|---|---|---|
| Flat object about 25 cm away | Red LED; silent buzzer | **[ADD OBSERVATION]** |
| Flat object about 12 cm away | Yellow LED; beeping | **[ADD OBSERVATION]** |
| Flat object about 7 cm away | Green LED; faster beeping at the same knob setting | **[ADD OBSERVATION]** |
| Flat object about 4 cm away | Green LED; continuous sound | **[ADD OBSERVATION]** |
| Keep object at 12 cm; turn the knob fully each way | A3 value and beep interval change | **[ADD OBSERVATION]** |

**[ADD PHOTO: A clear view of your actual complete circuit. Show the Arduino pin connections and the breadboard.]**

**[ADD PHOTOS OR VIDEO: Show the distance ranges and the potentiometer test. Add captions describing what is happening. Use your real circuit rather than a generated wiring illustration as evidence.]**

### My live demonstration

For my live code change, I can change `WARNING_CM` from `17.0` to `30.0`, then upload the modified sketch. With an object about 25 cm away, the expected output changes from red and silent to yellow and beeping. I would keep the other thresholds at 13, 9, and 5 cm so the ranges stay in descending order.

**[AFTER THE DEMO: Replace this plan with a short account of the change you actually demonstrated and what happened.]**

## Technical deep dive: how the ultrasonic sensor measures distance

The [HC-SR04 datasheet, hosted by SparkFun](https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf), describes a trigger pulse of at least 10 microseconds followed by eight cycles of 40 kHz ultrasound. The ECHO pulse width represents the round-trip travel time.

```text
                    outgoing sound
HC-SR04 sensor  ------------------------>  Object
                <------------------------
                       reflected echo

Arduino D11 -> TRIG       ECHO -> Arduino D10
```

Distance is the sound’s travel time multiplied by its speed, divided by two. The division is necessary because the sound travels to the object and returns. The datasheet gives the approximate conversion `microseconds / 58 = centimetres`. For example, an echo pulse lasting 580 microseconds corresponds to about 10 cm.

Its timing diagram recommends measurement cycles longer than 60 milliseconds; my sketch uses 70 milliseconds. It lists a minimum range of about 2 cm, so pressing an object directly against the sensor is not a reliable close-distance test. These specifications helped me connect the component’s physical operation to the timing in my code.

## Collaboration and community

**[PERSONAL DETAIL NEEDED: Use one real classmate interaction here. AI assistance does not replace the assignment’s classmate requirement.]**

While I was working on **[specific problem]**, **[classmate’s name]** helped me by **[describe exactly what they did or said]**. Before that conversation, I thought **[your earlier idea]**. Their explanation or suggestion helped me **[understand something or choose a next step]**, so I then **[specific action you took]**.

**[If you helped the classmate instead, describe their problem, what you actually did, and what happened next. If you have not had this interaction yet, discuss your circuit or their project with a classmate before completing this section.]**

Next time, I plan to ask a classmate to trace one part of my circuit with me before uploading, and offer to do the same for their project. We could compare the physical connections with the pin definitions and explain our reasoning to each other.

## Reflection: applying the project to a real problem

One possible application would be helping a driver judge the distance between a car and a garage wall. A sensor could provide a visual cue and a sound that becomes more urgent as the car approaches the stopping position.

My current classroom build would need more development for that situation. I would need secure mounting, a protective enclosure, dependable power, and warning distances appropriate for a moving vehicle. I would also test different target shapes and materials. For clearer warnings, I would reconsider my reversed colors and use red for the closest range. The system should give a distinct indication when a reading is unavailable, because silence alone could be mistaken for a clear path.

The skill I would rely on most is systematic debugging. This project showed me that the same symptom can have several causes: a light staying off could involve its wiring, the program, the selected distance range, or a missing sensor reading. I would continue by testing one part at a time and recording the conditions and results.

My next investigation question is: **“I wonder how using the potentiometer to adjust the warning distance, instead of the beep speed, would change the usefulness of my parking sensor.”** I could compare the two versions and ask someone to try setting each one for a particular stopping distance.

## My current code

This is the saved version with the reversed LED order and A3 diagnostic output. It includes no four-digit display. The [Arduino sketch is also available separately](arduino/parking_sensor/parking_sensor.ino).

```cpp
// Parking sensor: HC-SR04, three LEDs, and a two-pin ACTIVE buzzer.
// Each LED: Arduino pin -> 1 kOhm resistor -> anode; cathode -> GND.
// Sensor: VCC -> 5V, GND -> GND, TRIG -> D11, ECHO -> D10.
// Buzzer: + -> D3, - -> GND. No display or extra libraries required.
// Potentiometer: middle/wiper -> A3; outer terminals -> 5V and GND.
// Adjusts beep speed for the active buzzer; does not change pitch.

const int TRIG_PIN = 11;
const int ECHO_PIN = 10;
const int BUZZER_PIN = 3;
const int GREEN_PIN = 6;
const int YELLOW_PIN = 5;
const int RED_PIN = 4;
const int POT_PIN = A3;

const float WARNING_CM = 17.0;
const float MEDIUM_CM = 13.0;
const float FAST_CM = 9.0;
const float STOP_CM = 5.0;

const unsigned long MEASURE_INTERVAL_MS = 70;
const unsigned long BEEP_DURATION_MS = 100;

float distanceCm = -1;
int potValue = 0;
unsigned long lastMeasureTime = 0;
unsigned long beepStartTime = 0;
bool buzzerOn = false;
int previousLevel = -2;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 25000UL);
  if (duration == 0) return -1; // No echo: reading unavailable.
  return duration / 58.0;
}

void updateOutputs() {
  unsigned long now = millis();
  int level;

  if (distanceCm < 0) level = -1;
  else if (distanceCm > WARNING_CM) level = 0;
  else if (distanceCm > MEDIUM_CM) level = 1;
  else if (distanceCm > FAST_CM) level = 2;
  else if (distanceCm > STOP_CM) level = 3;
  else level = 4;

  // Far (>17 cm): red; middle (>9 to 17 cm): yellow; close (<=9 cm): green.
  // No echo turns all three off.
  digitalWrite(GREEN_PIN, level >= 3 ? HIGH : LOW);
  digitalWrite(YELLOW_PIN, (level == 1 || level == 2) ? HIGH : LOW);
  digitalWrite(RED_PIN, level == 0 ? HIGH : LOW);

  // Start a fresh beep immediately whenever the warning level changes.
  if (level != previousLevel) {
    previousLevel = level;
    beepStartTime = now;
    buzzerOn = level > 0;
    digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);
  }

  if (level <= 0) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    return;
  }
  if (level == 4) {
    digitalWrite(BUZZER_PIN, HIGH); // Continuous sound at <= 5 cm.
    return;
  }

  // Time between the starts of successive beeps.
  unsigned long interval = (level == 1) ? 800UL :
                           (level == 2) ? 400UL : 180UL;

  // Scale the interval from 50% (faster) to 200% (slower).
  // A reading near 0 is faster; a reading near 1023 is slower.
  unsigned long speedPercent = map(potValue, 0, 1023, 50, 200);
  interval = interval * speedPercent / 100UL;
  // Keep an audible gap after each 100 ms beep.
  if (interval < 150UL) interval = 150UL;

  if (buzzerOn && now - beepStartTime >= BEEP_DURATION_MS) {
    buzzerOn = false;
    digitalWrite(BUZZER_PIN, LOW);
  }
  if (!buzzerOn && now - beepStartTime >= interval) {
    beepStartTime = now;
    buzzerOn = true;
    digitalWrite(BUZZER_PIN, HIGH);
  }
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(POT_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(YELLOW_PIN, LOW);
  digitalWrite(RED_PIN, LOW);
  Serial.begin(9600);
}

void loop() {
  unsigned long now = millis();
  if (now - lastMeasureTime >= MEASURE_INTERVAL_MS) {
    lastMeasureTime = now;
    potValue = analogRead(POT_PIN);
    distanceCm = readDistanceCm();
    Serial.print("A3: ");
    Serial.print(potValue);
    Serial.print(" | ");
    if (distanceCm < 0) {
      Serial.println("No echo");
    } else {
      Serial.print("Distance: ");
      Serial.print(distanceCm, 1);
      Serial.println(" cm");
    }
  }
  updateOutputs();
}
```
