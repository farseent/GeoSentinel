const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ─── 1. Get Access Token ───────────────────────────────────────────────────
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.COPERNICUS_CLIENT_ID);
  params.append("client_secret", process.env.COPERNICUS_CLIENT_SECRET);

  const response = await axios.post(
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return response.data.access_token;
};

// ─── 2. Calculate Optimal Resolution from AOI ─────────────────────────────
const getOptimalResolution = (coordinates) => {
  const { north, south, east, west } = coordinates;

  const earthRadius = 6371000; // meters
  const latDiff = Math.abs(north - south) * (Math.PI / 180);
  const lngDiff = Math.abs(east - west) * (Math.PI / 180);
  const meanLat = ((north + south) / 2) * (Math.PI / 180);

  const heightM = latDiff * earthRadius;
  const widthM  = lngDiff * earthRadius * Math.cos(meanLat);

  // Sentinel-2 native resolution = 10m/pixel, cap at 2500px
  const width  = Math.min(2500, Math.max(64, Math.round(widthM / 10)));
  const height = Math.min(2500, Math.max(64, Math.round(heightM / 10)));

  return { width, height };
};

// ─── 3. Fetch Single Sentinel-2 Image ─────────────────────────────────────
const fetchSentinelImage = async (coordinates, date) => {
  const token = await getAccessToken();
  const { west, south, east, north } = coordinates;

  // ±15 day window around selected date
  const center = new Date(date);
  const from = new Date(center);
  const to = new Date(center);
  from.setDate(from.getDate() - 15);
  to.setDate(to.getDate() + 15);

  const fromStr = from.toISOString().split("T")[0];
  const toStr   = to.toISOString().split("T")[0];

  // Best quality PNG evalscript — contrast enhanced true color + alpha mask
  const evalscript = `
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B03", "B02", "dataMask"],
        output: { bands: 4, sampleType: "UINT8" }
      };
    }
    function evaluatePixel(sample) {
      const gain = 3.5;
      return [
        Math.min(1, sample.B04 * gain) * 255,
        Math.min(1, sample.B03 * gain) * 255,
        Math.min(1, sample.B02 * gain) * 255,
        sample.dataMask * 255
      ];
    }
  `;

  const { width, height } = getOptimalResolution(coordinates);

  const requestBody = {
    input: {
      bounds: {
        bbox: [west, south, east, north],
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: `${fromStr}T00:00:00Z`,
              to:   `${toStr}T23:59:59Z`,
            },
            maxCloudCoverage: 20,
          },
          processing: {
            upsampling: "BICUBIC",
            downsampling: "BICUBIC",
          },
        },
      ],
    },
    output: {
      width,
      height,
      responses: [
        {
          identifier: "default",
          format: { type: "image/png" },
        },
      ],
    },
    evalscript,
  };

  const response = await axios.post(
    "https://sh.dataspace.copernicus.eu/api/v1/process",
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      responseType: "arraybuffer",
    }
  );

  // Verify response is actually an image
  const contentType = response.headers["content-type"];
  if (!contentType || !contentType.includes("image")) {
    const errorText = Buffer.from(response.data).toString("utf-8");
    throw new Error(`Sentinel Hub error: ${errorText}`);
  }

  return response.data;
};

// ─── 4. Save Image Locally ─────────────────────────────────────────────────
const saveImageLocally = (buffer, requestId, filename) => {
  const dir = path.join(__dirname, "../uploads/requests", requestId.toString());

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buffer);

  return `uploads/requests/${requestId}/${filename}`;
};

// ─── 5. Fetch & Save Both Images ──────────────────────────────────────────
const fetchAndSaveImagePair = async (coordinates, dateFrom, dateTo, requestId) => {
  const date1 = new Date(dateFrom).toISOString().split("T")[0];
  const date2 = new Date(dateTo).toISOString().split("T")[0];

  const results = await Promise.allSettled([
    fetchSentinelImage(coordinates, date1),
    fetchSentinelImage(coordinates, date2),
  ]);

  if (results[0].status === "rejected") {
    throw new Error(`dateFrom image failed: ${results[0].reason.message}`);
  }
  if (results[1].status === "rejected") {
    throw new Error(`dateTo image failed: ${results[1].reason.message}`);
  }

  const imageFrom = saveImageLocally(results[0].value, requestId, "image_from.png");
  const imageTo   = saveImageLocally(results[1].value, requestId, "image_to.png");

  return { imageFrom, imageTo };
};

module.exports = { fetchAndSaveImagePair };

// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// // ─── 1. Get Access Token ───────────────────────────────────────────────────
// const getAccessToken = async () => {
//   const params = new URLSearchParams();
//   params.append("grant_type", "client_credentials");
//   params.append("client_id", process.env.COPERNICUS_CLIENT_ID);
//   params.append("client_secret", process.env.COPERNICUS_CLIENT_SECRET);

//   const response = await axios.post(
//     "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
//     params,
//     { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//   );

//   return response.data.access_token;
// };

// // ─── 2. Calculate Optimal Resolution from AOI ─────────────────────────────
// const getOptimalResolution = (coordinates) => {
//   const { north, south, east, west } = coordinates;

//   const earthRadius = 6371000; // meters
//   const latDiff = Math.abs(north - south) * (Math.PI / 180);
//   const lngDiff = Math.abs(east - west) * (Math.PI / 180);
//   const meanLat = ((north + south) / 2) * (Math.PI / 180);

//   const heightM = latDiff * earthRadius;
//   const widthM = lngDiff * earthRadius * Math.cos(meanLat);

//   // Sentinel-2 native resolution = 10m/pixel, cap at 2500px
//   const width = Math.min(2500, Math.max(64, Math.round(widthM / 10)));
//   const height = Math.min(2500, Math.max(64, Math.round(heightM / 10)));

//   return { width, height };
// };

// // ─── 3. Build Evalscript with Cloud + Shadow Masking ──────────────────────
// //
// //  SCL class reference:
// //    0  - No Data
// //    1  - Saturated / Defective
// //    2  - Dark Area Pixels
// //    3  - Cloud Shadows        ← masked
// //    4  - Vegetation
// //    5  - Bare Soils
// //    6  - Water
// //    7  - Clouds low probability
// //    8  - Clouds medium probability  ← masked
// //    9  - Clouds high probability    ← masked
// //    10 - Thin Cirrus               ← masked
// //    11 - Snow or Ice
// //
// //  CLP (s2cloudless cloud probability) is only available on Copernicus
// //  Data Space from 2026-02-28 onwards. For earlier dates we fall back to
// //  SCL-only masking which is always available for L2A products.
// //
// //  Cloudy/shadow pixels are made fully transparent (alpha = 0).
// //  All other valid pixels get contrast-enhanced true colour.
// // ──────────────────────────────────────────────────────────────────────────

// // Date from which CLM / CLP bands are available on Copernicus Data Space
// const CLP_AVAILABILITY_DATE = new Date("2026-02-28T00:00:00Z");

// /**
//  * Returns true if the entire date window (from → to) falls within the
//  * period where CLP is available.
//  */
// const isClpAvailable = (fromDate, toDate) => {
//   return new Date(fromDate) >= CLP_AVAILABILITY_DATE;
// };

// /**
//  * Build an evalscript that uses SCL alone (for dates before CLP availability)
//  * or SCL + CLP together (for dates after 2026-02-28).
//  */
// const buildEvalscript = (useCLP = false, cloudProbThreshold = 40) => {
//   const inputBands = useCLP
//     ? `["B04", "B03", "B02", "SCL", "CLP", "dataMask"]`
//     : `["B04", "B03", "B02", "SCL", "dataMask"]`;

//   const clpCheck = useCLP
//     ? `// Skip if cloud probability is above threshold (CLP is 0-255)
//     if (s.CLP / 255 > ${cloudProbThreshold / 100}) continue;`
//     : `// CLP not available for this date range — SCL masking only`;

//   return `
// //VERSION=3
// function setup() {
//   return {
//     input: ${inputBands},
//     output: { bands: 4, sampleType: "UINT8" },
//     mosaicking: "ORBIT"
//   };
// }

// function updateOutputMetadata(scenes, inputMetadata, outputMetadata) {
//   outputMetadata.userData = { sceneCount: scenes.length };
// }

// function evaluatePixel(samples) {
//   // SCL classes to treat as cloudy / invalid
//   const CLOUD_SCL = new Set([3, 8, 9, 10]);

//   // Iterate scenes — ORBIT mosaicking provides all acquisitions in the window.
//   // Pick the first scene where this pixel is cloud-free.
//   for (let i = 0; i < samples.length; i++) {
//     const s = samples[i];

//     if (s.dataMask === 0) continue;
//     if (CLOUD_SCL.has(s.SCL)) continue;

//     ${clpCheck}

//     const gain = 3.5;
//     return [
//       Math.min(255, Math.round(s.B04 * gain * 255)),
//       Math.min(255, Math.round(s.B03 * gain * 255)),
//       Math.min(255, Math.round(s.B02 * gain * 255)),
//       255
//     ];
//   }

//   // No clean pixel found → transparent
//   return [0, 0, 0, 0];
// }
// `;
// };

// // ─── 4. Fetch Single Sentinel-2 Image ─────────────────────────────────────
// const fetchSentinelImage = async (coordinates, date, options = {}) => {
//   const {
//     windowDays = 15,        // ±N days around target date
//     maxCloudCoverage = 30,  // scene-level pre-filter (%)
//     cloudProbThreshold = 40 // pixel-level CLP threshold (0-100)
//   } = options;

//   const token = await getAccessToken();
//   const { west, south, east, north } = coordinates;

//   // Build date window
//   const center = new Date(date);
//   const from = new Date(center);
//   const to = new Date(center);
//   from.setDate(from.getDate() - windowDays);
//   to.setDate(to.getDate() + windowDays);

//   const fromStr = from.toISOString().split("T")[0];
//   const toStr = to.toISOString().split("T")[0];

//   // CLP/CLM bands are only available from 2026-02-28 on Copernicus Data Space.
//   // If the date window starts before that, fall back to SCL-only masking.
//   const useCLP = isClpAvailable(fromStr, toStr);
//   const evalscript = buildEvalscript(useCLP, cloudProbThreshold);
//   const { width, height } = getOptimalResolution(coordinates);

//   const requestBody = {
//     input: {
//       bounds: {
//         bbox: [west, south, east, north],
//         properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
//       },
//       data: [
//         {
//           type: "sentinel-2-l2a",
//           dataFilter: {
//             timeRange: {
//               from: `${fromStr}T00:00:00Z`,
//               to: `${toStr}T23:59:59Z`,
//             },
//             maxCloudCoverage,
//           },
//           processing: {
//             upsampling: "BICUBIC",
//             downsampling: "BICUBIC",
//           },
//         },
//       ],
//     },
//     output: {
//       width,
//       height,
//       responses: [
//         {
//           identifier: "default",
//           format: { type: "image/png" },
//         },
//       ],
//     },
//     evalscript,
//   };

//   let response;
//   try {
//     response = await axios.post(
//       "https://sh.dataspace.copernicus.eu/api/v1/process",
//       requestBody,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//           Accept: "image/png",
//         },
//         responseType: "arraybuffer",
//       }
//     );
//   } catch (err) {
//     // Axios throws on non-2xx; extract Sentinel Hub error message if available
//     if (err.response) {
//       const errText = Buffer.from(err.response.data).toString("utf-8");
//       throw new Error(
//         `Sentinel Hub HTTP ${err.response.status}: ${errText}`
//       );
//     }
//     throw err;
//   }

//   // Verify the response is actually an image
//   const contentType = response.headers["content-type"] || "";
//   if (!contentType.includes("image")) {
//     const errorText = Buffer.from(response.data).toString("utf-8");
//     throw new Error(
//       `Sentinel Hub returned non-image (${contentType}): ${errorText}`
//     );
//   }

//   return response.data;
// };

// // ─── 5. Save Image Locally ─────────────────────────────────────────────────
// const saveImageLocally = (buffer, requestId, filename) => {
//   const dir = path.join(
//     __dirname,
//     "../uploads/requests",
//     requestId.toString()
//   );

//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }

//   const filepath = path.join(dir, filename);
//   fs.writeFileSync(filepath, buffer);

//   return `uploads/requests/${requestId}/${filename}`;
// };

// // ─── 6. Fetch & Save Both Images ──────────────────────────────────────────
// /**
//  * Fetches a cloud-masked Sentinel-2 image pair for change detection.
//  *
//  * @param {Object} coordinates  - { north, south, east, west }
//  * @param {string} dateFrom     - ISO date string for the "before" image
//  * @param {string} dateTo       - ISO date string for the "after" image
//  * @param {string|number} requestId - used for local save path
//  * @param {Object} [options]    - optional overrides: windowDays, maxCloudCoverage, cloudProbThreshold
//  * @returns {{ imageFrom: string, imageTo: string }} relative file paths
//  */
// const fetchAndSaveImagePair = async (
//   coordinates,
//   dateFrom,
//   dateTo,
//   requestId,
//   options = {}
// ) => {
//   const date1 = new Date(dateFrom).toISOString().split("T")[0];
//   const date2 = new Date(dateTo).toISOString().split("T")[0];

//   const results = await Promise.allSettled([
//     fetchSentinelImage(coordinates, date1, options),
//     fetchSentinelImage(coordinates, date2, options),
//   ]);

//   if (results[0].status === "rejected") {
//     throw new Error(`"dateFrom" image fetch failed: ${results[0].reason.message}`);
//   }
//   if (results[1].status === "rejected") {
//     throw new Error(`"dateTo" image fetch failed: ${results[1].reason.message}`);
//   }

//   const imageFrom = saveImageLocally(
//     results[0].value,
//     requestId,
//     "image_from.png"
//   );
//   const imageTo = saveImageLocally(
//     results[1].value,
//     requestId,
//     "image_to.png"
//   );

//   return { imageFrom, imageTo };
// };

// module.exports = { fetchAndSaveImagePair, fetchSentinelImage, getOptimalResolution };