"""
Quick Demo Script - Visualization Comparison
This script generates a comparison of all visualization types using sample data
"""

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import os

def create_sample_images():
    """Create sample images to demonstrate visualizations"""
    # Create a simple "before" image (gray square with some features)
    size = 200
    before = np.ones((size, size, 3)) * 128
    before[50:80, 50:80] = [100, 150, 200]  # Blue square
    before[120:160, 120:160] = [200, 100, 100]  # Red square
    
    # Create an "after" image with changes
    after = before.copy()
    after[120:160, 120:160] = [100, 200, 100]  # Changed red to green
    after[50:100, 150:180] = [200, 200, 100]  # New yellow rectangle
    
    # Create a simple change map
    change_map = np.zeros((size, size), dtype=np.uint8)
    change_map[120:160, 120:160] = 255  # Changed area
    change_map[50:100, 150:180] = 255   # New area
    
    return before.astype(np.uint8), after.astype(np.uint8), change_map

def main():
    print("=" * 60)
    print("  VISUALIZATION COMPARISON GUIDE")
    print("=" * 60)
    print()
    print("The web UI now supports 6 different visualization modes:")
    print()
    print("1. 🔲 Binary Map")
    print("   - Simple black/white change detection")
    print("   - Best for: Quick overview")
    print()
    print("2. 🌡️ Heatmap")
    print("   - Color-coded intensity visualization")
    print("   - 7 color schemes: jet, hot, viridis, plasma, inferno, coolwarm, RdYlGn")
    print("   - Best for: Publications, presentations")
    print()
    print("3. 🎨 Overlay")
    print("   - Changes highlighted on original images")
    print("   - Adjustable transparency (0.0 - 1.0)")
    print("   - Best for: Spatial context, understanding location")
    print()
    print("4. 🔷 Contours")
    print("   - Boundary lines around changed areas")
    print("   - Adjustable thickness (1-5 pixels)")
    print("   - Includes edge detection map")
    print("   - Best for: Precise measurements, area calculations")
    print()
    print("5. 📐 Difference Map")
    print("   - Pixel-level comparison")
    print("   - Shows raw differences vs AI detection")
    print("   - Best for: Quality control, validation")
    print()
    print("6. 🌟 All Views")
    print("   - Displays ALL visualization types at once")
    print("   - Best for: Comprehensive analysis, reports")
    print()
    print("=" * 60)
    print("  HOW TO USE")
    print("=" * 60)
    print()
    print("1. Open the web UI: http://localhost:8502")
    print("2. Upload your two satellite images")
    print("3. Choose a visualization type from the dropdown")
    print("4. Adjust settings (colormap, transparency, thickness)")
    print("5. Click 'Detect Changes'")
    print("6. Download your preferred visualizations")
    print()
    print("=" * 60)
    print("  QUICK RECOMMENDATIONS")
    print("=" * 60)
    print()
    print("For Quick Check:      → Binary Map")
    print("For Presentations:    → Overlay (transparency: 0.3-0.4)")
    print("For Publications:     → Heatmap (viridis or plasma)")
    print("For Measurements:     → Contours")
    print("For Validation:       → Difference Map")
    print("For Everything:       → All Views")
    print()
    print("=" * 60)
    print()
    print("Ready to use! Visit: http://localhost:8502")
    print()

if __name__ == "__main__":
    main()
