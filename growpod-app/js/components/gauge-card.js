/**
 * Gauge card component — SVG radial arc gauge.
 *
 * @param {object} props
 * @param {string} props.label       — e.g. 'Temperature'
 * @param {string} props.icon        — emoji icon, e.g. '🌡️'
 * @param {number|null} props.value  — current reading, null = loading
 * @param {string} props.unit        — e.g. '°C'
 * @param {number} props.min         — gauge min
 * @param {number} props.max         — gauge max
 * @param {number} props.thresholdLow
 * @param {number} props.thresholdHigh
 * @returns {string} HTML string
 */
export function gaugeCard({ label, icon, value, unit, min, max, thresholdLow, thresholdHigh }) {
  const isLoading = value === null || value === undefined;

  let status = 'ok';
  let statusText = 'Normal';
  let arcColor = 'var(--primary-light)';
  if (!isLoading) {
    if (value < thresholdLow) {
      status = 'warn';
      statusText = 'Too Low';
      arcColor = 'var(--warning)';
    } else if (value > thresholdHigh) {
      status = 'alert';
      statusText = 'Too High';
      arcColor = 'var(--danger)';
    }
  }

  const pct = isLoading ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayValue = isLoading ? '--' : Number.isInteger(value) ? value : value.toFixed(1);

  // Arc geometry: 240-degree sweep, radius 50
  const R = 50;
  const SWEEP_DEG = 240;
  const ARC_LEN = 2 * Math.PI * R * (SWEEP_DEG / 360);
  const offset = ARC_LEN - (ARC_LEN * pct / 100);
  const ROTATE = 150;

  return `
    <div class="gauge-card${isLoading ? ' loading' : ''}"
         role="meter" aria-label="${label}"
         aria-valuenow="${isLoading ? '' : value}"
         aria-valuemin="${min}" aria-valuemax="${max}">
      <svg class="gauge-arc" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="gauge-track"
          cx="60" cy="60" r="${R}"
          fill="none"
          stroke="var(--gray-200)"
          stroke-width="10"
          stroke-linecap="round"
          stroke-dasharray="${ARC_LEN.toFixed(2)} 999"
          transform="rotate(${ROTATE} 60 60)"
        />
        <circle class="gauge-fill"
          cx="60" cy="60" r="${R}"
          fill="none"
          stroke="${arcColor}"
          stroke-width="10"
          stroke-linecap="round"
          stroke-dasharray="${ARC_LEN.toFixed(2)} 999"
          stroke-dashoffset="${offset.toFixed(2)}"
          transform="rotate(${ROTATE} 60 60)"
        />
        <text x="60" y="56" text-anchor="middle"
              font-family="var(--font-body)" font-weight="700"
              font-size="22" fill="var(--text)">
          ${displayValue}
        </text>
        <text x="60" y="72" text-anchor="middle"
              font-family="var(--font-body)" font-weight="500"
              font-size="11" fill="var(--text-muted)">
          ${unit}
        </text>
      </svg>
      <div class="gauge-label-row">
        <span class="gauge-icon">${icon}</span>
        <span class="gauge-label">${label}</span>
      </div>
      <div class="gauge-status ${isLoading ? '' : status}">${isLoading ? 'Reading...' : statusText}</div>
    </div>
  `;
}
