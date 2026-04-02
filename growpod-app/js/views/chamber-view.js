// Chamber detail view — full overview of the grow chamber
import { subscribe, getState } from '../state.js';
import { getPresetById, CROP_PRESETS } from '../data/crop-presets.js';
import { getActiveDevice } from '../firebase-config.js';

let unsubscribe = null;

export function renderChamber(container) {
  container.innerHTML = buildHTML(getState());
  bindEvents();

  unsubscribe = subscribe((state) => {
    updateEnvironment(state);
    updateHardware(state);
    updateAlerts(state);
  });
}

export function destroyChamber() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function getCropInfo(state) {
  const id = state.settings.selectedCrop;
  if (!id || id === 'custom') return null;
  return getPresetById(id);
}

function getCropIcon(category) {
  return category === 'mushroom' ? '🍄' : '🌱';
}

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatUptime(seconds) {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function statusColor(value, min, max) {
  if (value === null || value === undefined) return 'muted';
  if (value < min || value > max) return 'warn';
  return 'ok';
}

// ─── Build HTML ───────────────────────────────────────────────

function buildHTML(state) {
  const s = state.sensors;
  const set = state.settings;
  const crop = getCropInfo(state);

  return `
    <div class="chamber-detail">

      <!-- Header -->
      <div class="chamber-hero">
        <div class="chamber-hero-icon">${crop ? getCropIcon(crop.category) : '🌱'}</div>
        <div class="chamber-hero-info">
          <h2 class="chamber-hero-name">${getActiveDevice().name}</h2>
          <p class="chamber-hero-sub">Device: ${getActiveDevice().id}</p>
        </div>
        <span class="connection-pill connection-pill--${state.connection}">
          ${state.connection === 'demo' ? 'Demo' : state.connection}
        </span>
      </div>

      ${state.uptime ? `<p class="chamber-uptime">Uptime: ${formatUptime(state.uptime)}</p>` : ''}

      <!-- Current Crop -->
      ${crop ? `
      <div class="chamber-section">
        <div class="chamber-section-title">Current Crop</div>
        <div class="crop-summary-card">
          <span class="crop-summary-icon">${getCropIcon(crop.category)}</span>
          <div class="crop-summary-info">
            <span class="crop-summary-name">${crop.name}</span>
            <span class="crop-summary-cat">${crop.category}</span>
          </div>
        </div>
        <div class="param-grid">
          <div class="param-item">
            <span class="param-label">Temp</span>
            <span class="param-value">${crop.tempMin}–${crop.tempMax}°C</span>
          </div>
          <div class="param-item">
            <span class="param-label">Humidity</span>
            <span class="param-value">${crop.humidityMin}–${crop.humidityMax}%</span>
          </div>
          <div class="param-item">
            <span class="param-label">CO₂ Max</span>
            <span class="param-value">${crop.co2Max} ppm</span>
          </div>
          <div class="param-item">
            <span class="param-label">Moisture</span>
            <span class="param-value">${crop.moistureThreshold}%</span>
          </div>
          <div class="param-item">
            <span class="param-label">Lights On</span>
            <span class="param-value">${crop.lightOn}</span>
          </div>
          <div class="param-item">
            <span class="param-label">Lights Off</span>
            <span class="param-value">${crop.lightOff}</span>
          </div>
        </div>
      </div>
      ` : `
      <div class="chamber-section">
        <div class="chamber-section-title">Current Crop</div>
        <p class="chamber-muted">No crop selected — using custom settings</p>
      </div>
      `}

      <!-- Live Environment -->
      <div class="chamber-section">
        <div class="chamber-section-title">Live Environment</div>
        <div class="env-list" id="envList">
          ${envRowsHTML(state)}
        </div>
      </div>

      <!-- Hardware -->
      <div class="chamber-section">
        <div class="chamber-section-title">Hardware</div>
        <div class="hw-list" id="hwList">
          ${hardwareHTML(state)}
        </div>
      </div>

      <!-- Settings -->
      <div class="chamber-section">
        <div class="chamber-section-title">Thresholds</div>
        <div class="param-grid">
          <div class="param-item">
            <span class="param-label">Temp</span>
            <span class="param-value">${set.tempMin}–${set.tempMax}°C</span>
          </div>
          <div class="param-item">
            <span class="param-label">Humidity</span>
            <span class="param-value">${set.humidityMin}–${set.humidityMax}%</span>
          </div>
          <div class="param-item">
            <span class="param-label">CO₂ Max</span>
            <span class="param-value">${set.co2Max || 1500} ppm</span>
          </div>
          <div class="param-item">
            <span class="param-label">Moisture</span>
            <span class="param-value">${set.moistureThreshold}%</span>
          </div>
          <div class="param-item">
            <span class="param-label">Lights On</span>
            <span class="param-value">${set.lightSchedule.on}</span>
          </div>
          <div class="param-item">
            <span class="param-label">Lights Off</span>
            <span class="param-value">${set.lightSchedule.off}</span>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="chamber-section">
        <div class="chamber-section-title">Recent Alerts</div>
        <div id="chamberAlerts">
          ${alertsHTML(state)}
        </div>
      </div>

    </div>
  `;
}

// ─── Sub-sections ─────────────────────────────────────────────

function envRowsHTML(state) {
  const s = state.sensors;
  const set = state.settings;

  const rows = [
    {
      label: 'Temperature',
      icon: '🌡️',
      value: s.temperature !== null ? `${s.temperature}°C` : '--',
      range: `${set.tempMin}–${set.tempMax}°C`,
      status: statusColor(s.temperature, set.tempMin, set.tempMax),
    },
    {
      label: 'Humidity',
      icon: '💧',
      value: s.humidity !== null ? `${s.humidity}%` : '--',
      range: `${set.humidityMin}–${set.humidityMax}%`,
      status: statusColor(s.humidity, set.humidityMin, set.humidityMax),
    },
    {
      label: 'CO₂',
      icon: '🌿',
      value: s.co2 !== null ? `${s.co2} ppm` : '--',
      range: `< ${set.co2Max || 1500} ppm`,
      status: s.co2 !== null && s.co2 > (set.co2Max || 1500) ? 'warn' : (s.co2 !== null ? 'ok' : 'muted'),
    },
    {
      label: 'Soil Moisture',
      icon: '🪴',
      value: s.soilMoisture !== null ? `${s.soilMoisture}%` : '--',
      range: `> ${set.moistureThreshold}%`,
      status: s.soilMoisture !== null && s.soilMoisture < set.moistureThreshold ? 'warn' : (s.soilMoisture !== null ? 'ok' : 'muted'),
    },
  ];

  return rows.map((r) => `
    <div class="env-row">
      <span class="env-row-icon">${r.icon}</span>
      <span class="env-row-label">${r.label}</span>
      <span class="env-row-value env-row-value--${r.status}">${r.value}</span>
      <span class="env-row-range">${r.range}</span>
    </div>
  `).join('');
}

function hardwareHTML(state) {
  const a = state.actuators;
  const ready = state.sensors.sensorsReady;

  return `
    <div class="hw-row">
      <span class="hw-icon">💡</span>
      <span class="hw-label">Grow Lights</span>
      <span class="hw-status hw-status--${a.lights ? 'on' : 'off'}">${a.lights ? 'ON' : 'OFF'}</span>
    </div>
    <div class="hw-row">
      <span class="hw-icon">💦</span>
      <span class="hw-label">Water Pump</span>
      <span class="hw-status hw-status--${a.pump ? 'on' : 'off'}">${a.pump ? 'ON' : 'OFF'}</span>
    </div>
    <div class="hw-row">
      <span class="hw-icon">📡</span>
      <span class="hw-label">Sensors</span>
      <span class="hw-status hw-status--${ready ? 'on' : 'off'}">${ready ? 'Ready' : 'Warming Up'}</span>
    </div>
  `;
}

function alertsHTML(state) {
  const alerts = (state.alerts || []).slice(0, 3);
  if (alerts.length === 0) {
    return '<p class="chamber-muted">No recent alerts</p>';
  }

  return alerts.map((a) => `
    <div class="chamber-alert-row">
      <span class="chamber-alert-dot ${a.type.includes('high') || a.type.includes('danger') ? 'danger' : 'warning'}"></span>
      <span class="chamber-alert-msg">${a.message}</span>
      <span class="chamber-alert-time">${formatTime(a.timestamp)}</span>
    </div>
  `).join('');
}

// ─── Events ───────────────────────────────────────────────────

function bindEvents() {
  // No interactive elements yet — page is read-only
}

// ─── Partial updates ──────────────────────────────────────────

function updateEnvironment(state) {
  const el = document.getElementById('envList');
  if (el) el.innerHTML = envRowsHTML(state);
}

function updateHardware(state) {
  const el = document.getElementById('hwList');
  if (el) el.innerHTML = hardwareHTML(state);
}

function updateAlerts(state) {
  const el = document.getElementById('chamberAlerts');
  if (el) el.innerHTML = alertsHTML(state);
}
