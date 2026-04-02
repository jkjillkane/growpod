#include "alerts.h"
#include "config.h"
#include "firebase-sync.h"

static float threshTempMin = DEFAULT_TEMP_MIN;
static float threshTempMax = DEFAULT_TEMP_MAX;
static float threshHumidityMin = DEFAULT_HUMIDITY_MIN;
static float threshHumidityMax = DEFAULT_HUMIDITY_MAX;
static int threshMoisture = DEFAULT_MOISTURE_THRESHOLD;
static int threshCo2Max = DEFAULT_CO2_MAX;

// Cooldown: don't spam the same alert type within 5 minutes
static unsigned long lastAlertTime[6] = {0};
static const unsigned long ALERT_COOLDOWN = 300000; // 5 minutes

bool canAlert(int index) {
  if (millis() - lastAlertTime[index] > ALERT_COOLDOWN) {
    lastAlertTime[index] = millis();
    return true;
  }
  return false;
}

int checkThresholds(SensorData data) {
  int alertCount = 0;

  // Skip checks if sensors aren't ready or returning errors
  if (data.temperature < 0 || data.humidity < 0) return 0;

  // Temperature too high
  if (data.temperature > threshTempMax && canAlert(0)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "Temperature %.1f°C exceeds %.1f°C", data.temperature, threshTempMax);
    pushAlert("temperature_high", data.temperature, threshTempMax, msg);
    alertCount++;
  }

  // Temperature too low
  if (data.temperature < threshTempMin && canAlert(1)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "Temperature %.1f°C below %.1f°C", data.temperature, threshTempMin);
    pushAlert("temperature_low", data.temperature, threshTempMin, msg);
    alertCount++;
  }

  // Humidity too high
  if (data.humidity > threshHumidityMax && canAlert(2)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "Humidity %.1f%% exceeds %.1f%%", data.humidity, threshHumidityMax);
    pushAlert("humidity_high", data.humidity, threshHumidityMax, msg);
    alertCount++;
  }

  // Humidity too low
  if (data.humidity < threshHumidityMin && canAlert(3)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "Humidity %.1f%% below %.1f%%", data.humidity, threshHumidityMin);
    pushAlert("humidity_low", data.humidity, threshHumidityMin, msg);
    alertCount++;
  }

  // Soil too dry
  if (data.soilMoisture < threshMoisture && canAlert(4)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "Soil moisture %d%% below %d%%", data.soilMoisture, threshMoisture);
    pushAlert("moisture_low", data.soilMoisture, threshMoisture, msg);
    alertCount++;
  }

  // CO2 too high
  if (data.co2 > threshCo2Max && data.sensorsReady && canAlert(5)) {
    char msg[96];
    snprintf(msg, sizeof(msg), "CO2 %d ppm exceeds %d ppm", data.co2, threshCo2Max);
    pushAlert("co2_high", data.co2, threshCo2Max, msg);
    alertCount++;
  }

  return alertCount;
}

void updateThresholds(float tMin, float tMax, float hMin, float hMax,
                      int moisture, int co2Max) {
  threshTempMin = tMin;
  threshTempMax = tMax;
  threshHumidityMin = hMin;
  threshHumidityMax = hMax;
  threshMoisture = moisture;
  threshCo2Max = co2Max;
  Serial.println("[Alerts] Thresholds updated");
}
