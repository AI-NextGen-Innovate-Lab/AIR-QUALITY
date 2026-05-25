/** Public-facing copy for pollutants & weather parameters we report (IQAir-style education). */

export const EDUCATION_INTRO = {
  title: 'Understanding the air you breathe',
  description:
    'Our network measures fine particles, coarse dust, and local weather conditions. Learn what each signal means for health, comfort, and daily planning in Dar es Salaam.',
};

export const POLLUTANT_INSIGHTS = [
  {
    id: 'pm25',
    name: 'PM₂.₅',
    shortName: 'Fine particles',
    unit: 'µg/m³',
    symbol: 'PM2.5',
    image: null,
    accent: 'aqi-unhealthy',
    what:
      'Particulate matter smaller than 2.5 micrometers — about 30× thinner than a human hair. It comes from vehicle exhaust, road dust, biomass burning, industry, and sea salt.',
    health:
      'Enters deep into the lungs and bloodstream. Linked to asthma, heart disease, stroke, and premature death. Children, older adults, and people with respiratory conditions are most vulnerable.',
    actions:
      'When PM₂.₅ is elevated, limit strenuous outdoor exercise, keep windows closed near busy roads, and use a mask (N95) during heavy smoke or dust events.',
  },
  {
    id: 'pm10',
    name: 'PM₁₀',
    shortName: 'Coarse particles',
    unit: 'µg/m³',
    symbol: 'PM10',
    image: null,
    accent: 'aqi-moderate',
    what:
      'Particles up to 10 micrometers. Includes dust from construction, unpaved roads, farming, and pollen. Often visible as haze on dry, windy days.',
    health:
      'Irritates the nose, throat, and upper airways. High levels worsen allergies and can trigger coughing or breathing discomfort during outdoor work.',
    actions:
      'Sensitive groups should reduce time outdoors when PM₁₀ spikes, especially during harmattan dust or construction seasons.',
  },
];

export const WEATHER_INSIGHTS = [
  {
    id: 'temperature',
    name: 'Temperature',
    unit: '°C',
    symbol: 'Temperature',
    what:
      'Air temperature affects how pollutants disperse. Hot afternoons can lift particles higher; cool nights may trap pollution near the ground.',
    impact:
      'Heat plus stagnant air can increase ozone formation in urban areas. Very hot days also raise health stress when particle levels are already high.',
  },
  {
    id: 'humidity',
    name: 'Relative humidity',
    unit: '%',
    symbol: 'RelativeHumidity',
    what:
      'How much moisture the air holds relative to saturation. Coastal Dar es Salaam often sees high humidity, which changes how dust and smoke behave.',
    impact:
      'High humidity can make haze look thicker and affect sensor readings slightly. Extremely dry air can keep dust airborne longer.',
  },
  {
    id: 'absolute-humidity',
    name: 'Absolute humidity',
    unit: 'g/m³',
    symbol: 'AbsoluteHumidity',
    what:
      'The actual mass of water vapor in air, independent of temperature. Useful for comparing moisture across day and night.',
    impact:
      'Helps researchers link moisture with particle aging, sea-salt aerosols, and comfort indices alongside PM measurements.',
  },
  {
    id: 'pressure',
    name: 'Atmospheric pressure',
    unit: 'hPa',
    symbol: 'Pressure',
    what:
      'Weight of the atmosphere. Slow-moving high-pressure systems often bring calm winds and limited mixing of surface air.',
    impact:
      'Stagnant conditions under high pressure can let PM₂.₅ and PM₁₀ build up near roads and neighborhoods until wind or rain clears the air.',
  },
];

export const WEATHER_POLLUTION_LINKS = [
  {
    title: 'Wind & mixing',
    body: 'Strong onshore or seasonal winds dilute pollution; calm nights let exhaust and dust pool in low-lying areas.',
  },
  {
    title: 'Rain & washout',
    body: 'Rainfall temporarily removes particles from the air, often producing a sharp drop in PM₂.₅ on our live charts.',
  },
  {
    title: 'Dust seasons',
    body: 'Dry spells and construction activity raise PM₁₀. Pair particle data with humidity and wind to interpret dust events.',
  },
  {
    title: 'Coastal influence',
    body: 'Sea breeze and salt aerosols interact with urban emissions. Temperature and humidity help explain sudden shifts at coastal sensors.',
  },
];

export const AQI_EDUCATION = {
  title: 'Air Quality Index (AQI)',
  paragraphs: [
    'We use the US EPA AQI scale (0–500) computed from PM₂.₅ and PM₁₀. The displayed index is the highest sub-index — the pollutant driving risk right now.',
    'Green (0–50) means air is satisfactory for most people. Orange and red levels mean increasing restrictions for outdoor activity, especially for children and sensitive groups.',
  ],
  bands: [
    { range: '0–50', label: 'Good', note: 'Enjoy outdoor activities.' },
    { range: '51–100', label: 'Moderate', note: 'Unusually sensitive people should consider limiting exertion.' },
    { range: '101–150', label: 'Unhealthy for sensitive groups', note: 'Children and asthmatics should reduce outdoor time.' },
    { range: '151+', label: 'Unhealthy', note: 'Everyone may feel effects; limit prolonged outdoor exertion.' },
  ],
};
