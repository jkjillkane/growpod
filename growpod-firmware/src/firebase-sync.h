#ifndef FIREBASE_SYNC_H
#define FIREBASE_SYNC_H

#include "sensors.h"

// Initialize Firebase connection
void initFirebase();

// Push current sensor data to /devices/{id}/current
void pushCurrentData(SensorData data, bool lightsOn, bool pumpOn);

// Append a history data point to /devices/{id}/history/{timestamp}
void logHistory(SensorData data);

// Push an alert to /devices/{id}/alerts/{timestamp}
void pushAlert(const char* type, float value, float threshold, const char* message);

// Poll /devices/{id}/commands and execute any pending commands
void pollCommands();

// Poll /devices/{id}/settings and update thresholds
void pollSettings();

// Delete history entries older than 7 days
void cleanupHistory();

// Check if Firebase is connected
bool isFirebaseReady();

#endif
