import { Users, Baby, PersonStanding, Heart, Stethoscope, HardHat } from 'lucide-react';
import { getAQICategory } from './airQuality';

function byTier(copy) {
  return (aqi) => {
    const key = getAQICategory(aqi).themeKey;
    return copy[key] ?? copy.good;
  };
}

export const HEALTH_GROUPS = [
  {
    key: 'general',
    label: 'General public',
    Icon: Users,
    guidance: byTier({
      good: 'Air quality is good — no precautions needed for any outdoor activity.',
      moderate: 'Air quality is acceptable. Most people can continue normal activities.',
      sensitive: 'Consider reducing prolonged or heavy outdoor exertion if you notice symptoms.',
      unhealthy: 'Reduce prolonged outdoor exertion, especially strenuous activity.',
      'very-unhealthy': 'Avoid prolonged outdoor exertion; move activities indoors where possible.',
      hazardous: 'Avoid all outdoor physical activity and stay indoors with windows closed.',
    }),
  },
  {
    key: 'children',
    label: 'Children',
    Icon: Baby,
    guidance: byTier({
      good: 'Safe for outdoor play and school activities as usual.',
      moderate: 'Generally safe, but watch for coughing or unusual fatigue during play.',
      sensitive: 'Shorten outdoor playtime and avoid vigorous games during peak hours.',
      unhealthy: 'Keep outdoor play brief; prefer indoor activities for the rest of the day.',
      'very-unhealthy': 'Keep children indoors; postpone outdoor school activities and sports.',
      hazardous: 'Keep children indoors at all times with windows and doors closed.',
    }),
  },
  {
    key: 'elderly',
    label: 'Elderly',
    Icon: PersonStanding,
    guidance: byTier({
      good: 'No restrictions — a good day for a walk or time outdoors.',
      moderate: 'Fine for most, but pace outdoor activity if you tire easily.',
      sensitive: 'Reduce time spent on strenuous outdoor errands or exercise.',
      unhealthy: 'Limit outdoor time; run errands earlier in the day when levels are lower.',
      'very-unhealthy': 'Stay indoors as much as possible and keep any medication on hand.',
      hazardous: 'Remain indoors; seek medical advice promptly if breathless or dizzy.',
    }),
  },
  {
    key: 'pregnant',
    label: 'Pregnant women',
    Icon: Heart,
    guidance: byTier({
      good: 'No special precautions needed today.',
      moderate: 'Comfortable for normal daily activity.',
      sensitive: 'Reduce prolonged time outdoors during peak traffic or dusty hours.',
      unhealthy: 'Limit outdoor exposure and prefer well-ventilated indoor spaces.',
      'very-unhealthy': 'Stay indoors where possible; consult a doctor if you feel unwell.',
      hazardous: 'Avoid outdoor exposure entirely and seek medical advice if symptomatic.',
    }),
  },
  {
    key: 'respiratory',
    label: 'Respiratory & heart conditions',
    Icon: Stethoscope,
    guidance: byTier({
      good: 'Low risk today — routine precautions are enough.',
      moderate: 'Keep rescue medication accessible as a precaution.',
      sensitive: 'Reduce prolonged outdoor exertion; keep medication within reach.',
      unhealthy: 'Avoid outdoor exertion; monitor symptoms and use medication as prescribed.',
      'very-unhealthy': 'Stay indoors, keep windows closed, and avoid physical exertion.',
      hazardous: 'Remain indoors; contact a doctor immediately if symptoms worsen.',
    }),
  },
  {
    key: 'outdoor-workers',
    label: 'Outdoor workers',
    Icon: HardHat,
    guidance: byTier({
      good: 'Normal working conditions — no extra precautions needed.',
      moderate: 'Take regular breaks if working near dust or traffic sources.',
      sensitive: 'Take more frequent breaks and avoid the most strenuous tasks outdoors.',
      unhealthy: 'Use a mask for dusty or high-exposure tasks; schedule frequent indoor breaks.',
      'very-unhealthy': 'Minimize outdoor work; use protective masks and rotate shifts indoors.',
      hazardous: 'Postpone non-essential outdoor work; use protective equipment if unavoidable.',
    }),
  },
];
