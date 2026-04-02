// Dashboard view — live sensor gauges + actuator status
import { subscribe, getState } from '../state.js';
import { gaugeCard } from '../components/gauge-card.js';
import { getPresetById } from '../data/crop-presets.js';
import { getActiveDevice } from '../firebase-config.js';

function getCropName(id) {
  const preset = getPresetById(id);
  return preset ? preset.name : id;
}

let unsubscribe = null;

export function renderDashboard(container) {
  container.innerHTML = buildHTML(getState());

  unsubscribe = subscribe((state) => {
    updateGauges(state);
    updateActuators(state);
    updateStatusStrip(state);
  });
}

export function destroyDashboard() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// ─── Status summary ────────────────────────────────────────────

function getStatusSummary(state) {
  const s = state.sensors;
  const set = state.settings;
  const issues = [];

  if (s.temperature !== null && s.temperature !== undefined) {
    if (s.temperature < set.tempMin) issues.push('Temperature low');
    if (s.temperature > set.tempMax) issues.push('Temperature high');
  }
  if (s.humidity !== null && s.humidity !== undefined) {
    if (s.humidity < set.humidityMin) issues.push('Humidity low');
    if (s.humidity > set.humidityMax) issues.push('Humidity high');
  }
  if (s.co2 !== null && s.co2 !== undefined) {
    if (s.co2 > (set.co2Max || 1500)) issues.push('CO\u2082 high');
  }

  if (issues.length === 0) return { text: 'All good! Your greens are happy.', status: 'ok' };
  return { text: `Check: ${issues.join(', ')}`, status: 'warn' };
}

// ─── Initial render ──────────────────────────────────────────────

function buildHTML(state) {
  const s = state.sensors;
  const a = state.actuators;
  const summary = getStatusSummary(state);

  const cropName = state.settings.selectedCrop && state.settings.selectedCrop !== 'custom'
    ? getCropName(state.settings.selectedCrop)
    : null;

  return `
    <a href="#/chamber" class="chamber-card">
      <div class="chamber-card-icon">🌱</div>
      <div class="chamber-card-info">
        <span class="chamber-card-name">${getActiveDevice().name}</span>
        <span class="chamber-card-sub">${cropName ? `Growing ${cropName}` : 'View chamber details'}</span>
      </div>
      <svg class="chamber-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </a>

    <p class="section-header">Live Readings</p>

    <div class="gauge-grid" id="gaugeGrid">
      ${gaugeCard({ label: 'Temperature', icon: '🌡️', value: s.temperature, unit: '°C', min: 0, max: 40, thresholdLow: state.settings.tempMin, thresholdHigh: state.settings.tempMax })}
      ${gaugeCard({ label: 'Humidity', icon: '💧', value: s.humidity, unit: '%', min: 0, max: 100, thresholdLow: state.settings.humidityMin, thresholdHigh: state.settings.humidityMax })}
      ${gaugeCard({ label: 'CO\u2082', icon: '🌿', value: s.co2, unit: 'ppm', min: 400, max: 2000, thresholdLow: 400, thresholdHigh: state.settings.co2Max || 1500 })}
    </div>

    <div class="status-strip status-strip--${summary.status}" id="statusStrip">
      <span>${summary.status === 'ok' ? '✅' : '⚠️'}</span>
      <span>${summary.text}</span>
    </div>

    ${state.settings.selectedCrop && state.settings.selectedCrop !== 'custom' ? `<p class="crop-badge">Growing: <strong>${getCropName(state.settings.selectedCrop)}</strong></p>` : ''}

    <div class="card">
      <div class="card-title">Actuators</div>
      <div class="actuator-row" id="actuatorRow">
        ${actuatorBadgeHTML('💡', 'Lights', a.lights)}
        ${actuatorBadgeHTML('💦', 'Pump', a.pump)}
      </div>
    </div>

    ${!s.sensorsReady ? `<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:0.5rem 0">Sensors warming up — CO₂ readings ready in ~15 minutes</p>` : ''}
  `;
}

function actuatorBadgeHTML(icon, name, isOn) {
  return `
    <div class="actuator-badge ${isOn ? 'on' : ''}">
      <span style="font-size:1.2rem">${icon}</span>
      <span class="actuator-label">${name}</span>
      ${isOn ? 'ON' : 'OFF'}
    </div>
  `;
}

// ─── Partial updates ────────────────────────────────────────────

function updateGauges(state) {
  const grid = document.getElementById('gaugeGrid');
  if (!grid) return;
  const s = state.sensors;
  grid.innerHTML =
    gaugeCard({ label: 'Temperature', icon: '🌡️', value: s.temperature, unit: '°C', min: 0, max: 40, thresholdLow: state.settings.tempMin, thresholdHigh: state.settings.tempMax }) +
    gaugeCard({ label: 'Humidity', icon: '💧', value: s.humidity, unit: '%', min: 0, max: 100, thresholdLow: state.settings.humidityMin, thresholdHigh: state.settings.humidityMax }) +
    gaugeCard({ label: 'CO\u2082', icon: '🌿', value: s.co2, unit: 'ppm', min: 400, max: 2000, thresholdLow: 400, thresholdHigh: state.settings.co2Max || 1500 });
}

function updateActuators(state) {
  const row = document.getElementById('actuatorRow');
  if (!row) return;
  row.innerHTML =
    actuatorBadgeHTML('💡', 'Lights', state.actuators.lights) +
    actuatorBadgeHTML('💦', 'Pump', state.actuators.pump);
}

function updateStatusStrip(state) {
  const strip = document.getElementById('statusStrip');
  if (!strip) return;
  const summary = getStatusSummary(state);
  strip.className = `status-strip status-strip--${summary.status}`;
  strip.innerHTML = `
    <span>${summary.status === 'ok' ? '✅' : '⚠️'}</span>
    <span>${summary.text}</span>
  `;
}
