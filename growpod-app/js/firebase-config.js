// Firebase configuration
// ────────────────────────────────────────────────
// Fill in your own values from the Firebase Console:
// console.firebase.google.com → Your Project → Project Settings → Your apps
// ────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Device registry — one entry per grow box
const DEVICES = [
  { id: 'growpod-001', name: 'Box 1' },
  { id: 'growpod-002', name: 'Box 2' },
];

// Persist selection across sessions
let activeDeviceId = localStorage.getItem('activeDevice') || DEVICES[0].id;

export function getDevices() { return DEVICES; }
export function getActiveDevice() { return DEVICES.find((d) => d.id === activeDeviceId) || DEVICES[0]; }
export function getActiveDeviceId() { return activeDeviceId; }

export function setActiveDevice(deviceId) {
  const device = DEVICES.find((d) => d.id === deviceId);
  if (!device) return;
  activeDeviceId = deviceId;
  localStorage.setItem('activeDevice', deviceId);
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/** Firebase database path helpers (use active device) */
export const paths = {
  current: () => `devices/${activeDeviceId}/current`,
  settings: () => `devices/${activeDeviceId}/settings`,
  commands: () => `devices/${activeDeviceId}/commands`,
  history: () => `devices/${activeDeviceId}/history`,
  alerts: () => `devices/${activeDeviceId}/alerts`,
};
