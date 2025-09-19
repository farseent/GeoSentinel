// // src/components/map/MapContainer.jsx
// import React, { useEffect, useRef } from 'react';
// import  useMap  from '../../hooks/useMap';
// import LoadingSpinner from '../common/LoadingSpinner';

// const MapContainer = ({ children }) => {
//   const mapRef = useRef(null);
//   const { initializeMap, mapInstance, isLoading, error } = useMap();

//   useEffect(() => {
//     if (mapRef.current && !mapInstance) {
//       initializeMap(mapRef.current);
//     }
//   }, [initializeMap, mapInstance]);

//   if (error) {
//     return (
//       <div className="h-full flex items-center justify-center bg-gray-100">
//         <div className="text-center">
//           <div className="text-4xl mb-4">🗺️</div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-2">
//             Map Loading Error
//           </h3>
//           <p className="text-sm text-gray-600 max-w-sm">
//             {error}
//           </p>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
//           >
//             Reload Page
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative h-full">
//       {/* Map Container */}
//       <div 
//         ref={mapRef} 
//         className="h-full w-full"
//         style={{ minHeight: '400px' }}
//       />
      
//       {/* Loading Overlay */}
//       {isLoading && (
//         <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
//           <div className="text-center">
//             <LoadingSpinner size="lg" />
//             <p className="mt-2 text-sm text-gray-600">Loading map...</p>
//           </div>
//         </div>
//       )}

//       {/* Map Controls and Overlays */}
//       {mapInstance && children}

//       {/* Default Map Message */}
//       {!isLoading && !mapInstance && (
//         <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
//           <div className="text-center">
//             <div className="text-4xl mb-4">🌍</div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">
//               Global Map View
//             </h3>
//             <p className="text-sm text-gray-600">
//               Interactive satellite imagery map
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MapContainer;

import { MapContainer as LeafletMap, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useMap from "../../hooks/useMap";

const MapContainer = ({ children }) => {
  const { onMapLoad } = useMap();

  // You can add loading state if you want, but React-Leaflet handles map rendering itself

  return (
    <div className="relative h-full w-full" style={{ minHeight: "400px" }}>
      <LeafletMap
        center={[10.5, 77.5]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        whenCreated={onMapLoad}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {children}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;