#ifndef CONFIG_H
#define CONFIG_H

// ======================
// WiFi Configuration
// ======================
// Copy this file to config.h and fill in your values
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ======================
// Firebase Configuration
// ======================
#define FIREBASE_API_KEY "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DATABASE_URL "YOUR_DATABASE_URL"

// Unique per box — "growpod-001" for Box 1, "growpod-002" for Box 2, etc.
// Also used as the mDNS hostname ({DEVICE_ID}.local)
#define DEVICE_ID "growpod-001"

// ... (rest of config.h stays the same)

#endif
