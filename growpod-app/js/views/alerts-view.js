// Alerts view — list of alerts from Firebase + notification permission
import { listenToAlerts, stopListeningToAlerts } from '../connection.js';
import { setState, getState } from '../state.js';
import { getAdvice } from '../data/alert-advice.js';

let unsubscribeAlerts = null;

export function renderAlerts(container) {
  container.innerHTML = buildHTML([]);

  // Start listening to Firebase alerts
  listenToAlerts((alerts) => {
    setState({ alerts });
    const list = document.getElementById('alertList');
    if (list) list.innerHTML = buildAlertListHTML(alerts);
  });

  attachListeners();
}

export function destroyAlerts() {
  stopListeningToAlerts();
}

// ─── HTML ────────────────────────────────────────────────────────

function buildHTML(alerts) {
  const notifSupported = 'Notification' in window;
  const notifGranted = notifSupported && Notification.permission === 'granted';

  return `
    <p class="section-header">Alerts</p>

    ${notifSupported ? `
      <div class="control-toggle-card ${notifGranted ? 'active' : ''}" id="notifCard">
        <div class="control-toggle-icon">🔔</div>
        <div class="control-toggle-info">
          <div class="control-toggle-label">Push Notifications</div>
          <div class="control-toggle-sublabel" id="notifSublabel">${notifGranted ? 'Enabled — you will be alerted' : 'Allow to get alerts when away'}</div>
        </div>
        <label class="toggle-switch" aria-label="Toggle push notifications">
          <input type="checkbox" id="notifToggle" ${notifGranted ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    ` : ''}

    <div id="alertList" class="alert-list">
      ${buildAlertListHTML(alerts)}
    </div>
  `;
}

function buildAlertListHTML(alerts) {
  if (!alerts.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <p>No alerts — chamber looks healthy!</p>
      </div>
    `;
  }

  return alerts.map((alert) => {
    const severity = getSeverity(alert.type);
    const advice = getAdvice(alert.type);
    return `
      <div class="alert-item ${severity.css}" role="alert">
        <div class="alert-icon-wrap alert-icon-wrap--${severity.css}">
          <span class="alert-icon">${severity.icon}</span>
        </div>
        <div class="alert-content">
          <div class="alert-title">${formatAlertType(alert.type)}</div>
          <div class="alert-detail">${alert.message || `Value: ${alert.value} (threshold: ${alert.threshold})`}</div>
          ${advice ? `<div class="alert-advice">${advice}</div>` : ''}
        </div>
        <span class="alert-time">${formatTime(alert.timestamp)}</span>
      </div>
    `;
  }).join('');
}

// ─── Helpers ─────────────────────────────────────────────────────

function getSeverity(type = '') {
  if (type.includes('high') || type.includes('low')) return { css: 'warning', icon: '⚠️' };
  if (type.includes('critical')) return { css: 'danger', icon: '🚨' };
  return { css: 'info', icon: 'ℹ️' };
}

function formatAlertType(type = '') {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// ─── Listeners ───────────────────────────────────────────────────

function attachListeners() {
  document.getElementById('notifToggle')?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      const permission = await Notification.requestPermission();
      const card = document.getElementById('notifCard');
      const sublabel = document.getElementById('notifSublabel');
      if (permission !== 'granted') {
        e.target.checked = false;
        if (sublabel) sublabel.textContent = 'Permission denied in browser settings';
      } else {
        if (card) card.classList.add('active');
        if (sublabel) sublabel.textContent = 'Enabled — you will be alerted';
        new Notification('GrowPod', { body: 'Notifications are enabled!', icon: '/icons/icon-192.png' });
      }
    }
  });
}
