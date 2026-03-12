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