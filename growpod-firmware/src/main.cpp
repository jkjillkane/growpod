// ============================================
// GrowPod - Smart Microgreen Grow Chamber
// ESP32 Firmware - Main Entry Point
// ============================================
//
// This firmware reads sensors, controls actuators,
// serves a local REST API, and syncs with Firebase.
// ============================================

#include <WiFi.h>
#include <ESPmDNS.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "config.h"
#include "sensors.h"
#include "actuators.h"
#include "web-server.h"
#include "firebase-sync.h"
#include "scheduler.h"
#include "alerts.h"

// Timing trackers
unsigned long lastSensorRead = 0;
unsigned long lastFirebasePush = 0;
unsigned long lastHistoryLog = 0;
unsigned long lastCommandPoll = 0;
unsigned long lastScheduleCheck = 0;
unsigned long lastHistoryCleanup = 0;

// Latest sensor data
SensorData sensorData;

void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setTxPower(WIFI_POWER_8_5dBm); // Reduce TX power to prevent brownout

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connected!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WiFi] FAILED to connect — check SSID and password in config.h");
  }
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("========================================");
  Serial.println("  GrowPod - Smart Microgreen Chamber");
  Serial.println("  Firmware v1.0");
  Serial.println("========================================");
  Serial.println();

  // 1. Connect to WiFi
  connectWiFi();

  // 1b. Start mDNS so the app can find this box by name
  if (WiFi.status() == WL_CONNECTED) {
    if (MDNS.begin(DEVICE_ID)) {
      Serial.println("[mDNS] Hostname: " + String(DEVICE_ID) + ".local");
    } else {
      Serial.println("[mDNS] Failed to start");
    }
  }

  // 2. Initialize all hardware
  initSensors();
  initActuators();

  // 3. Start local REST API
  initWebServer();

  // 4. Connect to Firebase (only if WiFi is connected)
  if (WiFi.status() == WL_CONNECTED) {
    initFirebase();
    initScheduler();
  } else {
    Serial.println("[Setup] Skipping Firebase + NTP — no WiFi");
  }

  Serial.println();
  Serial.println("[Setup] Complete — entering main loop");
  Serial.println("========================================");
}

void loop() {
  unsigned long now = millis();

  // Handle pump timer (non-blocking)
  updatePumpTimer();

  // --- Read sensors every 5 seconds ---
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = now;
    sensorData = readAllSensors();

    // Update the web server's cached data
    updateWebServerData(sensorData, getActuatorState());

    // Print to serial for debugging
    Serial.printf("[Sensors] Temp: %.1f°C | Humidity: %.1f%% | CO2: %d ppm | Moisture: %d%%\n",
      sensorData.temperature, sensorData.humidity,
      sensorData.co2, sensorData.soilMoisture);
  }

  // --- Push to Firebase every 10 seconds ---
  if (now - lastFirebasePush >= FIREBASE_PUSH_INTERVAL) {
    lastFirebasePush = now;
    ActuatorState state = getActuatorState();
    pushCurrentData(sensorData, state.lightsOn, state.pumpOn);

    // Check thresholds and push alerts
    int alerts = checkThresholds(sensorData);
    if (alerts > 0) {
      Serial.printf("[Alerts] %d alert(s) triggered\n", alerts);
    }
  }

  // --- Log history every 5 minutes ---
  if (now - lastHistoryLog >= HISTORY_LOG_INTERVAL) {
    lastHistoryLog = now;
    logHistory(sensorData);
  }

  // --- Poll Firebase commands + settings every 5 seconds ---
  if (now - lastCommandPoll >= COMMAND_POLL_INTERVAL) {
    lastCommandPoll = now;
    pollCommands();
    pollSettings();
  }

  // --- Check light schedule every 30 seconds ---
  if (now - lastScheduleCheck >= 30000) {
    lastScheduleCheck = now;
    bool lightsShould = shouldLightsBeOn();
    ActuatorState current = getActuatorState();
    if (lightsShould != current.lightsOn) {
      setLights(lightsShould);
      Serial.println("[Scheduler] Lights auto-" + String(lightsShould ? "ON" : "OFF"));
    }
  }

  // --- Cleanup old history once per hour ---
  if (now - lastHistoryCleanup >= 3600000) {
    lastHistoryCleanup = now;
    cleanupHistory();
  }

  // --- Reconnect WiFi if disconnected (non-blocking, every 10s) ---
  static unsigned long lastWiFiCheck = 0;
  if (now - lastWiFiCheck >= 10000) {
    lastWiFiCheck = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost — attempting reconnect...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}
