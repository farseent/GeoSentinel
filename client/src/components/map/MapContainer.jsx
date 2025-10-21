// MapContainer.jsx
import { MapContainer as LeafletMap, TileLayer, FeatureGroup, useMap as useLeafletMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from 'leaflet'
import useAuth from "../../hooks/useAuth";
import useMap from "../../hooks/useMap";
import { useEffect, useRef, useState } from "react";
import "./../../styles/leaflet-draw-custom.css";

const LocationButton = () => {
  const map = useLeafletMap();
  const [isLocating, setIsLocating] = useState(false);
  const locationMarkersRef = useRef({
    circle: null,
    marker: null
  }); // Ref to track location markers separately

  const clearAccuracyCircle = () => {
    // Remove only the accuracy circle, keep the marker
    if (locationMarkersRef.current.circle && map.hasLayer(locationMarkersRef.current.circle)) {
      map.removeLayer(locationMarkersRef.current.circle);
      locationMarkersRef.current.circle = null;
    }
  };

  const clearAllLocationMarkers = () => {
    // Remove both circle and marker
    if (locationMarkersRef.current.circle && map.hasLayer(locationMarkersRef.current.circle)) {
      map.removeLayer(locationMarkersRef.current.circle);
    }
    if (locationMarkersRef.current.marker && map.hasLayer(locationMarkersRef.current.marker)) {
      map.removeLayer(locationMarkersRef.current.marker);
    }
    locationMarkersRef.current = { circle: null, marker: null };
  };

  const locateUser = () => {
    setIsLocating(true);
    
    // Clear previous location markers first
    clearAllLocationMarkers();
    
    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
      timeout: 10000
    });

    map.once('locationfound', (e) => {
      setIsLocating(false);
      
      const radius = e.accuracy;

      // Add new location marker (circle)
      const accuracyCircle = L.circle(e.latlng, {
        radius: radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        weight: 2,
        isLocationMarker: true
      }).addTo(map);

      // Add new location marker (center dot)
      const locationMarker = L.marker(e.latlng, {
        icon: L.divIcon({
          html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          className: 'location-marker'
        }),
        isLocationMarker: true
      }).addTo(map).bindPopup(`Your location (accuracy: ${Math.round(radius)} meters)`).openPopup();

      // Store markers separately in ref
      locationMarkersRef.current = {
        circle: accuracyCircle,
        marker: locationMarker
      };

      // Add click event to map to clear only the circle when clicking outside
      const handleMapClick = (clickEvent) => {
        // Check if click is outside the accuracy circle and circle exists
        if (locationMarkersRef.current.circle) {
          const distance = e.latlng.distanceTo(clickEvent.latlng);
          if (distance > radius) {
            clearAccuracyCircle(); // Remove only the circle, keep the marker
            // Remove this click event listener after clearing the circle
            map.off('click', handleMapClick);
          }
        }
      };

      // Add click event listener to map
      map.on('click', handleMapClick);
    });

    map.once('locationerror', (e) => {
      setIsLocating(false);
      alert(`Location access denied or unavailable: ${e.message}`);
    });
  };

  return (
    <div className="leaflet-top leaflet-left">
      <div className="leaflet-control" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {/* Location Button */}
        <div className="leaflet-control-location">
          <button
            onClick={locateUser}
            disabled={isLocating}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-1 px-1 border border-gray-300 rounded-lg shadow-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
            title="Find my location"
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

  const MapContainer = () => {
    const { isAuthenticated } = useAuth();
    const { aoi, setAoi, setCoordinates, onMapLoad } = useMap(); // Your custom hook
    const featureGroupRef = useRef();

    
    const _onCreated = (e) => {
    const layer = e.layer;

    // 🔹 Remove any existing layers before adding a new one
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }

    featureGroupRef.current.addLayer(layer); // Add only the current layer

    const bounds = layer.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const nw = [ne.lat, sw.lng];
    const se = [sw.lat, ne.lng];

    const coordinates = [
      [sw.lng, sw.lat],
      [se[1], se[0]],
      [ne.lng, ne.lat],
      [nw[1], nw[0]],
      [sw.lng, sw.lat],
    ];

    const earthRadius = 6371;
    const latDiff = Math.abs(ne.lat - sw.lat);
    const lngDiff = Math.abs(ne.lng - sw.lng);
    const meanLat = (ne.lat + sw.lat) / 2;
    const area =
      latDiff * (Math.PI / 180) * earthRadius *
      lngDiff * (Math.PI / 180) * earthRadius *
      Math.cos(meanLat * Math.PI / 180);

    setAoi({
      type: "rectangle",
      coordinates,
      bounds: {
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng,
      },
      area: Math.abs(area),
    });

    setCoordinates(coordinates);
  };


  const _onDeleted = () => {
    // Clear AOI when shapes are deleted
    setAoi(null);
    setCoordinates(null);
  };

  const _onEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      if (layer.getBounds) {
        const bounds = layer.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const nw = [ne.lat, sw.lng];
        const se = [sw.lat, ne.lng];

        const coordinates = [
          [sw.lng, sw.lat],
          [se[1], se[0]],
          [ne.lng, ne.lat],
          [nw[1], nw[0]],
          [sw.lng, sw.lat],
        ];

        const earthRadius = 6371;
        const latDiff = Math.abs(ne.lat - sw.lat);
        const lngDiff = Math.abs(ne.lng - sw.lng);
        const meanLat = (ne.lat + sw.lat) / 2;
        const area =
          latDiff * (Math.PI / 180) * earthRadius *
          lngDiff * (Math.PI / 180) * earthRadius *
          Math.cos(meanLat * Math.PI / 180);

        setAoi({
          type: "rectangle",
          coordinates,
          bounds: {
            north: ne.lat,
            south: sw.lat,
            east: ne.lng,
            west: sw.lng,
          },
          area: Math.abs(area),
        });
        setCoordinates(coordinates);
      }
    });
  };

  // Clear layers when AOI is cleared from outside
  useEffect(() => {
    if (!aoi && featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      layers.forEach((layer) => {
        featureGroupRef.current.removeLayer(layer);
      });
    }
  }, [aoi]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: "400px" }}>
      <LeafletMap
        center={[10.5, 77.5]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        whenCreated={onMapLoad}
        zoomControl={false}
      >
        {/* ESRI World Imagery (satellite) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri, Maxar, Earthstar Geographics"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri, USGS"
          opacity={1.0}
        />

        {/* Custom Map Controls */}
        <LocationButton />

        {isAuthenticated && (
          <FeatureGroup ref={featureGroupRef} className = ''>
            <EditControl
              position="topright" // This will now appear below the location button
              draw={{
                rectangle: {
                  shapeOptions: {
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2,
                    weight: 3,
                  },
                },
                polygon: false,
                circle: false,
                polyline: false,
                marker: false,
                circlemarker: false,
              }}
              edit={{
                remove: true,
                edit: true,
              }}
              onCreated={_onCreated}
              onDeleted={_onDeleted}
              onEdited={_onEdited}
            />
          </FeatureGroup>
        )}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;