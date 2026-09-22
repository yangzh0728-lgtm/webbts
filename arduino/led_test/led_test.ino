// Temporary wiring test. Restore parking_sensor.ino after diagnosing LEDs.
// Green D6, yellow D5, red D4. Each LED needs its own 1 kOhm resistor.
const int LED_PINS[] = {6, 5, 4};
const char* LED_NAMES[] = {"GREEN D6", "YELLOW D5", "RED D4"};

void setup() {
  Serial.begin(9600);
  pinMode(3, OUTPUT);
  digitalWrite(3, LOW); // Silence active buzzer during test.
  pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < 3; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
  }
}

void loop() {
  for (int i = 0; i < 3; i++) {
    Serial.print("Testing: ");
    Serial.println(LED_NAMES[i]);
    digitalWrite(LED_BUILTIN, HIGH);
    digitalWrite(LED_PINS[i], HIGH);
    delay(2000);
    digitalWrite(LED_PINS[i], LOW);
    digitalWrite(LED_BUILTIN, LOW);
    delay(500);
  }
}
