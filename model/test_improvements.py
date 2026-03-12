"""
Test script to verify all accuracy improvement methods work correctly
"""

import torch
import numpy as np
import sys

print("=" * 70)
print("  TESTING ACCURACY IMPROVEMENT MODULES")
print("=" * 70)
print()

# Test 1: Import modules
print("Test 1: Importing modules...")
try:
    from fresunet import FresUNet
    print("  ✓ fresunet.py imported")
except Exception as e:
    print(f"  ✗ Failed to import fresunet: {e}")
    sys.exit(1)

try:
    from enhanced_model import EnhancedFresUNet, AttentionBlock, CBAM
    print("  ✓ enhanced_model.py imported")
except Exception as e:
    print(f"  ✗ Failed to import enhanced_model: {e}")
    sys.exit(1)

try:
    from post_processing import ChangeDetectionPostProcessor, apply_full_pipeline
    print("  ✓ post_processing.py imported")
except Exception as e:
    print(f"  ✗ Failed to import post_processing: {e}")
    sys.exit(1)

try:
    from ensemble_methods import (TestTimeAugmentation, HybridDetector, 
                                   MultiScaleDetector, EnsembleChangeDetector)
    print("  ✓ ensemble_methods.py imported")
except Exception as e:
    print(f"  ✗ Failed to import ensemble_methods: {e}")
    sys.exit(1)

print()

# Test 2: Create models
print("Test 2: Creating models...")
try:
    base_model = FresUNet(6, 2)
    print(f"  ✓ Base FresUNet created (params: {sum(p.numel() for p in base_model.parameters()):,})")
except Exception as e:
    print(f"  ✗ Failed to create base model: {e}")
    sys.exit(1)

try:
    enhanced_model = EnhancedFresUNet(6, 2, base_depth=16, use_attention=True)
    print(f"  ✓ Enhanced FresUNet created (params: {sum(p.numel() for p in enhanced_model.parameters()):,})")
    print(f"    → {sum(p.numel() for p in enhanced_model.parameters()) - sum(p.numel() for p in base_model.parameters()):,} more parameters")
except Exception as e:
    print(f"  ✗ Failed to create enhanced model: {e}")
    sys.exit(1)

print()

# Test 3: Test forward pass
print("Test 3: Testing forward pass...")
try:
    # Create dummy input
    img1 = torch.randn(1, 3, 128, 128)
    img2 = torch.randn(1, 3, 128, 128)
    
    # Base model
    with torch.no_grad():
        base_model.eval()
        out_base = base_model(img1, img2)
        print(f"  ✓ Base model forward pass: output shape {out_base.shape}")
    
    # Enhanced model
    with torch.no_grad():
        enhanced_model.eval()
        out_enhanced = enhanced_model(img1, img2)
        print(f"  ✓ Enhanced model forward pass: output shape {out_enhanced.shape}")
except Exception as e:
    print(f"  ✗ Forward pass failed: {e}")
    sys.exit(1)

print()

# Test 4: Test post-processing
print("Test 4: Testing post-processing...")
try:
    # Create dummy change map
    change_map = np.random.randint(0, 2, (128, 128)) * 255
    change_map = change_map.astype(np.uint8)
    
    processor = ChangeDetectionPostProcessor()
    
    # Morphological cleaning
    cleaned = processor.morphological_cleaning(change_map, min_size=10, disk_size=2)
    print(f"  ✓ Morphological cleaning: {change_map.shape} → {cleaned.shape}")
    
    # Connected components
    filtered = processor.connected_components_filtering(change_map, min_area=20)
    print(f"  ✓ Connected components filtering: {np.unique(filtered).size} unique values")
    
    # Full pipeline
    img_dummy = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    refined = apply_full_pipeline(change_map, img1=img_dummy, min_size=10)
    print(f"  ✓ Full pipeline: {change_map.shape} → {refined.shape}")
except Exception as e:
    print(f"  ✗ Post-processing failed: {e}")
    sys.exit(1)

print()

# Test 5: Test ensemble methods
print("Test 5: Testing ensemble methods...")
try:
    # Test-Time Augmentation
    tta = TestTimeAugmentation(base_model)
    img1_single = img1.squeeze(0)
    img2_single = img2.squeeze(0)
    pred_tta = tta.augment_predict(img1_single, img2_single, 
                                    use_flip=True, use_rotation=False)
    print(f"  ✓ Test-Time Augmentation: output shape {pred_tta.shape}")
    
    # Hybrid detector
    hybrid = HybridDetector(base_model, use_traditional=True)
    img1_np = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    img2_np = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    pred_hybrid = hybrid.predict(img1, img2, img1_np, img2_np)
    print(f"  ✓ Hybrid detector: output shape {pred_hybrid.shape}")
    
    # Multi-scale detector
    msd = MultiScaleDetector(base_model, scales=[0.5, 1.0])
    pred_ms = msd.predict(img1_single, img2_single)
    print(f"  ✓ Multi-scale detector: output shape {pred_ms.shape}")
except Exception as e:
    print(f"  ✗ Ensemble methods failed: {e}")
    sys.exit(1)

print()

# Test 6: Memory and parameter comparison
print("Test 6: Model comparison...")
base_params = sum(p.numel() for p in base_model.parameters())
enhanced_params = sum(p.numel() for p in enhanced_model.parameters())

print(f"  Base Model Parameters:     {base_params:,}")
print(f"  Enhanced Model Parameters: {enhanced_params:,}")
print(f"  Increase:                  +{enhanced_params - base_params:,} ({(enhanced_params/base_params - 1)*100:.1f}%)")
print()

# Summary
print("=" * 70)
print("  ✓ ALL TESTS PASSED!")
print("=" * 70)
print()
print("Available improvement methods:")
print("  1. Enhanced FresUNet with Attention (requires training)")
print("  2. Post-Processing Techniques (ready to use)")
print("  3. Test-Time Augmentation (ready to use)")
print("  4. Hybrid Detection (ready to use)")
print("  5. Multi-Scale Detection (ready to use)")
print()
print("Get started:")
print("  python improved_main.py --input_0 img1.png --input_1 img2.png --method postprocess")
print()
print("For more details, see: ACCURACY_IMPROVEMENT.md")
print()
