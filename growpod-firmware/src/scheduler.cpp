#include "scheduler.h"
#include "config.h"
#include <time.h>

static int scheduleOnHour = DEFAULT_LIGHT_ON_HOUR;
static int scheduleOnMinute = DEFAULT_LIGHT_ON_MINUTE;
static int scheduleOffHour = DEFAULT_LIGHT_OFF_HOUR;
static int scheduleOffMinute = DEFAULT_LIGHT_OFF_MINUTE;

void initScheduler() {
  // Sync time with NTP server
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);
  Serial.println("[Scheduler] NTP time sync started");

  // Wait for time to be set (up to 10 seconds)
  struct tm timeinfo;
  int retries = 0;
  while (!getLocalTime(&timeinfo) && retries < 10) {
    Serial.println("[Scheduler] Waiting for NTP...");
    delay(1000);
    retries++;
  }

  if (retries < 10) {
    Serial.println("[Scheduler] Time synced: " + getCurrentTimeStr());
  } else {
    Serial.println("[Scheduler] WARNING: NTP sync failed — schedule may not work");
  }
}

bool shouldLightsBeOn() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return false; // Can't determine time, default to off
  }

  int currentMinutes = timeinfo.tm_hour * 60 + timeinfo.tm_min;
  int onMinutes = scheduleOnHour * 60 + scheduleOnMinute;
  int offMinutes = scheduleOffHour * 60 + scheduleOffMinute;

  // Handle normal schedule (e.g., 06:00 to 22:00)
  if (onMinutes < offMinutes) {
    return currentMinutes >= onMinutes && currentMinutes < offMinutes;
  }
  // Handle overnight schedule (e.g., 22:00 to 06:00)
  else {
    return currentMinutes >= onMinutes || currentMinutes < offMinutes;
  }
}

void updateLightSchedule(int onHour, int onMinute, int offHour, int offMinute) {
  scheduleOnHour = onHour;
  scheduleOnMinute = onMinute;
  scheduleOffHour = offHour;
  scheduleOffMinute = offMinute;
  Serial.printf("[Scheduler] Updated: ON %02d:%02d, OFF %02d:%02d\n",
    onHour, onMinute, offHour, offMinute);
}

String getCurrentTimeStr() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown";

  char buf[20];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}
