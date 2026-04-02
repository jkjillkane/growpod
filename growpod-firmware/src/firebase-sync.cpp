#include "firebase-sync.h"
#include "config.h"
#include "actuators.h"
#include "alerts.h"
#include "scheduler.h"
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>

// Firebase objects
FirebaseData fbData;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

static bool firebaseReady = false;
static String basePath = String("/devices/") + DEVICE_ID;

void initFirebase() {
  Serial.println("[Firebase] Initializing...");

  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;

  // Reduce SSL buffer to save memory
  fbData.setBSSLBufferSize(1024, 1024);

  // Set token status callback for async sign-in
  fbConfig.token_status_callback = [](TokenInfo info) {
    if (info.status == token_status_ready) {
      Serial.println("[Firebase] Token ready — connected!");
      firebaseReady = true;
    } else if (info.status == token_status_error) {
      Serial.println("[Firebase] Token error");
    }
  };

  // Anonymous sign-in
  Serial.println("[Firebase] Signing up anonymously...");
  if (Firebase.signUp(&fbConfig, &fbAuth, "", "")) {
    Serial.println("[Firebase] Sign-up OK");
    firebaseReady = true;
  } else {
    Serial.println("[Firebase] Sign-up failed: " + String(fbConfig.signer.signupError.message.c_str()));
  }

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectNetwork(true);

  Serial.println("[Firebase] Init complete — waiting for token...");
}

void pushCurrentData(SensorData data, bool lightsOn, bool pumpOn) {
  if (!firebaseReady || !Firebase.ready()) return;

  FirebaseJson json;
  json.set("temperature", data.temperature);
  json.set("humidity", data.humidity);
  json.set("co2", data.co2);
  json.set("tvoc", data.tvoc);
  json.set("soilMoisture", data.soilMoisture);
  json.set("lights", lightsOn);
  json.set("pump", pumpOn);
  json.set("timestamp/.sv", "timestamp"); // Server timestamp

  String path = basePath + "/current";
  if (Firebase.RTDB.setJSON(&fbData, path.c_str(), &json)) {
    Serial.println("[Firebase] Current data pushed");
  } else {
    Serial.println("[Firebase] Push failed: " + fbData.errorReason());
  }
}

void logHistory(SensorData data) {
  if (!firebaseReady || !Firebase.ready()) return;

  FirebaseJson json;
  json.set("temperature", data.temperature);
  json.set("humidity", data.humidity);
  json.set("co2", data.co2);
  json.set("soilMoisture", data.soilMoisture);
  json.set("timestamp/.sv", "timestamp");

  String path = basePath + "/history";
  if (Firebase.RTDB.pushJSON(&fbData, path.c_str(), &json)) {
    Serial.println("[Firebase] History logged");
  } else {
    Serial.println("[Firebase] History log failed: " + fbData.errorReason());
  }
}

void pushAlert(const char* type, float value, float threshold, const char* message) {
  if (!firebaseReady || !Firebase.ready()) return;

  FirebaseJson json;
  json.set("type", type);
  json.set("value", value);
  json.set("threshold", threshold);
  json.set("message", message);
  json.set("timestamp/.sv", "timestamp");

  String path = basePath + "/alerts";
  if (Firebase.RTDB.pushJSON(&fbData, path.c_str(), &json)) {
    Serial.println("[Firebase] Alert pushed: " + String(type));
  } else {
    Serial.println("[Firebase] Alert push failed: " + fbData.errorReason());
  }
}

void pollCommands() {
  if (!firebaseReady || !Firebase.ready()) return;

  String path = basePath + "/commands";

  if (Firebase.RTDB.getString(&fbData, path.c_str())) {
    // Parse the raw JSON string with ArduinoJson
    String raw = fbData.stringData();
    if (raw.length() < 5) return; // empty or "null"

    StaticJsonDocument<1024> doc;
    if (deserializeJson(doc, raw) != DeserializationError::Ok) return;

    JsonObject root = doc.as<JsonObject>();
    for (JsonPair kv : root) {
      const char* key = kv.key().c_str();
      JsonObject cmd = kv.value().as<JsonObject>();

      const char* cmdType = cmd["type"] | "";

      if (strcmp(cmdType, "lights") == 0) {
        bool on = cmd["on"] | false;
        setLights(on);
        Serial.println("[Firebase] Command: lights " + String(on ? "ON" : "OFF"));
      }
      else if (strcmp(cmdType, "pump") == 0) {
        bool on = cmd["on"] | false;
        if (on) {
          int dur = cmd["duration"] | DEFAULT_PUMP_DURATION;
          if (dur > 60) dur = 60;
          startPumpTimer(dur);
        } else {
          setPump(false);
        }
        Serial.println("[Firebase] Command: pump");
      }

      // Delete the command after executing
      String cmdPath = path + "/" + String(key);
      Firebase.RTDB.deleteNode(&fbData, cmdPath.c_str());
    }
  }
}

void pollSettings() {
  if (!firebaseReady || !Firebase.ready()) return;

  String path = basePath + "/settings";

  if (Firebase.RTDB.getString(&fbData, path.c_str())) {
    String raw = fbData.stringData();
    if (raw.length() < 5) return;

    StaticJsonDocument<512> doc;
    if (deserializeJson(doc, raw) != DeserializationError::Ok) return;

    float tMin = doc["tempMin"] | (float)DEFAULT_TEMP_MIN;
    float tMax = doc["tempMax"] | (float)DEFAULT_TEMP_MAX;
    float hMin = doc["humidityMin"] | (float)DEFAULT_HUMIDITY_MIN;
    float hMax = doc["humidityMax"] | (float)DEFAULT_HUMIDITY_MAX;
    int moisture = doc["moistureThreshold"] | DEFAULT_MOISTURE_THRESHOLD;
    int co2Max = doc["co2Max"] | DEFAULT_CO2_MAX;

    updateThresholds(tMin, tMax, hMin, hMax, moisture, co2Max);

    if (doc.containsKey("lightSchedule")) {
      const char* onTime = doc["lightSchedule"]["on"];
      const char* offTime = doc["lightSchedule"]["off"];
      int onH = DEFAULT_LIGHT_ON_HOUR, onM = DEFAULT_LIGHT_ON_MINUTE;
      int offH = DEFAULT_LIGHT_OFF_HOUR, offM = DEFAULT_LIGHT_OFF_MINUTE;
      if (onTime) sscanf(onTime, "%d:%d", &onH, &onM);
      if (offTime) sscanf(offTime, "%d:%d", &offH, &offM);
      updateLightSchedule(onH, onM, offH, offM);
    }
  }
}

void cleanupHistory() {
  if (!firebaseReady || !Firebase.ready()) return;

  String path = basePath + "/history";

  if (Firebase.RTDB.getString(&fbData, path.c_str())) {
    String raw = fbData.stringData();
    if (raw.length() < 5) return;

    DynamicJsonDocument doc(8192);
    if (deserializeJson(doc, raw) != DeserializationError::Ok) return;

    JsonObject root = doc.as<JsonObject>();

    // Find newest timestamp as reference
    unsigned long newestTs = 0;
    for (JsonPair kv : root) {
      unsigned long ts = kv.value()["timestamp"] | 0UL;
      if (ts > newestTs) newestTs = ts;
    }

    // Delete entries older than 7 days
    if (newestTs > 604800000UL) {
      unsigned long cutoff = newestTs - 604800000UL;
      int deleted = 0;
      for (JsonPair kv : root) {
        unsigned long ts = kv.value()["timestamp"] | 0UL;
        if (ts > 0 && ts < cutoff) {
          String delPath = path + "/" + String(kv.key().c_str());
          Firebase.RTDB.deleteNode(&fbData, delPath.c_str());
          deleted++;
        }
      }
      if (deleted > 0) {
        Serial.printf("[Firebase] Cleaned up %d old history entries\n", deleted);
      }
    }
  }
}

bool isFirebaseReady() {
  return firebaseReady && Firebase.ready();
}
