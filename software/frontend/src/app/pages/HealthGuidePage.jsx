import React, { useState, useMemo } from "react";
import { 
  Heart, 
  Users, 
  Baby, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Wind, 
  AlertTriangle,
  ChevronRight,
  Droplets,
  Zap
} from "lucide-react";
import { fetchHealthGuide } from "@/app/lib/api/djangoClient";
import { useReadings } from "@/app/hooks/useReadings";
import { groupReadingsBySensor } from "@/app/lib/sensorData";
import { useSensor } from "@/app/context/SensorContext";

const panelClass = "rounded-3xl border border-white bg-white/70 backdrop-blur-xl p-8 shadow-2xl hover:shadow-blue-100/50 transition-all duration-500";

export default function HealthGuidePage() {
  const [activeGroup, setActiveGroup] = useState("general");
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedSensor, setSelectedSensor } = useSensor();

  const { data: readings } = useReadings({ limit: 100 });
  const sensors = useMemo(() => {
    return groupReadingsBySensor(readings);
  }, [readings]);

  const currentSensorData = useMemo(() => {
    if (!selectedSensor) return null;
    return sensors.find(s => s.id === selectedSensor);
  }, [selectedSensor, sensors]);

  const currentAQI = currentSensorData?.latestReading?.AQI || 0;

  React.useEffect(() => {
    fetchHealthGuide(currentAQI)
      .then(data => setGuideData(data))
      .catch(err => console.error("Failed to fetch health guide", err))
      .finally(() => setLoading(false));
  }, [currentAQI]);

  React.useEffect(() => {
    if (!selectedSensor && sensors.length) {
      setSelectedSensor(sensors[0].id);
    }
  }, [sensors, selectedSensor]);

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { status: "Good", color: "bg-green-500", text: "Air quality is satisfactory." };
    if (aqi <= 100) return { status: "Moderate", color: "bg-yellow-500", text: "Air quality is acceptable." };
    if (aqi <= 150) return { status: "Unhealthy (SG)", color: "bg-orange-500", text: "Sensitive groups may experience health effects." };
    if (aqi <= 200) return { status: "Unhealthy", color: "bg-red-500", text: "Everyone may begin to experience health effects." };
    return { status: "Hazardous", color: "bg-rose-900", text: "Emergency conditions." };
  };

  const currentStatus = getAQIStatus(currentAQI);

  const healthGroups = useMemo(() => {
    if (!guideData) return [
      { id: "general", label: "General Public", icon: Users, color: "blue" },
      { id: "sensitive", label: "Sensitive Groups", icon: ShieldAlert, color: "amber" },
      { id: "children", label: "Children & Seniors", icon: Baby, color: "green" },
      { id: "asthmatic", label: "Respiratory Issues", icon: Heart, color: "rose" },
    ];
    
    const icons = { general: Users, sensitive: ShieldAlert, children: Baby, asthmatic: Heart };
    const colors = { general: "blue", sensitive: "amber", children: "green", asthmatic: "rose" };
    
    return guideData.groups.map(g => ({
      ...g,
      icon: icons[g.id] || Info,
      color: colors[g.id] || "blue"
    }));
  }, [guideData]);

  const recommendations = useMemo(() => {
    const map = {
      general: [],
      sensitive: [],
      children: [],
      asthmatic: []
    };
    if (guideData && guideData.groups) {
      guideData.groups.forEach(g => {
        map[g.id] = g.recommendations;
      });
    }
    return map;
  }, [guideData]);

  const aqiScales = useMemo(() => {
    if (!guideData) return [
      { range: "0 - 50", status: "Good", color: "bg-green-500", text: "Air quality is satisfactory." },
    ];
    
    const colors = { green: "bg-green-500", yellow: "bg-yellow-500", orange: "bg-orange-500", red: "bg-red-500", purple: "bg-purple-500", maroon: "bg-rose-900" };
    
    return guideData.aqi_scale.map(s => ({
      range: s.range,
      status: s.status,
      color: colors[s.color] || "bg-blue-500",
      text: s.description
    }));
  }, [guideData]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-bold">Preparing Health Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* HERO SECTION */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-6">
            <Droplets className="h-4 w-4" /> Comprehensive Health Insights
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
            Protect Your <span className="text-blue-600">Health</span> & Well-being
          </h1>
          <p className="text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Personalized health recommendations based on real-time air quality data and scientific guidelines for different demographic groups.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: GROUP SELECTION & RECS */}
          <div className="lg:col-span-7 space-y-8">
            {/* CURRENT SENSOR STATUS */}
            <div className={`${panelClass} border-l-8 border-l-blue-500`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Current Sensor Condition</h3>
                  <p className="text-sm text-slate-500">Live recommendations based on local monitoring</p>
                </div>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                  value={selectedSensor}
                  onChange={(e) => setSelectedSensor(e.target.value)}
                >
                  <option value="">Select Location...</option>
                  {sensors.map(s => (
                    <option key={s.id} value={s.id}>📍 {s.id}</option>
                  ))}
                </select>
              </div>

              {currentSensorData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50">
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm">
                    <span className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Current AQI</span>
                    <span className={`text-6xl font-black ${currentStatus.color.replace('bg-', 'text-')}`}>{currentAQI}</span>
                    <span className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase text-white ${currentStatus.color}`}>
                      {currentStatus.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800">Instant Advisory</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {currentStatus.text} For the <span className="font-bold text-blue-600">{activeGroup}</span> group, we recommend:
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-white p-3 rounded-lg border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {recommendations[activeGroup] && recommendations[activeGroup][0] ? recommendations[activeGroup][0] : "Loading recommendations..."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={panelClass}>
              <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <Zap className="text-yellow-500 fill-yellow-500 h-6 w-6" /> Group Health Guide
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                {healthGroups.map((group) => {
                  const Icon = group.icon;
                  const isActive = activeGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveGroup(group.id)}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 ${
                        isActive 
                        ? `bg-${group.color}-50 border-${group.color}-500 shadow-lg transform -translate-y-1` 
                        : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className={`p-3 rounded-full mb-3 ${isActive ? `bg-${group.color}-500 text-white` : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-xs font-bold text-center ${isActive ? `text-${group.color}-700` : "text-slate-600"}`}>
                        {group.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {recommendations[activeGroup] && recommendations[activeGroup].map((rec, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="mt-1">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                  </div>
                ))}
                {(!recommendations[activeGroup] || recommendations[activeGroup].length === 0) && (
                  <div className="p-10 text-center text-slate-400 font-medium italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No specific recommendations available for this group at the current AQI level.
                  </div>
                )}
              </div>

              <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-200">
                <div className="flex items-center gap-4 mb-3">
                  <Info className="h-6 w-6 text-white" />
                  <h4 className="font-bold text-lg">Did you know?</h4>
                </div>
                <p className="text-white text-sm leading-relaxed font-medium">
                  Indoor air can sometimes be 2-5 times more polluted than outdoor air. Ensure proper ventilation but keep windows closed during peak outdoor pollution periods.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: AQI SCALE INFO */}
          <div className="lg:col-span-5 space-y-8">
            <div className={panelClass}>
              <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <Wind className="text-blue-500 h-6 w-6" /> Understanding AQI
              </h3>
              
              <div className="space-y-4">
                {aqiScales.map((scale, index) => (
                  <div key={index} className="relative overflow-hidden rounded-2xl border border-slate-100 p-5 group hover:bg-slate-50 transition-colors">
                    <div className={`absolute top-0 left-0 w-2 h-full ${scale.color}`}></div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-slate-900">{scale.range}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${scale.color}`}>
                        {scale.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-bold">
                      {scale.text}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
