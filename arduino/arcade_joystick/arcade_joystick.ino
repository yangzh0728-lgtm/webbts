// Joystick Arcade: Uno / classic Nano, KY-023 joystick, optional passive piezo.
// Wiring: VRx -> A0, VRy -> A1, SW -> D7, +5V -> 5V, GND -> GND.
// Buzzer: + -> D8, - -> GND. Serial: 115200 baud, newline-terminated messages.
#include <Arduino.h>
#include <string.h>

const uint8_t PIN_X = A0;
const uint8_t PIN_Y = A1;
const uint8_t PIN_BUTTON = 7;
const uint8_t PIN_BUZZER = 8;
const unsigned long REPORT_MS = 20;
const unsigned long DEBOUNCE_MS = 25;

char inbox[16];
uint8_t inboxLength = 0;
bool discardCommand = false;
unsigned long lastReport = 0;
unsigned long buttonChanged = 0;
bool lastButtonReading = false;
bool stableButton = false;

const unsigned int winNotes[] = {523, 659, 784, 1047};
bool melodyPlaying = false;
uint8_t melodyNote = 0;
unsigned long lastNote = 0;

void handleCommand(const char *command, unsigned long now) {
  // A short click cannot interrupt a result melody.
  if (strcmp(command, "BEEP") == 0) {
    if (!melodyPlaying) tone(PIN_BUZZER, 880, 60);
  } else if (strcmp(command, "WIN") == 0) {
    melodyPlaying = true;
    melodyNote = 0;
    lastNote = now;
    tone(PIN_BUZZER, winNotes[0], 100);
  } else if (strcmp(command, "LOSE") == 0) {
    melodyPlaying = false;
    tone(PIN_BUZZER, 220, 400);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
}

void loop() {
  const unsigned long now = millis();
  const bool reading = digitalRead(PIN_BUTTON) == LOW;
  if (reading != lastButtonReading) {
    lastButtonReading = reading;
    buttonChanged = now;
  }
  if (now - buttonChanged >= DEBOUNCE_MS) stableButton = reading;

  // millis() scheduling keeps reports flowing during all sounds, including WIN.
  if (now - lastReport >= REPORT_MS) {
    lastReport = now;
    Serial.print(analogRead(PIN_X));
    Serial.print(',');
    Serial.print(analogRead(PIN_Y));
    Serial.print(',');
    Serial.println(stableButton ? 1 : 0);
  }

  // Bound work per loop; an oversized or unfinished command cannot block reports.
  uint8_t budget = 32;
  while (budget-- > 0 && Serial.available() > 0) {
    const char character = Serial.read();
    if (character == '\n') {
      if (!discardCommand) {
        inbox[inboxLength] = '\0';
        handleCommand(inbox, now);
      }
      inboxLength = 0;
      discardCommand = false;
    } else if (character != '\r' && !discardCommand) {
      if (inboxLength < sizeof(inbox) - 1) inbox[inboxLength++] = character;
      else discardCommand = true;
    }
  }

  if (melodyPlaying && now - lastNote >= 120) {
    lastNote = now;
    ++melodyNote;
    if (melodyNote < 4) tone(PIN_BUZZER, winNotes[melodyNote], 100);
    else melodyPlaying = false;
  }
}
