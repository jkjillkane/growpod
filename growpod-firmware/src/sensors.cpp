#include "sensors.h"
#include "config.h"
#include <DHT.h>
#include <Wire.h>
#include <ScioSense_ENS160.h>
#include <Adafruit_AHTX0.h>

// Sensor instances
DHT dht(DHT_PIN, DHT22);
ScioSense_ENS160 ens160(ENS160_I2CADDR_1); // Default I2C address 0x53
Adafruit_AHTX0 aht;
static bool ahtFound = false;

void initSensors() {
  // SEN0193 — soil moisture (analog input, no init needed)
  analogSetAttenuation(ADC_11db); // Full range 0-3.3V
  Serial.println("[Sensors] SEN0193 (soil moisture) on GPIO " + String(SOIL_MOISTURE_PIN));

  // ENS160 — CO2 and TVOC over I2C
  Wire.begin(ENS160_SDA, ENS160_SCL);
  if (ens160.begin()) {
    Serial.println("[Sensors] ENS160 initialized on I2C");
    ens160.setMode(ENS160_OPMODE_STD); // Standard operation mode
  } else {
    Serial.println("[Sensors] WARNING: ENS160 not found — check wiring");
  }

  // AHT21 — temperature and humidity (on same I2C bus as ENS160)
  if (aht.begin()) {
    ahtFound = true;
    Serial.println("[Sensors] AHT21 found on I2C — using for temp/humidity");
  } else {
    Serial.println("[Sensors] AHT21 not found — falling back to DHT22");
    dht.begin();
    Serial.println("[Sensors] DHT22 initialized on GPIO " + String(DHT_PIN));
  }
}

SensorData readAllSensors() {
  SensorData data;

  // Read temperature and humidity from AHT21 (preferred) or DHT22 (fallback)
  if (ahtFound) {
    sensors_event_t humEvent, tempEvent;
    aht.getEvent(&humEvent, &tempEvent);
    data.temperature = tempEvent.temperature + TEMP_OFFSET;
    data.humidity = humEvent.relative_humidity + HUMIDITY_OFFSET;
  } else {
    data.temperature = dht.readTemperature();
    data.humidity = dht.readHumidity();
  }

  // Check for failed reads
  if (isnan(data.temperature)) data.temperature = -1;
  if (isnan(data.humidity)) data.humidity = -1;

  // Read soil moisture — map ADC to percentage
  int rawMoisture = analogRead(SOIL_MOISTURE_PIN);
  data.soilMoisture = map(
    constrain(rawMoisture, SOIL_WET_VALUE, SOIL_DRY_VALUE),
    SOIL_DRY_VALUE, SOIL_WET_VALUE,
    0, 100
  );

  // Read ENS160
  if (ens160.available()) {
    ens160.measure(true);
    data.co2 = ens160.geteCO2();
    data.tvoc = ens160.getTVOC();
    data.sensorsReady = true;
  } else {
    data.co2 = 0;
    data.tvoc = 0;
    data.sensorsReady = false;
  }

  return data;
}
