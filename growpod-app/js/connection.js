// Handles connecting to the ESP32 — local REST API first, Firebase fallback
import { ref, get, set, push, onValue, off } from 'firebase/database';
import { db, paths, getActiveDeviceId } from './firebase-config.js';
import { setState } from './state.js';

// Each ESP32 advertises via mDNS as {deviceId}.local
function getLocalUrl() {
  return `http://${getActiveDeviceId()}.local`;
}
const LOCAL_TIMEOUT_MS = 2000;

let usingLocal = false;
let firebaseListener = null;

// ─── Internal helpers ────────────────────────────────────────────

async function tryLocalFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCAL_TIMEOUT_MS);
  try {
    const res = await fetch(`${getLocalUrl()}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function updateBadge(source) {
  const badge = document.getElementById('connectionBadge');
  if (!badge) return;
  badge.textContent = source === 'local' ? 'Local' : source === 'cloud' ? 'Cloud' : 'Offline';
  badge.className = 'connection-badge ' + source;
}

// ─── Status polling (dashboard live updates) ────────────────────

let pollInterval = null;

export async function startPolling() {
  stopPolling();

  async function fetchOnce() {
    // 1. Try local
    const local = await tryLocalFetch('/api/status');
    if (local) {
      usingLocal = true;
      updateBadge('local');
      setState({
        sensors: {
          temperature: local.temperature,
          humidity: local.humidity,
          co2: local.co2,
          tvoc: local.tvoc,
          soilMoisture: local.soilMoisture,
          sensorsReady: local.sensorsReady,
        },
        actuators: { lights: local.lights, pump: local.pump },
        connection: 'local',
        uptime: local.uptime,
      });
      return;
    }

    // 2. Fall back to Firebase
    usingLocal = false;
    updateBadge('cloud');
    try {
      const snapshot = await get(ref(db, paths.current()));
      if (snapshot.exists()) {
        const d = snapshot.val();
        setState({
          sensors: {
            temperature: d.temperature,
            humidity: d.humidity,
            co2: d.co2,
            tvoc: d.tvoc,
            soilMoisture: d.soilMoisture,
            sensorsReady: true,
          },
          actuators: { lights: d.lights, pump: d.pump },
          connection: 'cloud',
        });
      } else {
        updateBadge('offline');
        setState({ connection: 'offline' });
      }
    } catch {
      updateBadge('offline');
      setState({ connection: 'offline' });
    }
  }

  // Fetch immediately, then every 5 seconds
  await fetchOnce();
  pollInterval = setInterval(fetchOnce, 5000);
}

export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─── Settings ───────────────────────────────────────────────────

export async function fetchSettings() {
  const local = await tryLocalFetch('/api/settings');
  if (local) return local;

  const snapshot = await get(ref(db, paths.settings()));
  return snapshot.exists() ? snapshot.val() : null;
}

// ─── Send a command (lights / pump / settings) ───────────────────

/**
 * @param {'lights'|'pump'|'settings'} type
 * @param {object} payload
 */
export async function sendCommand(type, payload) {
  // Try local REST API first
  if (usingLocal) {
    const result = await tryLocalFetch(`/api/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (result) return { source: 'local' };
  }

  // Fall back: write a command node to Firebase for the ESP32 to pick up
  if (type === 'settings') {
    // Settings go directly to /settings (ESP32 reads them)
    await set(ref(db, paths.settings()), payload);
  } else {
    // Control commands go to /commands (ESP32 polls and deletes)
    await push(ref(db, paths.commands()), { type, ...payload });
  }
  return { source: 'cloud' };
}

// ─── Alerts (Firebase listener) ─────────────────────────────────

export function listenToAlerts(callback) {
  const alertsRef = ref(db, paths.alerts());
  onValue(alertsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const raw = snapshot.val();
    const list = Object.entries(raw)
      .map(([key, val]) => ({ id: key, ...val }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 50); // keep most recent 50
    callback(list);
  });
  firebaseListener = alertsRef;
}

export function stopListeningToAlerts() {
  if (firebaseListener) {
    off(firebaseListener);
    firebaseListener = null;
  }
}

// ─── History (one-off fetch) ─────────────────────────────────────

/**
 * Fetch history data points within a time range.
 * @param {number} sinceMs  — timestamp in ms (e.g. Date.now() - 3600000 for last 1h)
 */
export async function fetchHistory(sinceMs) {
  const snapshot = await get(ref(db, paths.history()));
  if (!snapshot.exists()) return [];

  const raw = snapshot.val();
  return Object.entries(raw)
    .map(([key, val]) => ({ id: key, ...val }))
    .filter((d) => (d.timestamp || 0) >= sinceMs)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}
