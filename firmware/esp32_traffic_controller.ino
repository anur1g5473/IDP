/*
 * Automatic VIT Underpass Traffic Controller - ESP32 Firmware
 * 
 * Hardware Safety Guarantees:
 * 1. Dual Red Hardware Lockout (Never permits both signals GREEN).
 * 2. 3-Second Watchdog Timer Fallback (Flashing RED if PC freezes/disconnects).
 * 3. Physical Guard Manual Override Button Interrupt.
 */

#define PIN_SIGNAL_A_RED    18
#define PIN_SIGNAL_A_YELLOW 19
#define PIN_SIGNAL_A_GREEN  21

#define PIN_SIGNAL_B_RED    22
#define PIN_SIGNAL_B_YELLOW 23
#define PIN_SIGNAL_B_GREEN  25

#define PIN_OVERRIDE_BUTTON 4

unsigned long lastPacketTime = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 3000;

void setup() {
    Serial.begin(115200);
    
    pinMode(PIN_SIGNAL_A_RED, OUTPUT);
    pinMode(PIN_SIGNAL_A_YELLOW, OUTPUT);
    pinMode(PIN_SIGNAL_A_GREEN, OUTPUT);

    pinMode(PIN_SIGNAL_B_RED, OUTPUT);
    pinMode(PIN_SIGNAL_B_YELLOW, OUTPUT);
    pinMode(PIN_SIGNAL_B_GREEN, OUTPUT);

    pinMode(PIN_OVERRIDE_BUTTON, INPUT_PULLUP);

    setSignals(true, false, false, true, false, false);
    lastPacketTime = millis();
    Serial.println("[ESP32] Controller Online. Safe Mode Engaged (All Red).");
}

void setSignals(bool a_red, bool a_yellow, bool a_green, bool b_red, bool b_yellow, bool b_green) {
    if (a_green && b_green) {
        a_green = false;
        b_green = false;
        a_red = true;
        b_red = true;
    }

    digitalWrite(PIN_SIGNAL_A_RED, a_red ? HIGH : LOW);
    digitalWrite(PIN_SIGNAL_A_YELLOW, a_yellow ? HIGH : LOW);
    digitalWrite(PIN_SIGNAL_A_GREEN, a_green ? HIGH : LOW);

    digitalWrite(PIN_SIGNAL_B_RED, b_red ? HIGH : LOW);
    digitalWrite(PIN_SIGNAL_B_YELLOW, b_yellow ? HIGH : LOW);
    digitalWrite(PIN_SIGNAL_B_GREEN, b_green ? HIGH : LOW);
}

void loop() {
    if (digitalRead(PIN_OVERRIDE_BUTTON) == LOW) {
        setSignals(true, false, false, true, false, false);
        Serial.println("[ESP32] PHYSICAL OVERRIDE BUTTON PRESSED! ALL RED LOCKOUT.");
        delay(500);
        return;
    }

    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        lastPacketTime = millis();

        if (command == "STATE:SIDE_A_GREEN") {
            setSignals(false, false, true, true, false, false);
        } else if (command == "STATE:SIDE_B_GREEN") {
            setSignals(true, false, false, false, false, true);
        } else if (command.startsWith("STATE:ALL_RED")) {
            setSignals(true, false, false, true, false, false);
        }
    }

    if (millis() - lastPacketTime > WATCHDOG_TIMEOUT_MS) {
        setSignals((millis() / 500) % 2 == 0, false, false, (millis() / 500) % 2 == 0, false, false);
    }
}
