#ifndef ALERTS_H
#define ALERTS_H

#include "sensors.h"

// Check all sensor readings against thresholds
// Calls pushAlert() for any that are out of range
// Returns the number of alerts triggered
int checkThresholds(SensorData data);

// Update thresholds (called when settings change)
void updateThresholds(float tMin, float tMax, float hMin, float hMax,
                      int moisture, int co2Max);

#endif
