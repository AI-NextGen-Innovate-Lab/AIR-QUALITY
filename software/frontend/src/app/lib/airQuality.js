const pm25Breakpoints = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

const pm10Breakpoints = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
];

const calculateSubIndex = (C, breakpoints) => {
  if (C === undefined || C === null || Number.isNaN(Number(C))) return 0;
  const n = Number(C);
  const bp = breakpoints.find((b) => n >= b.cLow && n <= b.cHigh);
  if (!bp) return 0;
  const { cLow, cHigh, iLow, iHigh } = bp;
  return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (n - cLow) + iLow);
};

export function calculateAQI(pm25, pm10) {
  const aqiPM25 = calculateSubIndex(pm25, pm25Breakpoints);
  const aqiPM10 = calculateSubIndex(pm10, pm10Breakpoints);
  const value = Math.max(aqiPM25, aqiPM10);
  const dominant = aqiPM25 >= aqiPM10 ? 'PM2.5' : 'PM10';
  return { value, dominant };
}

/** @typedef {'good'|'moderate'|'sensitive'|'unhealthy'|'very-unhealthy'|'hazardous'} AqiThemeKey */

const AQI_THEMES = {
  good: {
    label: 'Good',
    themeKey: 'good',
    color: '#22c55e',
    bgSoft: '#dcfce7',
    borderColor: '#86efac',
    textColor: '#fff',
    description: 'Air quality is satisfactory; little or no risk.',
  },
  moderate: {
    label: 'Moderate',
    themeKey: 'moderate',
    color: '#eab308',
    bgSoft: '#fef9c3',
    borderColor: '#fde047',
    textColor: '#000',
    description:
      'Acceptable for most people; unusually sensitive people may have concerns.',
  },
  sensitive: {
    label: 'Unhealthy (Sensitive)',
    themeKey: 'sensitive',
    color: '#f97316',
    bgSoft: '#ffedd5',
    borderColor: '#fdba74',
    textColor: '#fff',
    description: 'Members of sensitive groups may experience health effects.',
  },
  unhealthy: {
    label: 'Unhealthy',
    themeKey: 'unhealthy',
    color: '#ef4444',
    bgSoft: '#fee2e2',
    borderColor: '#fca5a5',
    textColor: '#fff',
    description:
      'Everyone may begin to experience health effects; sensitive groups more serious.',
  },
  'very-unhealthy': {
    label: 'Very Unhealthy',
    themeKey: 'very-unhealthy',
    color: '#7c3aed',
    bgSoft: '#ede9fe',
    borderColor: '#c4b5fd',
    textColor: '#fff',
    description: 'Health alert: everyone may experience serious effects.',
  },
  hazardous: {
    label: 'Hazardous',
    themeKey: 'hazardous',
    color: '#7f1d1d',
    bgSoft: '#fecaca',
    borderColor: '#f87171',
    textColor: '#fff',
    description: 'Emergency conditions; everyone is more likely to be affected.',
  },
};

export function getAQICategory(aqi) {
  const n = Number(aqi) || 0;
  if (n <= 50) return { ...AQI_THEMES.good };
  if (n <= 100) return { ...AQI_THEMES.moderate };
  if (n <= 150) return { ...AQI_THEMES.sensitive };
  if (n <= 200) return { ...AQI_THEMES.unhealthy };
  if (n <= 300) return { ...AQI_THEMES['very-unhealthy'] };
  return { ...AQI_THEMES.hazardous };
}

/** US EPA AQI scale segments for scale bars and legends */
export const AQI_SCALE_SEGMENTS = [
  { max: 50, ...AQI_THEMES.good },
  { max: 100, ...AQI_THEMES.moderate },
  { max: 150, ...AQI_THEMES.sensitive },
  { max: 200, ...AQI_THEMES.unhealthy },
  { max: 300, ...AQI_THEMES['very-unhealthy'] },
  { max: 500, ...AQI_THEMES.hazardous },
];

export function getHealthRecommendations(aqi) {
  const n = Number(aqi) || 0;
  if (n <= 50)
    return [
      'Enjoy outdoor activities as usual.',
      'Open windows for ventilation if comfortable.',
    ];
  if (n <= 100)
    return [
      'Unusually sensitive people should consider reducing prolonged outdoor exertion.',
      'Everyone else can continue normal activities.',
    ];
  if (n <= 150)
    return [
      'Sensitive groups should reduce prolonged outdoor exertion.',
      'Consider wearing a mask during heavy outdoor activity.',
    ];
  if (n <= 200)
    return [
      'Everyone should reduce prolonged outdoor exertion.',
      'Sensitive groups should avoid prolonged outdoor exertion.',
    ];
  if (n <= 300)
    return [
      'Avoid all outdoor exertion.',
      'Sensitive groups should remain indoors and keep activity light.',
    ];
  return [
    'Avoid outdoor physical activity.',
    'Stay indoors with windows closed when possible.',
  ];
}
