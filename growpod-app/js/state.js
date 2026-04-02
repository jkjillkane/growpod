// Simple pub/sub state store — no framework needed

const state = {
  activeDevice: localStorage.getItem('activeDevice') || 'growpod-001',
  sensors: {
    temperature: null,
    humidity: null,
    co2: null,
    tvoc: null,
    soilMoisture: null,
    sensorsReady: false,
  },
  actuators: {
    lights: false,
    pump: false,
  },
  settings: {
    tempMin: 18,
    tempMax: 28,
    humidityMin: 50,
    humidityMax: 80,
    co2Max: 1500,
    moistureThreshold: 40,
    selectedCrop: null,
    lightSchedule: { on: '06:00', off: '22:00' },
  },
  alerts: [],
  connection: 'connecting', // 'local' | 'cloud' | 'offline' | 'connecting'
  uptime: 0,
};

const listeners = new Set();

/**
 * Merge updates into state and notify all subscribers.
 * @param {Partial<typeof state>} updates
 */
export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach((fn) => fn(state));
}

/**
 * Subscribe to state changes. Returns an unsubscribe function.
 * @param {(state: object) => void} fn
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Get a snapshot of the current state. */
export function getState() {
  return state;
}
