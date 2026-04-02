#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <Arduino.h>

// Initialize NTP time sync
void initScheduler();

// Check if lights should be on based on current time and schedule
// Returns true if lights should be on
bool shouldLightsBeOn();

// Update the light schedule (called when settings change)
void updateLightSchedule(int onHour, int onMinute, int offHour, int offMinute);

// Get current time as a formatted string (for debugging)
String getCurrentTimeStr();

#endif
