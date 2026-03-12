"""
Quick test to verify dtype fix for ensemble methods
"""

import torch
import numpy as np
from fresunet import FresUNet
from ensemble_methods import TestTimeAugmentation
import os

print("Testing dtype fix for ensemble methods...")

# Load model
net = FresUNet(2*3, 2)
ROOT = os.path.dirname(os.path.realpath(__file__))
net.load_state_dict(torch.load(
    os.path.join(ROOT, 'fresunet3_final.pth.tar'), 
    map_location=torch.device('cpu')
))
net.eval()

# Create dummy images (simulate numpy float arrays)
img1_np = np.random.randn(128, 128, 3).astype('float')  # This is float64!
img2_np = np.random.randn(128, 128, 3).astype('float')

# Convert to torch tensors (this will be float64 by default)
img1_tensor = torch.from_numpy(img1_np.transpose((2, 0, 1)))
img2_tensor = torch.from_numpy(img2_np.transpose((2, 0, 1)))

print(f"Tensor dtypes BEFORE fix: {img1_tensor.dtype}, {img2_tensor.dtype}")
print(f"Model weight dtype: {next(net.parameters()).dtype}")

# Test TTA
try:
    tta = TestTimeAugmentation(net)
    pred_tta = tta.augment_predict(img1_tensor, img2_tensor, use_flip=True, use_rotation=False)
    print("✓ TTA test PASSED - dtype conversion working!")
    print(f"  Output shape: {pred_tta.shape}")
except RuntimeError as e:
    if "Input type (double) and bias type (float)" in str(e):
        print("✗ TTA test FAILED - dtype mismatch still exists")
        print(f"  Error: {e}")
    else:
        raise

# Test with explicit float32 conversion (the fix)
img1_tensor_fixed = img1_tensor.float()
img2_tensor_fixed = img2_tensor.float()

print(f"\nTensor dtypes AFTER fix: {img1_tensor_fixed.dtype}, {img2_tensor_fixed.dtype}")

try:
    tta = TestTimeAugmentation(net)
    pred_tta = tta.augment_predict(img1_tensor_fixed, img2_tensor_fixed, use_flip=True, use_rotation=False)
    print("✓ TTA test with fixed tensors PASSED!")
    print(f"  Output shape: {pred_tta.shape}")
except Exception as e:
    print(f"✗ TTA test with fixed tensors FAILED: {e}")

print("\n✅ All dtype tests completed!")
