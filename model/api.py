from flask import Flask, request, jsonify
import torch
import numpy as np
from skimage import io
from PIL import Image
import os
import cv2
import matplotlib.pyplot as plt

from fresunet import FresUNet
from post_processing import apply_full_pipeline
from ensemble_methods import TestTimeAugmentation, HybridDetector

app = Flask(__name__)

# ─── Load Model Once at Startup ───────────────────────────────────────────
ROOT = os.path.dirname(os.path.realpath(__file__))

print("Loading FresUNet model...")
net = FresUNet(2 * 3, 2)
net.load_state_dict(torch.load(
    os.path.join(ROOT, 'fresunet3_final.pth.tar'),
    map_location=torch.device('cpu')
))
net.eval()
print("Model loaded successfully.")


# ─── Helper Functions ─────────────────────────────────────────────────────
def reshape_for_torch(I):
    out = I.transpose((2, 0, 1))
    return torch.from_numpy(out).float()

def simple_equalization_8bit(im, percentiles=5):
    mi, ma = np.percentile(im[np.isfinite(im)], (percentiles, 100 - percentiles))
    im = np.clip(im, mi, ma)
    im = (im - mi) / (ma - mi) * 255
    return im.astype(np.uint8)

def create_heatmap(change_map, colormap='jet'):
    normalized = change_map.astype(float) / 255.0
    cmap = plt.get_cmap(colormap)
    colored = cmap(normalized)
    return (colored[:, :, :3] * 255).astype(np.uint8)

def create_overlay(base_image, change_map, alpha=0.4, color=(255, 0, 0)):
    if base_image.dtype != np.uint8:
        base_image = simple_equalization_8bit(base_image)
    overlay = base_image.copy()
    mask = change_map > 0
    overlay[mask] = overlay[mask] * (1 - alpha) + np.array(color) * alpha
    return overlay.astype(np.uint8)

def create_contour_overlay(base_image, change_map, thickness=2):
    if base_image.dtype != np.uint8:
        base_image = simple_equalization_8bit(base_image)
    contours, _ = cv2.findContours(change_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    result = base_image.copy()
    cv2.drawContours(result, contours, -1, (255, 0, 0), thickness)
    return result

def create_difference_map(img1, img2):
    if img1.dtype != np.uint8:
        img1 = simple_equalization_8bit(img1)
    if img2.dtype != np.uint8:
        img2 = simple_equalization_8bit(img2)
    diff = cv2.absdiff(img1, img2)
    if len(diff.shape) == 3:
        diff = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
    return diff

def save_image(array, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    img = Image.fromarray(array)
    img.save(filepath)


# ─── Predict Endpoint ─────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        image1_path = data.get('image1_path')
        image2_path = data.get('image2_path')
        output_dir  = data.get('output_dir')  # folder to save all results

        if not image1_path or not image2_path or not output_dir:
            return jsonify({ 'error': 'image1_path, image2_path, output_dir are required' }), 400

        os.makedirs(output_dir, exist_ok=True)

        # ── Load & Preprocess ──────────────────────────────────────────
        I1 = io.imread(image1_path).astype('float')
        I2 = io.imread(image2_path).astype('float')

        # Ensure 3 channels FIRST (before normalization)
        if len(I1.shape) == 2:
            I1 = np.stack([I1, I1, I1], axis=-1)
        elif I1.shape[2] == 4:
            I1 = I1[:, :, :3]

        if len(I2.shape) == 2:
            I2 = np.stack([I2, I2, I2], axis=-1)
        elif I2.shape[2] == 4:
            I2 = I2[:, :, :3]

        # Debug log — check if images are blank
        print(f"[DEBUG] I1 → shape:{I1.shape} min:{I1.min():.4f} max:{I1.max():.4f} std:{I1.std():.4f}")
        print(f"[DEBUG] I2 → shape:{I2.shape} min:{I2.min():.4f} max:{I2.max():.4f} std:{I2.std():.4f}")

        # Safe normalization
        def safe_normalize(arr):
            std = arr.std()
            if std == 0:
                print(f"[WARNING] Image is uniform (std=0), returning zeros")
                return np.zeros_like(arr)
            return (arr - arr.mean()) / std

        I1 = safe_normalize(I1)
        I2 = safe_normalize(I2)

        # Match dimensions
        s1 = I1.shape
        s2 = I2.shape
        if s1 != s2:
            I2 = np.pad(I2, ((0, s1[0]-s2[0]), (0, s1[1]-s2[1]), (0, 0)), 'edge')

        eq1 = simple_equalization_8bit(I1)
        eq2 = simple_equalization_8bit(I2)

        im1 = reshape_for_torch(I1)
        im2 = reshape_for_torch(I2)

        I1_tensor = torch.unsqueeze(im1, 0).float()
        I2_tensor = torch.unsqueeze(im2, 0).float()

        # ── 1. Basic Change Map ────────────────────────────────────────
        with torch.no_grad():
            out = net(I1_tensor, I2_tensor)
            _, predicted = torch.max(out.data, 1)
        basic_map = (255 * predicted[0, :, :]).numpy().astype(np.uint8)

        # ── 2. Post-Processed Map ──────────────────────────────────────
        post_map = apply_full_pipeline(
            basic_map,
            img1=eq1,
            img2=eq2,
            use_morphology=True,
            use_connected_components=True,
            min_size=50,
            disk_size=2
        )

        # ── 3. TTA Map ────────────────────────────────────────────────
        tta = TestTimeAugmentation(net)
        tta_pred = tta.augment_predict(im1, im2, use_flip=True, use_rotation=False)
        tta_map = apply_full_pipeline(
            (255 * tta_pred).astype(np.uint8),
            img1=eq1,
            min_size=50
        )

        # ── 4. Hybrid Map ─────────────────────────────────────────────
        hybrid = HybridDetector(net, use_traditional=True)
        hybrid_pred = hybrid.predict(I1_tensor, I2_tensor, eq1, eq2,
                                     dl_weight=0.7, traditional_weight=0.3)
        hybrid_map = apply_full_pipeline(
            (255 * hybrid_pred).astype(np.uint8),
            img1=eq1,
            min_size=50
        )

        # Use post_map as the best result for visualizations
        best_map = post_map

        # ── 5. Heatmap ────────────────────────────────────────────────
        heatmap = create_heatmap(best_map, colormap='jet')

        # ── 6. Overlay on Before & After ──────────────────────────────
        overlay_before = create_overlay(eq1, best_map, alpha=0.4, color=(255, 0, 0))
        overlay_after  = create_overlay(eq2, best_map, alpha=0.4, color=(0, 255, 0))

        # ── 7. Contour Overlay ────────────────────────────────────────
        contour_before = create_contour_overlay(eq1, best_map)
        contour_after  = create_contour_overlay(eq2, best_map)
        edges = cv2.Canny(best_map, 50, 150)

        # ── 8. Difference Map ─────────────────────────────────────────
        diff_map      = create_difference_map(eq1, eq2)
        diff_heatmap  = create_heatmap(diff_map, colormap='hot')

        # ── Save All Results ──────────────────────────────────────────
        results = {
            'basic_map':       basic_map,
            'post_map':        post_map,
            'tta_map':         tta_map,
            'hybrid_map':      hybrid_map,
            'heatmap':         heatmap,
            'overlay_before':  overlay_before,
            'overlay_after':   overlay_after,
            'contour_before':  contour_before,
            'contour_after':   contour_after,
            'edges':           edges,
            'diff_map':        diff_map,
            'diff_heatmap':    diff_heatmap,
            'processed_img1':  eq1,
            'processed_img2':  eq2,
        }

        saved_paths = {}
        for name, img_array in results.items():
            filepath = os.path.join(output_dir, f"{name}.png")
            save_image(img_array, filepath)
            saved_paths[name] = filepath

        # ── Statistics ────────────────────────────────────────────────
        total_pixels   = best_map.size
        changed_pixels = int(np.sum(best_map > 0))
        change_pct     = round(float(changed_pixels / total_pixels * 100), 2)

        return jsonify({
            'success': True,
            'output_dir': output_dir,
            'results': saved_paths,
            'stats': {
                'total_pixels':    total_pixels,
                'changed_pixels':  changed_pixels,
                'change_percentage': change_pct,
            }
        })

    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


# ─── Health Check ─────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'model': 'FresUNet loaded' })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)