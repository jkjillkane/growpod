#ifndef ACTUATORS_H
#define ACTUATORS_H

#include <Arduino.h>

// Current state of actuators
struct ActuatorState {
  bool lightsOn;
  bool pumpOn;
};

// Set up relay pins
void initActuators();

// Turn lights on or off
void setLights(bool on);

// Turn pump on or off
void setPump(bool on);

// Run pump for a set number of seconds (non-blocking)
void startPumpTimer(int seconds);

// Call this in loop() to handle pump timer
void updatePumpTimer();

// Get current actuator state
ActuatorState getActuatorState();

#endif
