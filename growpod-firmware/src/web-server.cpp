#include "web-server.h"
#include "config.h"
#include "actuators.h"
#include "alerts.h"
#include "scheduler.h"
#include <ArduinoJson.h>

AsyncWebServer server(80);

// Cached data for responding to requests
static SensorData cachedSensors;
static ActuatorState cachedActuators;

// Settings stored in memory (persisted via Firebase)
static float tempMin = DEFAULT_TEMP_MIN;
static float tempMax = DEFAULT_TEMP_MAX;
static float humidityMin = DEFAULT_HUMIDITY_MIN;
static float humidityMax = DEFAULT_HUMIDITY_MAX;
static int moistureThreshold = DEFAULT_MOISTURE_THRESHOLD;
static int co2Max = DEFAULT_CO2_MAX;
static int lightOnHour = DEFAULT_LIGHT_ON_HOUR;
static int lightOnMinute = DEFAULT_LIGHT_ON_MINUTE;
static int lightOffHour = DEFAULT_LIGHT_OFF_HOUR;
static int lightOffMinute = DEFAULT_LIGHT_OFF_MINUTE;

// Add CORS headers to every response
void addCorsHeaders(AsyncWebServerResponse *response) {
  // Restrict to your Firebase Hosting domain + localhost for development
  response->addHeader("Access-Control-Allow-Origin", "https://antigravity-67746.web.app");
  response->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response->addHeader("Access-Control-Allow-Headers", "Content-Type");
}

void initWebServer() {
  // Handle CORS preflight for all routes
  server.on("/*", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    AsyncWebServerResponse *response = request->beginResponse(204);
    addCorsHeaders(response);
    request->send(response);
  });

  // GET /api/status — return all sensor readings + actuator states
  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    doc["temperature"] = cachedSensors.temperature;
    doc["humidity"] = cachedSensors.humidity;
    doc["co2"] = cachedSensors.co2;
    doc["tvoc"] = cachedSensors.tvoc;
    doc["soilMoisture"] = cachedSensors.soilMoisture;
    doc["lights"] = cachedActuators.lightsOn;
    doc["pump"] = cachedActuators.pumpOn;
    doc["sensorsReady"] = cachedSensors.sensorsReady;
    doc["uptime"] = millis() / 1000;

    String json;
    serializeJson(doc, json);
    AsyncWebServerResponse *response = request->beginResponse(200, "application/json", json);
    addCorsHeaders(response);
    request->send(response);
  });

  // GET /api/settings — return current thresholds and schedule
  server.on("/api/settings", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    doc["tempMin"] = tempMin;
    doc["tempMax"] = tempMax;
    doc["humidityMin"] = humidityMin;
    doc["humidityMax"] = humidityMax;
    doc["moistureThreshold"] = moistureThreshold;
    doc["co2Max"] = co2Max;

    JsonObject schedule = doc.createNestedObject("lightSchedule");
    char onTime[6], offTime[6];
    sprintf(onTime, "%02d:%02d", lightOnHour, lightOnMinute);
    sprintf(offTime, "%02d:%02d", lightOffHour, lightOffMinute);
    schedule["on"] = onTime;
    schedule["off"] = offTime;

    String json;
    serializeJson(doc, json);
    AsyncWebServerResponse *response = request->beginResponse(200, "application/json", json);
    addCorsHeaders(response);
    request->send(response);
  });

  // POST /api/lights — toggle lights {"on": true/false}
  server.on("/api/lights", HTTP_POST, [](AsyncWebServerRequest *request) {},
    NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<64> doc;
      if (deserializeJson(doc, data, len) == DeserializationError::Ok) {
        bool on = doc["on"] | false;
        setLights(on);
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", "{\"ok\":true}");
        addCorsHeaders(response);
        request->send(response);
      } else {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      }
    }
  );

  // POST /api/pump — trigger pump {"on": true, "duration": 10}
  server.on("/api/pump", HTTP_POST, [](AsyncWebServerRequest *request) {},
    NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<64> doc;
      if (deserializeJson(doc, data, len) == DeserializationError::Ok) {
        bool on = doc["on"] | false;
        int duration = doc["duration"] | DEFAULT_PUMP_DURATION;
        // Cap pump duration to 60 seconds to prevent flooding
        if (duration < 1) duration = 1;
        if (duration > 60) duration = 60;
        if (on) {
          startPumpTimer(duration);
        } else {
          setPump(false);
        }
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", "{\"ok\":true}");
        addCorsHeaders(response);
        request->send(response);
      } else {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      }
    }
  );

  // POST /api/settings — update thresholds and schedule
  server.on("/api/settings", HTTP_POST, [](AsyncWebServerRequest *request) {},
    NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<256> doc;
      if (deserializeJson(doc, data, len) == DeserializationError::Ok) {
        if (doc.containsKey("tempMin")) tempMin = doc["tempMin"];
        if (doc.containsKey("tempMax")) tempMax = doc["tempMax"];
        if (doc.containsKey("humidityMin")) humidityMin = doc["humidityMin"];
        if (doc.containsKey("humidityMax")) humidityMax = doc["humidityMax"];
        if (doc.containsKey("moistureThreshold")) moistureThreshold = doc["moistureThreshold"];
        if (doc.containsKey("co2Max")) co2Max = doc["co2Max"];

        if (doc.containsKey("lightSchedule")) {
          const char* onTime = doc["lightSchedule"]["on"];
          const char* offTime = doc["lightSchedule"]["off"];
          if (onTime) sscanf(onTime, "%d:%d", &lightOnHour, &lightOnMinute);
          if (offTime) sscanf(offTime, "%d:%d", &lightOffHour, &lightOffMinute);
          updateLightSchedule(lightOnHour, lightOnMinute, lightOffHour, lightOffMinute);
        }

        // Propagate thresholds to alert system
        updateThresholds(tempMin, tempMax, humidityMin, humidityMax, moistureThreshold, co2Max);
        Serial.println("[WebServer] Settings updated");
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", "{\"ok\":true}");
        addCorsHeaders(response);
        request->send(response);
      } else {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      }
    }
  );

  server.begin();
  Serial.println("[WebServer] REST API started on port 80");
}

void updateWebServerData(SensorData data, ActuatorState actuators) {
  cachedSensors = data;
  cachedActuators = actuators;
}
