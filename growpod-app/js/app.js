// GrowPod Controller — app entry point + hash router
import { startPolling, stopPolling, stopListeningToAlerts } from './connection.js';
import { renderDashboard, destroyDashboard } from './views/dashboard-view.js';
import { renderControls, destroyControls } from './views/controls-view.js';
import { renderAlerts, destroyAlerts } from './views/alerts-view.js';
import { renderHistory, destroyHistory } from './views/history-view.js';
import { renderChamber, destroyChamber } from './views/chamber-view.js';
import { setState } from './state.js';
import { getDevices, getActiveDeviceId, setActiveDevice } from './firebase-config.js';

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// ─── Router ─────────────────────────────────────────────────────

const views = {
  dashboard: { render: renderDashboard, destroy: destroyDashboard },
  controls:  { render: renderControls,  destroy: destroyControls  },
  alerts:    { render: renderAlerts,    destroy: destroyAlerts    },
  history:   { render: renderHistory,   destroy: destroyHistory   },
  chamber:   { render: renderChamber,  destroy: destroyChamber   },
};

let currentView = null;

function getViewName() {
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  return views[hash] ? hash : 'dashboard';
}

function navigate(viewName) {
  const app = document.getElementById('app');

  // Tear down the old view
  if (currentView && views[currentView]) {
    views[currentView].destroy();
  }

  const isSecondary = viewName === 'chamber';
  const bottomNav = document.getElementById('bottomNav');
  const backBtn = document.getElementById('backBtn');

  // Show/hide bottom nav and back button for secondary pages
  if (bottomNav) bottomNav.classList.toggle('hidden', isSecondary);
  if (backBtn) backBtn.classList.toggle('hidden', !isSecondary);

  // Update nav tab active state + accessibility
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    const isActive = tab.dataset.view === viewName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Keep polling on dashboard and chamber (both show live data)
  const needsPolling = viewName === 'dashboard' || viewName === 'chamber';
  if (!needsPolling) {
    stopPolling();
  }

  // Render new view
  currentView = viewName;
  views[viewName].render(app);

  // Start polling for views that need live data
  if (needsPolling) {
    startPolling();
  }
}

function onHashChange() {
  navigate(getViewName());
}

// ─── Demo mode — realistic placeholder data ──────────────────────
// Shown immediately on load so the UI looks populated.
// Replaced automatically once real ESP32/Firebase data arrives.

function seedDemoData() {
  setState({
    sensors: {
      temperature: 22.4,
      humidity: 68.0,
      co2: 520,
      tvoc: 85,
      soilMoisture: 61,
      sensorsReady: true,
    },
    actuators: { lights: true, pump: false },
    alerts: [
      {
        id: 'demo1',
        type: 'humidity_low',
        value: 44,
        threshold: 50,
        message: 'Humidity dropped below 50%',
        timestamp: Date.now() - 3600000,
      },
    ],
    connection: 'demo',
  });
}

// ─── Init ────────────────────────────────────────────────────────

// ─── Device Switcher ─────────────────────────────────────────

function initDeviceSelect() {
  const select = document.getElementById('deviceSelect');
  if (!select) return;

  // Populate options from device registry
  const devices = getDevices();
  select.innerHTML = devices
    .map((d) => `<option value="${d.id}">${d.name}</option>`)
    .join('');
  select.value = getActiveDeviceId();

  select.addEventListener('change', () => {
    switchDevice(select.value);
  });
}

function switchDevice(deviceId) {
  stopPolling();
  stopListeningToAlerts();
  setActiveDevice(deviceId);

  // Reset state so UI shows loading for the new device
  setState({
    activeDevice: deviceId,
    sensors: {
      temperature: null, humidity: null, co2: null,
      tvoc: null, soilMoisture: null, sensorsReady: false,
    },
    actuators: { lights: false, pump: false },
    alerts: [],
    connection: 'connecting',
  });

  // Re-render current view (restarts polling/listeners)
  navigate(getViewName());
}

// ─── Init ────────────────────────────────────────────────────

function init() {
  window.addEventListener('hashchange', onHashChange);

  // Set up device switcher in header
  initDeviceSelect();

  // Seed demo data so UI looks populated before real data arrives
  seedDemoData();

  // Navigate to the initial view
  navigate(getViewName());
}

init();
