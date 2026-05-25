import { getAQICategory } from '@/app/lib/airQuality';

/** Tailwind utility classes tied to @theme AQI tokens */
const AQI_CLASS_BY_KEY = {
  good: {
    text: 'text-aqi-good',
    bg: 'bg-aqi-good',
    bgSoft: 'bg-aqi-good-soft',
    border: 'border-aqi-good',
  },
  moderate: {
    text: 'text-aqi-moderate',
    bg: 'bg-aqi-moderate',
    bgSoft: 'bg-aqi-moderate-soft',
    border: 'border-aqi-moderate',
  },
  sensitive: {
    text: 'text-aqi-sensitive',
    bg: 'bg-aqi-sensitive',
    bgSoft: 'bg-aqi-sensitive-soft',
    border: 'border-aqi-sensitive',
  },
  unhealthy: {
    text: 'text-aqi-unhealthy',
    bg: 'bg-aqi-unhealthy',
    bgSoft: 'bg-aqi-unhealthy-soft',
    border: 'border-aqi-unhealthy',
  },
  'very-unhealthy': {
    text: 'text-aqi-very-unhealthy',
    bg: 'bg-aqi-very-unhealthy',
    bgSoft: 'bg-aqi-very-unhealthy-soft',
    border: 'border-aqi-very-unhealthy',
  },
  hazardous: {
    text: 'text-aqi-hazardous',
    bg: 'bg-aqi-hazardous',
    bgSoft: 'bg-aqi-hazardous-soft',
    border: 'border-aqi-hazardous',
  },
};

/**
 * Category metadata plus design-system class names for a given AQI value.
 * @param {number} aqi
 */
export function getAqiDisplay(aqi) {
  const category = getAQICategory(aqi);
  const classes = AQI_CLASS_BY_KEY[category.themeKey] ?? AQI_CLASS_BY_KEY.good;
  return { category, classes };
}
