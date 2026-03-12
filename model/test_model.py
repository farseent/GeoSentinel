"""
Quick test script to verify the model setup
"""
import os
import sys

print("=" * 60)
print("SATELLITE CHANGE DETECTION MODEL - SETUP VERIFICATION")
print("=" * 60)

# Check if model weights exist
weights_path = "fresunet3_final.pth.tar"
if os.path.exists(weights_path):
    print(f"✓ Model weights found: {weights_path}")
    size_mb = os.path.getsize(weights_path) / (1024 * 1024)
    print(f"  Size: {size_mb:.2f} MB")
else:
    print(f"✗ Model weights NOT found: {weights_path}")
    sys.exit(1)

# Check PyTorch installation
try:
    import torch
    print(f"✓ PyTorch version: {torch.__version__}")
except ImportError as e:
    print(f"✗ PyTorch not available: {e}")
    sys.exit(1)

# Try loading the model
try:
    from fresunet import FresUNet
    net = FresUNet(2*3, 2)
    net.load_state_dict(torch.load(weights_path, map_location=torch.device('cpu')))
    print("✓ Model loaded successfully!")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    sys.exit(1)

# Check other dependencies
try:
    import numpy as np
    import imageio
    from skimage import io
    print("✓ All required libraries installed")
except ImportError as e:
    print(f"✗ Missing dependency: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✓ SETUP COMPLETE - Ready to run change detection!")
print("=" * 60)
print("\nUsage:")
print("  python main.py --input_0 image1.png --input_1 image2.png")
print("\nRequired:")
print("  - Two co-registered satellite images (PNG format)")
print("  - Images should be from the same location at different times")
print("  - Works best with Sentinel-2 satellite imagery")
