// ============================================
// GrowPod Google Sheets Sync — Main
// ============================================

// --------------- Menu ---------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('GrowPod')
    .addItem('Sync All Devices', 'syncFromFirebase')
    .addSeparator()
    .addItem('Setup Auto-Sync (every 5 min)', 'setupTrigger')
    .addItem('Remove Auto-Sync', 'removeTrigger')
    .addSeparator()
    .addItem('Create Charts', 'createCharts')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addToUi();
}

// --------------- Sheet Setup ---------------

function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create a data tab for each device
  for (var d = 0; d < DEVICES.length; d++) {
    var device = DEVICES[d];
    var sheet = getOrCreateSheet(ss, device.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Temperature (C)', 'Humidity (%)', 'CO2 (ppm)', 'Soil Moisture (%)', 'Firebase Key']);
      sheet.getRange('A1:F1').setFontWeight('bold');
      sheet.setColumnWidth(1, 160);
      sheet.setFrozenRows(1);
    }
  }

  // Dashboard tab
  getOrCreateSheet(ss, 'Dashboard');

  // Sync Log tab
  var log = getOrCreateSheet(ss, 'Sync Log');
  if (log.getLastRow() === 0) {
    log.appendRow(['Sync Time', 'Device', 'Records Pulled', 'Status', 'Notes']);
    log.getRange('A1:E1').setFontWeight('bold');
    log.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert('Sheets initialized for ' + DEVICES.length + ' devices. You can now run Sync All Devices.');
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// --------------- Sync ---------------

function syncFromFirebase() {
  var props = PropertiesService.getScriptProperties();
  var syncTime = new Date();

  for (var d = 0; d < DEVICES.length; d++) {
    var device = DEVICES[d];
    syncDevice(device, props, syncTime);
  }
}

function syncDevice(device, props, syncTime) {
  // Each device tracks its own last-synced timestamp
  var propKey = 'lastSyncTimestamp_' + device.id;
  var lastTs = parseInt(props.getProperty(propKey) || '0', 10);

  try {
    var entries = fetchNewHistory(device.id, lastTs);

    if (entries.length === 0) {
      logSync(syncTime, device.name, 0, 'OK', 'No new data');
      return;
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(device.name);
    if (!sheet) {
      throw new Error(device.name + ' sheet not found. Run Initialize Sheets first.');
    }

    // Build rows in bulk for performance
    var rows = [];
    var highestTs = lastTs;

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var ts = e.timestamp || 0;
      if (ts <= lastTs) continue;

      rows.push([
        new Date(ts),
        e.temperature || '',
        e.humidity || '',
        e.co2 || '',
        e.soilMoisture || '',
        e._firebaseKey || ''
      ]);

      if (ts > highestTs) highestTs = ts;
    }

    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
      props.setProperty(propKey, String(highestTs));
    }

    logSync(syncTime, device.name, rows.length, 'OK', '');
  } catch (err) {
    logSync(syncTime, device.name, 0, 'ERROR', err.message);
    Logger.log('Sync error (' + device.name + '): ' + err.message);
  }
}

function logSync(time, deviceName, count, status, notes) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sync Log');
  if (sheet) {
    sheet.appendRow([time, deviceName, count, status, notes]);
  }
}

// --------------- Triggers ---------------

function setupTrigger() {
  removeTrigger();

  ScriptApp.newTrigger('syncFromFirebase')
    .timeBased()
    .everyMinutes(5)
    .create();

  SpreadsheetApp.getUi().alert('Auto-sync enabled for all devices. Data will sync every 5 minutes.');
}

function removeTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncFromFirebase') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// --------------- Charts ---------------

function createCharts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dashboard = ss.getSheetByName('Dashboard');

  if (!dashboard) {
    SpreadsheetApp.getUi().alert('Run Initialize Sheets first.');
    return;
  }

  // Clear existing charts
  var existingCharts = dashboard.getCharts();
  for (var i = 0; i < existingCharts.length; i++) {
    dashboard.removeChart(existingCharts[i]);
  }

  // Chart definitions: [title, dataColumn (1-indexed), color]
  var metrics = [
    ['Temperature (C)',    2, '#E74C3C'],
    ['Humidity (%)',        3, '#3498DB'],
    ['CO2 (ppm)',           4, '#9B59B6'],
    ['Soil Moisture (%)',   5, '#27AE60']
  ];

  // Each device gets a row of 4 charts
  // Device 0 → rows 1-19, Device 1 → rows 21-39, etc.
  for (var d = 0; d < DEVICES.length; d++) {
    var device = DEVICES[d];
    var dataSheet = ss.getSheetByName(device.name);

    if (!dataSheet || dataSheet.getLastRow() < 2) continue;

    var lastRow = dataSheet.getLastRow();
    var startRow = 1 + (d * 22); // space between device chart rows

    // Add a device label
    dashboard.getRange(startRow, 1).setValue(device.name).setFontWeight('bold').setFontSize(14);

    for (var m = 0; m < metrics.length; m++) {
      var title = metrics[m][0];
      var col = metrics[m][1];
      var color = metrics[m][2];

      // 2 charts per row, 2 rows per device
      var chartRow = startRow + 1 + (m < 2 ? 0 : 10);
      var chartCol = (m % 2 === 0) ? 1 : 9;

      var timeRange = dataSheet.getRange(1, 1, lastRow, 1);
      var dataRange = dataSheet.getRange(1, col, lastRow, 1);

      var chart = dashboard.newChart()
        .setChartType(Charts.ChartType.LINE)
        .addRange(timeRange)
        .addRange(dataRange)
        .setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS)
        .setOption('title', device.name + ' — ' + title)
        .setOption('legend', { position: 'none' })
        .setOption('colors', [color])
        .setOption('hAxis', { title: 'Time', format: 'MMM dd HH:mm' })
        .setOption('vAxis', { title: title })
        .setOption('curveType', 'function')
        .setOption('width', 600)
        .setOption('height', 350)
        .setPosition(chartRow, chartCol, 0, 0)
        .build();

      dashboard.insertChart(chart);
    }
  }

  ss.setActiveSheet(dashboard);
  SpreadsheetApp.getUi().alert('Charts created for ' + DEVICES.length + ' devices.');
}
