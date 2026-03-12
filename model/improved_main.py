"""
Improved Change Detection with Multiple Accuracy Enhancement Techniques

This script demonstrates how to use the various improvement methods:
1. Enhanced model with attention
2. Post-processing techniques
3. Ensemble methods
4. Test-time augmentation
"""

import torch
import numpy as np
from skimage import io
import imageio
import argparse
import os

from fresunet import FresUNet
from post_processing import ChangeDetectionPostProcessor, apply_full_pipeline
from ensemble_methods import TestTimeAugmentation, HybridDetector


def reshape_for_torch(I):
    """Transpose image for PyTorch coordinates."""
    out = I.transpose((2, 0, 1))
    return torch.from_numpy(out)


def simple_equalization_8bit(im, percentiles=5):
    """Simple 8-bit requantization by linear stretching."""
    mi, ma = np.percentile(im[np.isfinite(im)], (percentiles, 100 - percentiles))
    im = np.clip(im, mi, ma)
    im = (im - mi) / (ma - mi) * 255
    return im.astype(np.uint8)


def load_and_preprocess_images(name1, name2):
    """Load and preprocess satellite images."""
    I1 = io.imread(name1).astype('float')
    I1 = (I1 - I1.mean()) / I1.std()
    I1_eq = simple_equalization_8bit(I1)
    
    I2 = io.imread(name2).astype('float')
    I2 = (I2 - I2.mean()) / I2.std()
    I2_eq = simple_equalization_8bit(I2)
    
    # Match dimensions
    s1 = I1.shape
    s2 = I2.shape
    I2 = np.pad(I2, ((0, s1[0] - s2[0]), (0, s1[1] - s2[1]), (0, 0)), 'edge')
    I2_eq = np.pad(I2_eq, ((0, s1[0] - s2[0]), (0, s1[1] - s2[1]), (0, 0)), 'edge')
    
    im1 = reshape_for_torch(I1)
    im2 = reshape_for_torch(I2)
    
    return im1, im2, I1_eq, I2_eq


def compute_map_basic(model, img1_tensor, img2_tensor):
    """Basic change detection without enhancements"""
    I1 = torch.unsqueeze(img1_tensor, 0).float()
    I2 = torch.unsqueeze(img2_tensor, 0).float()
    
    with torch.no_grad():
        model.eval()
        out = model(I1, I2)
        _, predicted = torch.max(out.data, 1)
    
    return predicted.numpy()[0]


def compute_map_with_tta(model, img1_tensor, img2_tensor):
    """Change detection with Test-Time Augmentation"""
    tta = TestTimeAugmentation(model)
    predicted = tta.augment_predict(img1_tensor, img2_tensor, 
                                    use_flip=True, use_rotation=False)
    return predicted


def compute_map_hybrid(model, img1_tensor, img2_tensor, img1_np, img2_np):
    """Change detection with hybrid approach (DL + traditional)"""
    hybrid = HybridDetector(model, use_traditional=True)
    
    I1 = torch.unsqueeze(img1_tensor, 0).float()
    I2 = torch.unsqueeze(img2_tensor, 0).float()
    
    predicted = hybrid.predict(I1, I2, img1_np, img2_np, 
                              dl_weight=0.7, traditional_weight=0.3)
    return predicted


def main():
    parser = argparse.ArgumentParser(description='Improved Change Detection')
    parser.add_argument("--input_0", type=str, required=True, help="First input image")
    parser.add_argument("--input_1", type=str, required=True, help="Second input image")
    parser.add_argument("--method", type=str, default="postprocess", 
                       choices=["basic", "postprocess", "tta", "hybrid", "all"],
                       help="Detection method to use")
    parser.add_argument("--output_dir", type=str, default=".", 
                       help="Output directory for results")
    parser.add_argument("--min_size", type=int, default=50, 
                       help="Minimum size for post-processing")
    
    args = parser.parse_args()
    
    # Load model
    print("Loading model...")
    ROOT = os.path.dirname(os.path.realpath(__file__))
    net = FresUNet(2*3, 2)
    net.load_state_dict(torch.load(
        os.path.join(ROOT, 'fresunet3_final.pth.tar'), 
        map_location=torch.device('cpu')
    ))
    net.eval()
    
    # Load and preprocess images
    print(f"Loading images: {args.input_0}, {args.input_1}")
    img1_tensor, img2_tensor, img1_np, img2_np = load_and_preprocess_images(
        args.input_0, args.input_1
    )
    
    # Save equalized inputs
    imageio.imsave(os.path.join(args.output_dir, "input_0_processed.png"), img1_np)
    imageio.imsave(os.path.join(args.output_dir, "input_1_processed.png"), img2_np)
    
    results = {}
    
    # Method 1: Basic detection
    if args.method in ["basic", "all"]:
        print("Running basic detection...")
        pred_basic = compute_map_basic(net, img1_tensor, img2_tensor)
        cm_basic = (255 * pred_basic).astype(np.uint8)
        results["basic"] = cm_basic
        imageio.imsave(os.path.join(args.output_dir, "cm_basic.png"), cm_basic)
        print(f"  Changes detected: {np.sum(pred_basic > 0)} pixels ({np.mean(pred_basic > 0)*100:.2f}%)")
    
    # Method 2: With post-processing
    if args.method in ["postprocess", "all"]:
        print("Running detection with post-processing...")
        pred_basic = compute_map_basic(net, img1_tensor, img2_tensor)
        cm_basic = (255 * pred_basic).astype(np.uint8)
        
        # Apply post-processing
        cm_processed = apply_full_pipeline(
            cm_basic, 
            img1=img1_np, 
            img2=img2_np,
            use_morphology=True,
            use_connected_components=True,
            use_bilateral=False,
            min_size=args.min_size,
            disk_size=2
        )
        
        results["postprocess"] = cm_processed
        imageio.imsave(os.path.join(args.output_dir, "cm_postprocessed.png"), cm_processed)
        print(f"  Changes detected: {np.sum(cm_processed > 127)} pixels ({np.mean(cm_processed > 127)*100:.2f}%)")
    
    # Method 3: Test-Time Augmentation
    if args.method in ["tta", "all"]:
        print("Running detection with Test-Time Augmentation...")
        pred_tta = compute_map_with_tta(net, img1_tensor, img2_tensor)
        cm_tta = (255 * pred_tta).astype(np.uint8)
        
        # Apply post-processing
        cm_tta_processed = apply_full_pipeline(
            cm_tta, 
            img1=img1_np,
            min_size=args.min_size
        )
        
        results["tta"] = cm_tta_processed
        imageio.imsave(os.path.join(args.output_dir, "cm_tta.png"), cm_tta_processed)
        print(f"  Changes detected: {np.sum(cm_tta_processed > 127)} pixels ({np.mean(cm_tta_processed > 127)*100:.2f}%)")
    
    # Method 4: Hybrid approach
    if args.method in ["hybrid", "all"]:
        print("Running hybrid detection (DL + Traditional)...")
        pred_hybrid = compute_map_hybrid(net, img1_tensor, img2_tensor, img1_np, img2_np)
        cm_hybrid = (255 * pred_hybrid).astype(np.uint8)
        
        # Apply post-processing
        cm_hybrid_processed = apply_full_pipeline(
            cm_hybrid, 
            img1=img1_np,
            min_size=args.min_size
        )
        
        results["hybrid"] = cm_hybrid_processed
        imageio.imsave(os.path.join(args.output_dir, "cm_hybrid.png"), cm_hybrid_processed)
        print(f"  Changes detected: {np.sum(cm_hybrid_processed > 127)} pixels ({np.mean(cm_hybrid_processed > 127)*100:.2f}%)")
    
    # Create comparison visualization
    if args.method == "all":
        print("\nCreating comparison visualization...")
        create_comparison_visualization(results, args.output_dir)
    
    print("\n✓ Processing complete!")
    print(f"Results saved to: {args.output_dir}")


def create_comparison_visualization(results, output_dir):
    """Create a side-by-side comparison of different methods"""
    import matplotlib.pyplot as plt
    
    fig, axes = plt.subplots(2, 2, figsize=(12, 12))
    fig.suptitle('Change Detection Methods Comparison', fontsize=16)
    
    methods = list(results.keys())
    positions = [(0, 0), (0, 1), (1, 0), (1, 1)]
    
    for method, (i, j) in zip(methods, positions):
        axes[i, j].imshow(results[method], cmap='gray')
        axes[i, j].set_title(method.upper(), fontsize=12, fontweight='bold')
        axes[i, j].axis('off')
        
        # Add statistics
        change_pct = np.mean(results[method] > 127) * 100
        axes[i, j].text(0.5, 0.02, f'Changed: {change_pct:.2f}%', 
                       transform=axes[i, j].transAxes,
                       ha='center', va='bottom',
                       bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'comparison.png'), dpi=150, bbox_inches='tight')
    plt.close()
    
    print("  Comparison image saved: comparison.png")


if __name__ == "__main__":
    main()
