import React, { createContext, useContext, useState, useRef } from "react";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  // AOI and date state
  const [aoi, setAoi] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [aoiEnabled, setAoiEnabled] = useState(false);

  // Store map instance
  const mapRef = useRef(null);

  // Called from MapContainer when map is created
  const handleMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  return (
    <MapContext.Provider
      value={{
        aoi, setAoi,
        dateRange, setDateRange,
        aoiEnabled, setAoiEnabled,
        map: mapRef,         // Expose map ref to consumers
        onMapLoad: handleMapLoad // Pass this to React-Leaflet's whenCreated
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => useContext(MapContext);