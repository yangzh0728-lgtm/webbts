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
