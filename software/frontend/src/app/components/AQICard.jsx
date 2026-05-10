import React from 'react';
import { calculateAQI, getAQICategory } from '@/app/lib/airQuality';
import {
  getLatestValue,
  isPM25Measurement,
  isPM10Measurement,
} from '@/app/lib/sensorData';

export function AQICard({ sensorId, measurements = [], onClick }) {
  const latestPM25 = getLatestValue(measurements, isPM25Measurement);
  const latestPM10 = getLatestValue(measurements, isPM10Measurement);

  const aqi = calculateAQI(latestPM25, latestPM10);
  const category = getAQICategory(aqi.value);

  const inner = (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Air Quality Index</h3>
          <p className="text-sm text-gray-500">{sensorId || 'Live Sensor'}</p>
        </div>
        <div className="text-right">
          <div
            className="text-5xl font-bold"
            style={{ color: category.color }}
          >
            {aqi.value}
          </div>
          <div className="text-sm font-medium" style={{ color: category.color }}>
            {category.label}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            PM<sub>2.5</sub> (ATM)
          </span>
          <span className="font-medium">
            {latestPM25 !== undefined ? latestPM25.toFixed(1) : '--'} µg/m³
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            PM<sub>10</sub> (ATM)
          </span>
          <span className="font-medium">
            {latestPM10 !== undefined ? latestPM10.toFixed(1) : '--'} µg/m³
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dominant Pollutant</span>
          <span className="font-medium">{aqi.dominant}</span>
        </div>
      </div>

      <div className="mt-8 h-3 rounded-full overflow-hidden bg-gray-200 flex">
        <div className="h-full w-[20%] bg-[#22c55e]" />
        <div className="h-full w-[20%] bg-[#eab308]" />
        <div className="h-full w-[20%] bg-[#f97316]" />
        <div className="h-full w-[20%] bg-[#ef4444]" />
        <div className="h-full w-[20%] bg-[#7c3aed]" />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>300+</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-left w-full hover:shadow-xl transition-shadow cursor-pointer"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {inner}
    </div>
  );
}

export default AQICard;
