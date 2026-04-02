#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include <ESPAsyncWebServer.h>
#include "sensors.h"
#include "actuators.h"

// Start the local REST API server on port 80
void initWebServer();

// Update the cached sensor data (call after each sensor read)
void updateWebServerData(SensorData data, ActuatorState actuators);

#endif
