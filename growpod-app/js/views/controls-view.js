// Controls view — toggle lights/pump, adjust thresholds + schedule
import { getState, setState } from '../state.js';
import { sendCommand, fetchSettings } from '../connection.js';
import { showToast } from '../components/toast.js';
import { CROP_PRESETS, getPresetById } from '../data/crop-presets.js';

const CROP_ICONS = {
  broccoli: '🥦', mustard: '🌿', radish: '🌱', 'pea-shoots': '🫛',
  sunflower: '🌻', wheatgrass: '🌾', basil: '🌿',
  'oyster-mushroom': '🍄', 'lions-mane': '🦁', 'pink-oyster': '🍄',
  custom: '⚙️',
};

export function renderControls(container) {
  const state = getState();
  container.innerHTML = buildHTML(state);
  attachListeners();

  fetchSettings().then((settings) => {
    if (settings) {
      setState({ settings });
      populateSettingsForm(settings);
    }
  });
}

export function destroyControls() {}

// ─── HTML ────────────────────────────────────────────────────────

function buildHTML(state) {
  const a = state.actuators;
  const s = state.settings;
  return `
    <p class="section-header">Controls</p>

    <!-- Lights toggle card -->
    <div class="control-toggle-card ${a.lights ? 'active' : ''}" id="lightsCard">
      <div class="control-toggle-icon">💡</div>
      <div class="control-toggle-info">
        <div class="control-toggle-label">Grow Lights</div>
        <div class="control-toggle-sublabel">Manual override</div>
      </div>
      <div class="control-toggle-state">${a.lights ? 'ON' : 'OFF'}</div>
      <label class="toggle-switch" aria-label="Toggle grow lights">
        <input type="checkbox" id="lightsToggle" ${a.lights ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>

    <!-- Pump trigger card -->
    <div class="card">
      <div class="card-title">💦 Watering Pump</div>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">Run pump for a set duration</p>
      <div class="duration-group" id="durationGroup">
        <button class="duration-btn selected" data-duration="5">5s</button>
        <button class="duration-btn" data-duration="10">10s</button>
        <button class="duration-btn" data-duration="15">15s</button>
        <button class="duration-btn" data-duration="30">30s</button>
      </div>
      <button class="btn btn-primary" id="pumpBtn">Water Now</button>
    </div>

    <!-- Crop Preset -->
    <div class="card">
      <div class="card-title">What Are You Growing?</div>
      <div class="crop-grid" id="cropGrid" role="radiogroup" aria-label="Crop preset">
        ${buildCropCards(s.selectedCrop)}
      </div>
      <p class="crop-hint" id="cropHint"></p>
    </div>

    <!-- Thresholds -->
    <div class="card">
      <div class="card-title">Thresholds</div>

      <div class="form-group">
        <div class="form-label">Temperature (°C)</div>
        <div class="input-row">
          <div>
            <label class="form-label" style="font-weight:400">Min</label>
            <input type="number" class="form-input threshold-input" id="tempMin" value="${s.tempMin}" min="0" max="40" step="0.5">
          </div>
          <div>
            <label class="form-label" style="font-weight:400">Max</label>
            <input type="number" class="form-input threshold-input" id="tempMax" value="${s.tempMax}" min="0" max="40" step="0.5">
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">Humidity (%)</div>
        <div class="input-row">
          <div>
            <label class="form-label" style="font-weight:400">Min</label>
            <input type="number" class="form-input threshold-input" id="humidityMin" value="${s.humidityMin}" min="0" max="100">
          </div>
          <div>
            <label class="form-label" style="font-weight:400">Max</label>
            <input type="number" class="form-input threshold-input" id="humidityMax" value="${s.humidityMax}" min="0" max="100">
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">CO₂ Max (ppm)</div>
        <input type="number" class="form-input threshold-input" id="co2Max" value="${s.co2Max}" min="400" max="5000" step="100">
      </div>

      <div class="form-group">
        <div class="form-label">Soil Moisture Min (%)</div>
        <input type="number" class="form-input threshold-input" id="moistureThreshold" value="${s.moistureThreshold}" min="0" max="100">
      </div>
    </div>

    <!-- Light schedule -->
    <div class="card">
      <div class="card-title">Light Schedule</div>
      <div class="input-row" style="margin-bottom:0.75rem">
        <div>
          <label class="form-label">On time</label>
          <input type="time" class="form-input" id="lightOn" value="${s.lightSchedule.on}">
        </div>
        <div>
          <label class="form-label">Off time</label>
          <input type="time" class="form-input" id="lightOff" value="${s.lightSchedule.off}">
        </div>
      </div>
      <p style="font-size:0.75rem;color:var(--text-muted)">The ESP32 uses NTP to keep time. Schedule persists after power cut.</p>
    </div>

    <button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:0.5rem">Save Settings</button>
  `;
}

function buildCropCards(selectedCrop) {
  const cards = CROP_PRESETS.map((p) => `
    <button class="crop-card ${selectedCrop === p.id ? 'selected' : ''}"
            data-crop="${p.id}" role="radio"
            aria-checked="${selectedCrop === p.id}" aria-label="${p.name}">
      <span class="crop-card-icon">${CROP_ICONS[p.id] || '🌱'}</span>
      <span class="crop-card-name">${p.name}</span>
      <span class="crop-card-type">${p.category === 'mushroom' ? 'Mushroom' : 'Microgreen'}</span>
    </button>
  `).join('');

  const customCard = `
    <button class="crop-card ${selectedCrop === 'custom' ? 'selected' : ''}"
            data-crop="custom" role="radio"
            aria-checked="${selectedCrop === 'custom'}" aria-label="Custom settings">
      <span class="crop-card-icon">⚙️</span>
      <span class="crop-card-name">Custom</span>
      <span class="crop-card-type">Your settings</span>
    </button>
  `;

  return cards + customCard;
}

// ─── Event listeners ─────────────────────────────────────────────

function attachListeners() {
  // Lights toggle
  document.getElementById('lightsToggle')?.addEventListener('change', async (e) => {
    const on = e.target.checked;
    const card = document.getElementById('lightsCard');
    try {
      await sendCommand('lights', { on });
      setState({ actuators: { ...getState().actuators, lights: on } });
      if (card) card.classList.toggle('active', on);
      const stateEl = card?.querySelector('.control-toggle-state');
      if (stateEl) stateEl.textContent = on ? 'ON' : 'OFF';
      showToast(`Lights turned ${on ? 'on' : 'off'}`, 'success');
    } catch {
      showToast('Failed to toggle lights', 'error');
      e.target.checked = !on;
    }
  });

  // Duration selector
  document.getElementById('durationGroup')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.duration-btn');
    if (!btn) return;
    document.querySelectorAll('.duration-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
  });

  // Pump button
  document.getElementById('pumpBtn')?.addEventListener('click', async () => {
    const selected = document.querySelector('.duration-btn.selected');
    const duration = selected ? parseInt(selected.dataset.duration, 10) : 10;
    const btn = document.getElementById('pumpBtn');
    btn.disabled = true;
    btn.textContent = 'Running...';
    try {
      await sendCommand('pump', { on: true, duration });
      showToast(`Pump running for ${duration}s`, 'success');
      setTimeout(() => {
        if (btn) { btn.disabled = false; btn.textContent = 'Water Now'; }
      }, duration * 1000);
    } catch {
      showToast('Failed to start pump', 'error');
      btn.disabled = false;
      btn.textContent = 'Water Now';
    }
  });

  // Crop preset cards (click delegation)
  document.getElementById('cropGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.crop-card');
    if (!card) return;
    const cropId = card.dataset.crop;

    // Update selected state
    document.querySelectorAll('.crop-card').forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
    });
    card.classList.add('selected');
    card.setAttribute('aria-checked', 'true');

    // If it's a real preset, fill in the values
    const preset = getPresetById(cropId);
    if (preset) {
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      set('tempMin', preset.tempMin);
      set('tempMax', preset.tempMax);
      set('humidityMin', preset.humidityMin);
      set('humidityMax', preset.humidityMax);
      set('co2Max', preset.co2Max);
      set('moistureThreshold', preset.moistureThreshold);
      set('lightOn', preset.lightOn);
      set('lightOff', preset.lightOff);
      updateCropHint(preset);
    } else {
      const hint = document.getElementById('cropHint');
      if (hint) hint.textContent = 'Set your own thresholds below';
    }
  });

  // Switch to "Custom" when user manually edits a threshold
  document.querySelectorAll('.threshold-input').forEach((input) => {
    input.addEventListener('change', () => {
      const selectedCard = document.querySelector('.crop-card.selected');
      const cropId = selectedCard?.dataset.crop;
      const preset = getPresetById(cropId);
      if (!preset) return;
      const form = readSettingsForm();
      const changed = form.tempMin !== preset.tempMin || form.tempMax !== preset.tempMax ||
        form.humidityMin !== preset.humidityMin || form.humidityMax !== preset.humidityMax ||
        form.co2Max !== preset.co2Max || form.moistureThreshold !== preset.moistureThreshold;
      if (changed) selectCropCard('custom');
    });
  });

  // Switch to custom if light schedule changes
  ['lightOn', 'lightOff'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      const selectedCard = document.querySelector('.crop-card.selected');
      const preset = getPresetById(selectedCard?.dataset.crop);
      if (!preset) return;
      const lightOn = document.getElementById('lightOn')?.value;
      const lightOff = document.getElementById('lightOff')?.value;
      if (lightOn !== preset.lightOn || lightOff !== preset.lightOff) {
        selectCropCard('custom');
      }
    });
  });

  // Show hint for initially selected crop
  const initialCard = document.querySelector('.crop-card.selected');
  if (initialCard) {
    const preset = getPresetById(initialCard.dataset.crop);
    if (preset) updateCropHint(preset);
  }

  // Save settings
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const settings = readSettingsForm();
    const btn = document.getElementById('saveSettingsBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      await sendCommand('settings', settings);
      setState({ settings });
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Save Settings';
  });
}

function selectCropCard(cropId) {
  document.querySelectorAll('.crop-card').forEach((c) => {
    const isTarget = c.dataset.crop === cropId;
    c.classList.toggle('selected', isTarget);
    c.setAttribute('aria-checked', isTarget ? 'true' : 'false');
  });
}

function readSettingsForm() {
  const selectedCard = document.querySelector('.crop-card.selected');
  return {
    tempMin: parseFloat(document.getElementById('tempMin')?.value || '18'),
    tempMax: parseFloat(document.getElementById('tempMax')?.value || '28'),
    humidityMin: parseInt(document.getElementById('humidityMin')?.value || '50', 10),
    humidityMax: parseInt(document.getElementById('humidityMax')?.value || '80', 10),
    co2Max: parseInt(document.getElementById('co2Max')?.value || '1500', 10),
    moistureThreshold: parseInt(document.getElementById('moistureThreshold')?.value || '40', 10),
    selectedCrop: selectedCard?.dataset.crop || null,
    lightSchedule: {
      on: document.getElementById('lightOn')?.value || '06:00',
      off: document.getElementById('lightOff')?.value || '22:00',
    },
  };
}

function populateSettingsForm(s) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('tempMin', s.tempMin);
  set('tempMax', s.tempMax);
  set('humidityMin', s.humidityMin);
  set('humidityMax', s.humidityMax);
  set('co2Max', s.co2Max ?? 1500);
  set('moistureThreshold', s.moistureThreshold);
  set('lightOn', s.lightSchedule?.on || '06:00');
  set('lightOff', s.lightSchedule?.off || '22:00');

  // Restore crop selection
  if (s.selectedCrop) {
    selectCropCard(s.selectedCrop);
    const preset = getPresetById(s.selectedCrop);
    if (preset) updateCropHint(preset);
  }
}

function updateCropHint(preset) {
  const hint = document.getElementById('cropHint');
  if (!hint) return;
  hint.textContent = `${preset.tempMin}-${preset.tempMax}°C | ${preset.humidityMin}-${preset.humidityMax}% humidity | CO₂ < ${preset.co2Max} ppm | Light ${preset.lightOn}-${preset.lightOff}`;
}
