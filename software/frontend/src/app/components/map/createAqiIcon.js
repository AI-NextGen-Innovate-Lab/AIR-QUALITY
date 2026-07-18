import L from 'leaflet';

export function createAqiIcon(aqi, category, selected) {
  const size = selected ? 48 : 42;
  const ring = selected
    ? 'box-shadow:0 0 0 3px rgba(13,148,136,0.5);transform:scale(1.08);'
    : '';

  return L.divIcon({
    className: 'aqi-leaflet-marker',
    html: `<div class="aqi-marker-pin" style="
      width:${size}px;height:${size}px;
      background:${category.color};
      color:${category.textColor};
      ${ring}
    ">${aqi}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
