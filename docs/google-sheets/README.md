# GrowPod → Google Sheets Sync

Pulls sensor history from Firebase into Google Sheets every 5 minutes, with auto-generated charts.

## What You Get

- **Box 1 / Box 2** tabs — every 5-minute reading archived permanently per device (beyond Firebase's 7-day limit)
- **Dashboard** tab — 4 line charts per device: temperature, humidity, CO2, soil moisture
- **Sync Log** tab — tracks each sync run for debugging

## Setup

### 1. Create a Google Sheet

Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet. Name it **GrowPod Sensor Data** (or whatever you like).

### 2. Open Apps Script Editor

**Extensions → Apps Script**

Delete the default empty `Code.gs` content.

### 3. Add the Script Files

Create 3 files in the Apps Script editor and paste the contents from this folder:

| Apps Script File | Source File |
|-----------------|-------------|
| `Config.gs` | `Config.gs` from this folder |
| `FirebaseApi.gs` | `FirebaseApi.gs` from this folder |
| `Code.gs` | `Code.gs` from this folder |

To create a new file: click the **+** next to "Files" → Script.

### 4. Add Your Firebase Credentials

Open `Config.gs` in the Apps Script editor and replace the placeholder values:

```javascript
var FIREBASE_API_KEY = 'your-actual-api-key';
var FIREBASE_DB_URL = 'https://your-project.firebasedatabase.app';
```

Find these in the **Firebase Console**:
- API Key: Project Settings → General
- Database URL: Realtime Database → the URL shown at the top of the data viewer

### 5. Add Firebase Database Index

In the Firebase Console → Realtime Database → **Rules** tab, add an index for the timestamp field. Your rules should include:

```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        ".read": "now < 1776034800000",
        ".write": "now < 1776034800000",
        "history": {
          ".indexOn": ["timestamp"]
        }
      }
    }
  }
}
```

The `$deviceId` wildcard applies rules to all devices (growpod-001, growpod-002, etc.).

### 6. Initialize

In the Apps Script editor:
1. Select `initializeSheets` from the function dropdown
2. Click **Run**
3. Authorize the script when prompted (it needs access to your spreadsheet and external URLs)

### 7. Test

Go back to your spreadsheet. You should see a **GrowPod** menu in the menu bar.

Click **GrowPod → Sync Now**

If your GrowPod has been running, data should appear in the Raw Data tab.

### 8. Enable Auto-Sync

Click **GrowPod → Setup Auto-Sync (every 5 min)**

This creates a time-based trigger that runs automatically, even when the spreadsheet is closed.

### 9. Create Charts

Click **GrowPod → Create Charts**

Four charts will appear on the Dashboard tab. They update automatically as new data comes in.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Firebase auth failed" | Check your API key in Config.gs |
| "Firebase fetch failed" | Check your database URL and that the `.indexOn` rule is set |
| No data appearing | Make sure your GrowPod is powered on and connected to WiFi |
| Charts empty | Run Sync Now first, then Create Charts |
| Duplicate data | This shouldn't happen — the script tracks the last synced timestamp. If it does, check the Sync Log tab for errors |

## Live Spreadsheet

[GrowPod Sensor Data — Google Sheets](https://docs.google.com/spreadsheets/d/16Uj3nkPxtSvAotGiAM5ukxuNRrnNfvcEy2KyonCSsRY/edit)

## Updating Charts

If you want to refresh the chart ranges after accumulating more data, just run **GrowPod → Create Charts** again. It removes old charts and creates new ones with the full data range.
