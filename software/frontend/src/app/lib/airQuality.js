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

export function getAQICategory(aqi) {
  const n = Number(aqi) || 0;
  if (n <= 50)
    return {
      label: 'Good',
      color: '#22c55e',
      textColor: '#fff',
      description: 'Air quality is satisfactory; little or no risk.',
    };
  if (n <= 100)
    return {
      label: 'Moderate',
      color: '#eab308',
      textColor: '#000',
      description: 'Acceptable for most people; unusually sensitive people may have concerns.',
    };
  if (n <= 150)
    return {
      label: 'Unhealthy (Sensitive)',
      color: '#f97316',
      textColor: '#fff',
      description: 'Members of sensitive groups may experience health effects.',
    };
  if (n <= 200)
    return {
      label: 'Unhealthy',
      color: '#ef4444',
      textColor: '#fff',
      description: 'Everyone may begin to experience health effects; sensitive groups more serious.',
    };
  if (n <= 300)
    return {
      label: 'Very Unhealthy',
      color: '#7c3aed',
      textColor: '#fff',
      description: 'Health alert: everyone may experience serious effects.',
    };
  return {
    label: 'Hazardous',
    color: '#7f1d1d',
    textColor: '#fff',
    description: 'Emergency conditions; everyone is more likely to be affected.',
  };
}

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
