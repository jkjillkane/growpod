// ============================================
// GrowPod Google Sheets Sync — Firebase API
// ============================================
// Handles anonymous auth and REST queries against Firebase Realtime Database.

/**
 * Get a valid Firebase anonymous auth token.
 * Caches the token in ScriptProperties and refreshes when expired.
 */
function getAuthToken() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('firebaseToken');
  var expiry = parseInt(props.getProperty('firebaseTokenExpiry') || '0', 10);

  // Refresh if token is missing or expires within 5 minutes
  if (token && Date.now() < expiry - 300000) {
    return token;
  }

  // Anonymous sign-up via Firebase Auth REST API
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY;
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ returnSecureToken: true }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Firebase auth failed: ' + response.getContentText());
  }

  var data = JSON.parse(response.getContentText());
  token = data.idToken;
  // expiresIn is in seconds — convert to ms and store absolute expiry time
  var expiresInMs = parseInt(data.expiresIn, 10) * 1000;

  props.setProperty('firebaseToken', token);
  props.setProperty('firebaseTokenExpiry', String(Date.now() + expiresInMs));

  return token;
}

/**
 * Fetch history entries for a specific device, newer than the given timestamp.
 * Returns an array of objects sorted by timestamp (oldest first).
 */
function fetchNewHistory(deviceId, startAfterTimestamp) {
  var token = getAuthToken();
  var path = '/devices/' + deviceId + '/history';

  var url = FIREBASE_DB_URL + path + '.json'
    + '?auth=' + token
    + '&orderBy="timestamp"'
    + '&startAt=' + (startAfterTimestamp + 1);

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    throw new Error('Firebase fetch failed for ' + deviceId + ': ' + response.getContentText());
  }

  var raw = JSON.parse(response.getContentText());
  if (!raw) return [];

  // Convert { pushKey: {data}, ... } → sorted array
  var entries = [];
  var keys = Object.keys(raw);
  for (var i = 0; i < keys.length; i++) {
    var entry = raw[keys[i]];
    entry._firebaseKey = keys[i];
    entries.push(entry);
  }

  entries.sort(function (a, b) {
    return (a.timestamp || 0) - (b.timestamp || 0);
  });

  return entries;
}
