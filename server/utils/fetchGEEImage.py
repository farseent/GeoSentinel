import ee
import sys
import json
import os
import requests

def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    mask = (qa.bitwiseAnd(cloud_bit_mask).eq(0)
              .And(qa.bitwiseAnd(cirrus_bit_mask).eq(0)))
    return image.updateMask(mask).divide(10000)

def fetch_image(bounds, date_from, date_to, request_id, label):
    try:
        ee.Initialize(project=os.environ.get('GEE_PROJECT_ID'))

        region = ee.Geometry.Rectangle([
            bounds['west'],
            bounds['south'],
            bounds['east'],
            bounds['north']
        ])

        collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                     .filterDate(date_from, date_to)
                     .filterBounds(region)
                     .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                     .map(mask_s2_clouds))

        count = collection.size().getInfo()
        if count == 0:
            print(json.dumps({
                "success": False,
                "error": "No cloud-free images found for this date range. Try a wider date range."
            }))
            sys.exit()

        # 🔹 Use more bands — better for ML change detection
        image = collection.median().select([
            'B2',   # Blue
            'B3',   # Green
            'B4',   # Red
            'B8',   # NIR — vegetation health
            'B11',  # SWIR1 — moisture, burn detection
            'B12',  # SWIR2 — urban/soil changes
        ])

        # 🔹 Also compute NDVI as extra channel (vegetation change indicator)
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        image = image.addBands(ndvi)

        uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)

        # 🔹 Save as GeoTIFF instead of PNG — preserves full float precision
        filename = f"{request_id}_{label}.tif"
        filepath = os.path.join(uploads_dir, filename)

        url = image.getDownloadURL({
            'region': region,
            'scale': 10,
            'format': 'GEO_TIFF',
            'bands': ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI'],
        })

        response = requests.get(url, timeout=300)  # 🔹 longer timeout for large files
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(json.dumps({ "success": True, "filename": filename }))
        else:
            print(json.dumps({ "success": False, "error": f"Download failed: {response.status_code}" }))

    except Exception as e:
        print(json.dumps({ "success": False, "error": str(e) }))


if __name__ == "__main__":
    args = json.loads(sys.argv[1])
    fetch_image(
        bounds=args['bounds'],
        date_from=args['dateFrom'],
        date_to=args['dateTo'],
        request_id=args['requestId'],
        label=args['label']
    )