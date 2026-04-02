#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Holds all sensor readings in one place
struct SensorData {
  float temperature;    // Celsius
  float humidity;       // Percentage
  uint16_t co2;         // ppm
  uint16_t tvoc;        // ppb
  int soilMoisture;     // 0-100%
  bool sensorsReady;    // false during ENS160 warm-up
};

// Set up all sensor pins and libraries
void initSensors();

// Read all sensors and return a SensorData struct
SensorData readAllSensors();

#endif
