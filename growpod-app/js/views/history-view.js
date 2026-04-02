// History view — Chart.js line charts of sensor data over time
import { fetchHistory } from '../connection.js';
import Chart from 'chart.js/auto';

let charts = [];

export function renderHistory(container) {
  container.innerHTML = buildHTML();
  attachListeners();
  loadData('1h'); // default range
}

export function destroyHistory() {
  charts.forEach((c) => c.destroy());
  charts = [];
}

// ─── HTML ────────────────────────────────────────────────────────

function buildHTML() {
  return `
    <p class="section-header">History</p>

    <div class="time-range-tabs">
      <button class="time-range-tab active" data-range="1h">1h</button>
      <button class="time-range-tab" data-range="6h">6h</button>
      <button class="time-range-tab" data-range="24h">24h</button>
      <button class="time-range-tab" data-range="7d">7d</button>
    </div>

    <div id="historyLoading" style="text-align:center;padding:2rem;color:var(--gray-400)">
      Loading history...
    </div>

    <div id="historyCharts" style="display:none">
      <p class="chart-label">Temperature (°C)</p>
      <div class="chart-container"><canvas id="tempChart"></canvas></div>

      <p class="chart-label">Humidity (%)</p>
      <div class="chart-container"><canvas id="humidityChart"></canvas></div>

      <p class="chart-label">CO₂ (ppm)</p>
      <div class="chart-container"><canvas id="co2Chart"></canvas></div>

    </div>

    <div id="historyEmpty" style="display:none">
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No history yet — data will appear after the ESP32 has been running for a while.</p>
      </div>
    </div>
  `;
}

// ─── Data loading ─────────────────────────────────────────────────

async function loadData(range) {
  const loading = document.getElementById('historyLoading');
  const chartsEl = document.getElementById('historyCharts');
  const emptyEl = document.getElementById('historyEmpty');

  if (loading) loading.style.display = 'block';
  if (chartsEl) chartsEl.style.display = 'none';
  if (emptyEl) emptyEl.style.display = 'none';

  // Destroy existing charts before re-rendering
  charts.forEach((c) => c.destroy());
  charts = [];

  const sinceMs = Date.now() - rangeToMs(range);
  const data = await fetchHistory(sinceMs);

  if (loading) loading.style.display = 'none';

  if (!data.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (chartsEl) chartsEl.style.display = 'block';

  const labels = data.map((d) => formatLabel(d.timestamp, range));

  charts.push(buildChart('tempChart',     labels, data.map((d) => d.temperature), 'Temperature', '#2D6A4F'));
  charts.push(buildChart('humidityChart', labels, data.map((d) => d.humidity),    'Humidity',    '#0EA5E9'));
  charts.push(buildChart('co2Chart',      labels, data.map((d) => d.co2),         'CO₂',         '#8B5CF6'));
}

// ─── Chart builder ────────────────────────────────────────────────

function buildChart(canvasId, labels, values, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: color,
        backgroundColor: color + '20', // 12% opacity fill
        borderWidth: 2,
        pointRadius: values.length > 60 ? 0 : 3, // hide points on dense data
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 6, font: { family: 'Inter', size: 11 } },
        },
        y: {
          grid: { color: '#E5E7EB' },
          ticks: { font: { family: 'Inter', size: 11 } },
        },
      },
    },
  });
}

// ─── Listeners ────────────────────────────────────────────────────

function attachListeners() {
  document.querySelector('.time-range-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.time-range-tab');
    if (!tab) return;
    document.querySelectorAll('.time-range-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    loadData(tab.dataset.range);
  });
}

// ─── Utilities ────────────────────────────────────────────────────

function rangeToMs(range) {
  const map = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
  return map[range] || 3600000;
}

function formatLabel(ts, range) {
  if (!ts) return '';
  const d = new Date(ts);
  if (range === '7d') return d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
}
