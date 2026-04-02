#include "actuators.h"
#include "config.h"

static bool lightsOn = false;
static bool pumpOn = false;
static unsigned long pumpStartTime = 0;
static unsigned long pumpDurationMs = 0;
static bool pumpTimerActive = false;

void initActuators() {
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(RELAY_LIGHTS, OUTPUT);

  // Start with everything off (relays are typically active LOW)
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(RELAY_LIGHTS, HIGH);

  Serial.println("[Actuators] Pump relay on GPIO " + String(RELAY_PUMP));
  Serial.println("[Actuators] Lights relay on GPIO " + String(RELAY_LIGHTS));
}

void setLights(bool on) {
  lightsOn = on;
  // Most relay modules are active LOW
  digitalWrite(RELAY_LIGHTS, on ? LOW : HIGH);
  Serial.println("[Actuators] Lights " + String(on ? "ON" : "OFF"));
}

void setPump(bool on) {
  pumpOn = on;
  digitalWrite(RELAY_PUMP, on ? LOW : HIGH);
  Serial.println("[Actuators] Pump " + String(on ? "ON" : "OFF"));
}

void startPumpTimer(int seconds) {
  // Cap at 60s to prevent accidental flooding
  if (seconds > 60) seconds = 60;
  setPump(true);
  pumpStartTime = millis();
  pumpDurationMs = seconds * 1000UL;
  pumpTimerActive = true;
  Serial.println("[Actuators] Pump timer started: " + String(seconds) + "s");
}

void updatePumpTimer() {
  // Uses elapsed time instead of target time — safe against millis() overflow
  if (pumpTimerActive && (millis() - pumpStartTime >= pumpDurationMs)) {
    setPump(false);
    pumpTimerActive = false;
    Serial.println("[Actuators] Pump timer finished");
  }
}

ActuatorState getActuatorState() {
  return { lightsOn, pumpOn };
}
