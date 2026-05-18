import React, { createContext, useContext, useState } from "react";

const SensorContext = createContext();

export function SensorProvider({ children }) {
  const [selectedSensor, setSelectedSensor] = useState("");

  return (
    <SensorContext.Provider value={{ selectedSensor, setSelectedSensor }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return context;
}
