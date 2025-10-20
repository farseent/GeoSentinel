// MapContainer.jsx (updated)
import { MapContainer as LeafletMap, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import useAuth from "../../hooks/useAuth";
import useMap from "../../hooks/useMap";
import { useEffect, useRef } from "react";

const MapContainer = () => {
  const { isAuthenticated } = useAuth();
  const { aoi, setAoi, setCoordinates, onMapLoad } = useMap();
  const featureGroupRef = useRef();

  const _onCreated = (e) => {
    const layer = e.layer;
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

    // Area calculation (rough km²)
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

        {isAuthenticated && (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
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

      {/* AOI Selected Overlay - Moved to avoid overlap with search */}
      {isAuthenticated && aoi && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 border border-green-300 p-3 rounded-lg shadow-lg z-10">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium text-green-800">AOI Selected</span>
          </div>
          <div className="text-xs text-green-700">
            Area: {aoi.area?.toFixed(2)} km² • Use the delete tool (🗑️) to remove or edit tool (✏️) to modify.
          </div>
        </div>
      )}

      {/* Status Overlay - Moved to avoid overlap with search */}
      {isAuthenticated && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 border border-gray-200 px-3 py-2 rounded-lg shadow-lg z-10">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${aoi ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
            <span className="text-sm font-medium text-gray-800">
              {aoi ? 'AOI Selected' : 'Ready to Draw AOI'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;