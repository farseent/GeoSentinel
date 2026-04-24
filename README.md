# GeoSentinel 🛰️

> AI-powered satellite image change detection platform built on Sentinel-2 imagery and FresUNet deep learning model.

GeoSentinel is a full-stack web application that lets users submit geospatial change detection requests over any region of interest. It fetches multi-temporal Sentinel-2 satellite imagery from the **Copernicus programme** (European Union Earth Observation programme, operated by ESA) via the Sentinel Hub API, runs it through a FresUNet-based deep learning model, and delivers rich visual outputs — including change masks, RGB composites, NDVI maps, and more — through an interactive results dashboard.

---

## Features

- **Interactive AOI Selection** — Draw a region of interest directly on a Leaflet map
- **Copernicus Sentinel-2 Integration** — Fetches cloud-optimized imagery from the EU Copernicus programme via the Sentinel Hub API, with OAuth authentication and ±15-day mosaicking windows
- **AI Change Detection** — FresUNet model produces 14 output image types per request (change masks, band composites, NDVI, etc.)
- **Change Statistics** — Reports total pixels, changed pixels, and change percentage for each request
- **Results Dashboard** — Tabbed viewer with lightbox, color legends, and per-image download
- **Role-Based Access Control** — JWT-authenticated user/admin roles via HttpOnly cookies
- **Admin Panel** — Manage users and oversee request statuses
- **Async Processing** — Non-blocking background inference pipeline so requests don't block the server

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Leaflet, Tailwind CSS |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT (HttpOnly cookies), RBAC |
| AI Microservice | Python, Flask, FresUNet model |
| Satellite Data | Copernicus Data Space API (OAuth2), Sentinel-2 |

---

## Repository Structure

```
GeoSentinel/
├── client/          # React frontend (Leaflet map, results UI, admin panel)
├── server/          # Node/Express REST API + MongoDB models
└── model/           # Flask microservice wrapping the FresUNet inference pipeline
```

---

## Prerequisites

- Node.js v18+
- Python 3.9+
- MongoDB instance (local or Atlas)
- [Copernicus Data Space account](https://dataspace.copernicus.eu/) with OAuth credentials
- FresUNet model weights (place in `model/` as per model README)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/farseent/GeoSentinel.git
cd GeoSentinel
```

### 2. Backend (Node/Express)

```cmd
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=port number
SMTP_USER=Sender mail
SMTP_PASS=16 character password

CLIENT_URL=http://localhost:3000

COPERNICUS_CLIENT_ID=your_copernicus_client_id
COPERNICUS_CLIENT_SECRET=your_copernicus_client_secret

MODEL_API_URL=http://127.0.0.1:5001
```

Start the server:

```cmd
npm start
```

### 3. AI Microservice (Flask)

```bash
cd model
pip install -r requirements.txt
python app.py
```
Start the model:

```bash
python api.py
```

The Flask microservice runs on `http://localhost:5001` by default.

### 4. Frontend (React)

```cmd
cd client
npm install
```

Create a `.env` file in `client/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
```

Start the client:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## How It Works

1. **Submit a Request** — User draws an AOI polygon on the map and selects two dates for comparison.
2. **Image Fetch** — The backend fetches Sentinel-2 imagery for both dates from the Copernicus Data Space.
3. **Model Inference** — The Flask microservice receives the image pair and runs FresUNet inference, producing 14 output images and pixel-level change statistics.
4. **Results** — Outputs are stored locally and surfaced in the `RequestResults` dashboard with a tabbed viewer, lightbox, color legend, and download support.

---

## Output Types

Each completed request generates up to 14 visual outputs, including:

- Binary change mask
- RGB composites (before / after)
- False color composites
- NDVI difference map
- Band-specific difference maps
- Confidence / probability maps

---

## Environment Variables Summary

| Variable | Location | Description |
|---|---|---|
| `PORT` | server | Express server port |
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret for JWT signing |
| `CLIENT_URL` | server | Allowed CORS origin |
| `COPERNICUS_CLIENT_ID` | server | Copernicus OAuth client ID |
| `COPERNICUS_CLIENT_SECRET` | server | Copernicus OAuth client secret |
| `REACT_APP_API_URL` | client | Base URL of the backend API |

---

## Research Background

GeoSentinel is built around **FresUNet**, a deep learning architecture for satellite image change detection developed as part of academic research at the University of Calicut. The model and associated research were presented at **ICOTL-26**.

---

## License

This project is for academic and research purposes. See [LICENSE](./LICENSE) for details.
