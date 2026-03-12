"""
Streamlit Web UI for Satellite Change Detection Model
A simple interface to upload two satellite images and detect changes between them.
"""

import streamlit as st
import torch
import numpy as np
from skimage import io
import imageio
from PIL import Image
import tempfile
import os
import cv2
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from io import BytesIO

# Import the model
from fresunet import FresUNet

# Page configuration
st.set_page_config(
    page_title="Satellite Change Detection",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #555;
        text-align: center;
        margin-bottom: 2rem;
    }
    .stButton>button {
        width: 100%;
        background-color: #1f77b4;
        color: white;
        font-size: 1.1rem;
        padding: 0.5rem;
        border-radius: 5px;
    }
    .info-box {
        background-color: #e7f3ff;
        padding: 1rem;
        border-radius: 5px;
        border-left: 4px solid #1f77b4;
    }
    </style>
""", unsafe_allow_html=True)

# Initialize session state
if 'model_loaded' not in st.session_state:
    st.session_state.model_loaded = False
    st.session_state.net = None

@st.cache_resource
def load_model():
    """Load the FresUNet model (cached)"""
    try:
        net = FresUNet(2*3, 2)
        ROOT = os.path.dirname(os.path.realpath(__file__))
        net.load_state_dict(torch.load(
            os.path.join(ROOT, 'fresunet3_final.pth.tar'), 
            map_location=torch.device('cpu')
        ))
        net.eval()
        return net, None
    except Exception as e:
        return None, str(e)

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

def create_heatmap(change_map, colormap='jet'):
    """Create a heatmap visualization of the change map."""
    # Normalize change map to 0-1
    normalized = change_map.astype(float) / 255.0
    
    # Apply colormap
    cmap = plt.get_cmap(colormap)
    colored = cmap(normalized)
    
    # Convert to RGB (0-255)
    rgb = (colored[:, :, :3] * 255).astype(np.uint8)
    return rgb

def create_overlay(base_image, change_map, alpha=0.5, color=(255, 0, 0)):
    """Create an overlay of change map on the base image."""
    # Ensure base image is RGB and uint8
    if base_image.dtype != np.uint8:
        base_image = simple_equalization_8bit(base_image)
    
    # Create colored overlay where changes exist
    overlay = base_image.copy()
    mask = change_map > 0
    
    # Apply color to changed areas
    overlay[mask] = overlay[mask] * (1 - alpha) + np.array(color) * alpha
    
    return overlay.astype(np.uint8)

def create_side_by_side_overlay(img1, img2, change_map, alpha=0.5):
    """Create side-by-side comparison with overlay."""
    overlay1 = create_overlay(img1, change_map, alpha, color=(255, 0, 0))
    overlay2 = create_overlay(img2, change_map, alpha, color=(0, 255, 0))
    return overlay1, overlay2

def create_difference_map(img1, img2):
    """Create a difference map between two images."""
    # Ensure images are uint8
    if img1.dtype != np.uint8:
        img1 = simple_equalization_8bit(img1)
    if img2.dtype != np.uint8:
        img2 = simple_equalization_8bit(img2)
    
    # Calculate absolute difference
    diff = cv2.absdiff(img1, img2)
    
    # Convert to grayscale if needed
    if len(diff.shape) == 3:
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
    else:
        diff_gray = diff
    
    return diff_gray

def create_edge_detection(change_map):
    """Apply edge detection to highlight change boundaries."""
    # Apply Canny edge detection
    edges = cv2.Canny(change_map, 50, 150)
    return edges

def create_contour_overlay(base_image, change_map, thickness=2):
    """Draw contours around changed areas."""
    if base_image.dtype != np.uint8:
        base_image = simple_equalization_8bit(base_image)
    
    # Find contours
    contours, _ = cv2.findContours(change_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Draw contours on image
    result = base_image.copy()
    cv2.drawContours(result, contours, -1, (255, 0, 0), thickness)
    
    return result

def process_images(image1_bytes, image2_bytes):
    """Process two images and return change map."""
    try:
        # Save uploaded files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp1:
            tmp1.write(image1_bytes.getvalue())
            tmp1_path = tmp1.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp2:
            tmp2.write(image2_bytes.getvalue())
            tmp2_path = tmp2.name
        
        # Load and preprocess images
        I1 = io.imread(tmp1_path).astype('float')
        I1 = (I1 - I1.mean()) / I1.std()
        
        I2 = io.imread(tmp2_path).astype('float')
        I2 = (I2 - I2.mean()) / I2.std()
        
        # Ensure images have 3 channels
        if len(I1.shape) == 2:
            I1 = np.stack([I1, I1, I1], axis=-1)
        if len(I2.shape) == 2:
            I2 = np.stack([I2, I2, I2], axis=-1)
        
        # Match dimensions
        s1 = I1.shape
        s2 = I2.shape
        I2 = np.pad(I2, ((0, s1[0] - s2[0]), (0, s1[1] - s2[1]), (0, 0)), 'edge')
        
        # Create equalized versions for display
        eq1 = simple_equalization_8bit(I1)
        eq2 = simple_equalization_8bit(I2)
        
        # Prepare for model
        im1 = reshape_for_torch(I1)
        im2 = reshape_for_torch(I2)
        
        # Run model
        I1_tensor = torch.unsqueeze(im1, 0).float()
        I2_tensor = torch.unsqueeze(im2, 0).float()
        
        with torch.no_grad():
            out = st.session_state.net(I1_tensor, I2_tensor)
            _, predicted = torch.max(out.data, 1)
        
        # Convert to image
        change_map = (255 * predicted[0, :, :]).numpy().astype(np.uint8)
        
        # Clean up temp files
        os.unlink(tmp1_path)
        os.unlink(tmp2_path)
        
        return eq1, eq2, change_map, None
        
    except Exception as e:
        return None, None, None, str(e)

# Main UI
def main():
    # Header
    st.markdown('<div class="main-header">🛰️ Satellite Change Detection</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Upload two satellite images to detect changes between them</div>', unsafe_allow_html=True)
    
    # Sidebar with information
    with st.sidebar:
        st.markdown("### ℹ️ About")
        st.markdown("""
        This application uses a deep learning model (**FresUNet**) to detect changes 
        between two satellite images of the same location.
        
        **How to use:**
        1. Upload your first satellite image (Before)
        2. Upload your second satellite image (After)
        3. Click "Detect Changes"
        4. View the change detection map
        
        **Best Results:**
        - Use Sentinel-2 satellite imagery
        - Images should be co-registered (aligned)
        - PNG format recommended
        - RGB (3-channel) images
        """)
        
        st.markdown("---")
        st.markdown("### 🎨 Color Legend")
        st.markdown("""
        - **White pixels**: Change detected
        - **Black pixels**: No change detected
        """)
        
        st.markdown("---")
        st.markdown("### 🎨 Visualization Options")
        st.markdown("""
        Choose from multiple visualization styles:
        - **Binary Map**: Simple black/white change map
        - **Heatmap**: Color-coded intensity map
        - **Overlay**: Changes highlighted on images
        - **Contours**: Boundaries around changes
        - **Difference Map**: Pixel-wise differences
        """)
        
        st.markdown("---")
        st.markdown("### 🔧 Model Info")
        
        # Load model
        if not st.session_state.model_loaded:
            with st.spinner("Loading model..."):
                net, error = load_model()
                if net is not None:
                    st.session_state.net = net
                    st.session_state.model_loaded = True
                    st.success("✅ Model loaded successfully!")
                else:
                    st.error(f"❌ Failed to load model: {error}")
                    return
        else:
            st.success("✅ Model ready")
    
    # Main content area
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 📷 Image 1 (Before)")
        image1 = st.file_uploader(
            "Upload first satellite image",
            type=['png', 'jpg', 'jpeg'],
            key="image1",
            help="Upload the first satellite image (before state)"
        )
        if image1:
            st.image(image1, caption="Image 1 Uploaded", use_container_width=True)
    
    with col2:
        st.markdown("#### 📷 Image 2 (After)")
        image2 = st.file_uploader(
            "Upload second satellite image",
            type=['png', 'jpg', 'jpeg'],
            key="image2",
            help="Upload the second satellite image (after state)"
        )
        if image2:
            st.image(image2, caption="Image 2 Uploaded", use_container_width=True)
    
    st.markdown("---")
    
    # Process button
    if image1 and image2:
        # Visualization options
        st.markdown("### ⚙️ Visualization Settings")
        
        col_viz1, col_viz2, col_viz3 = st.columns(3)
        
        with col_viz1:
            viz_type = st.selectbox(
                "Visualization Type",
                ["Binary Map", "Heatmap", "Overlay", "Contours", "Difference Map", "All Views"],
                help="Choose how to display the change detection results"
            )
        
        with col_viz2:
            if viz_type == "Heatmap":
                colormap = st.selectbox(
                    "Color Scheme",
                    ["jet", "hot", "viridis", "plasma", "inferno", "coolwarm", "RdYlGn"],
                    help="Color scheme for the heatmap"
                )
            elif viz_type == "Overlay":
                overlay_alpha = st.slider(
                    "Overlay Transparency",
                    min_value=0.0,
                    max_value=1.0,
                    value=0.5,
                    step=0.1,
                    help="Transparency of the overlay (0=transparent, 1=opaque)"
                )
            else:
                colormap = "jet"
                overlay_alpha = 0.5
        
        with col_viz3:
            if viz_type == "Contours":
                contour_thickness = st.slider(
                    "Contour Thickness",
                    min_value=1,
                    max_value=5,
                    value=2,
                    help="Thickness of contour lines"
                )
            else:
                contour_thickness = 2
        
        col_btn1, col_btn2, col_btn3 = st.columns([1, 2, 1])
        with col_btn2:
            if st.button("🔍 Detect Changes", type="primary"):
                with st.spinner("Processing images and detecting changes..."):
                    eq1, eq2, change_map, error = process_images(image1, image2)
                    
                    if error:
                        st.error(f"Error processing images: {error}")
                    else:
                        st.success("✅ Change detection complete!")
                        
                        # Display results
                        st.markdown("---")
                        st.markdown("### 📊 Results")
                        
                        # Generate visualizations based on selected type
                        if viz_type == "Binary Map" or viz_type == "All Views":
                            st.markdown("#### 🔲 Binary Change Map")
                            result_col1, result_col2, result_col3 = st.columns(3)
                            
                            with result_col1:
                                st.markdown("**Processed Image 1**")
                                st.image(eq1, caption="Before (Equalized)", use_container_width=True)
                            
                            with result_col2:
                                st.markdown("**Processed Image 2**")
                                st.image(eq2, caption="After (Equalized)", use_container_width=True)
                            
                            with result_col3:
                                st.markdown("**Change Detection Map**")
                                st.image(change_map, caption="Binary Changes", use_container_width=True)
                        
                        if viz_type == "Heatmap" or viz_type == "All Views":
                            st.markdown("---")
                            st.markdown("#### 🌡️ Heatmap Visualization")
                            heatmap = create_heatmap(change_map, colormap if viz_type == "Heatmap" else "jet")
                            
                            heat_col1, heat_col2 = st.columns(2)
                            with heat_col1:
                                st.image(change_map, caption="Binary Map", use_container_width=True)
                            with heat_col2:
                                st.image(heatmap, caption=f"Heatmap ({colormap if viz_type == 'Heatmap' else 'jet'})", use_container_width=True)
                        
                        if viz_type == "Overlay" or viz_type == "All Views":
                            st.markdown("---")
                            st.markdown("#### 🎨 Overlay Visualization")
                            alpha = overlay_alpha if viz_type == "Overlay" else 0.5
                            overlay1, overlay2 = create_side_by_side_overlay(eq1, eq2, change_map, alpha)
                            
                            over_col1, over_col2 = st.columns(2)
                            with over_col1:
                                st.image(overlay1, caption="Before with Changes (Red)", use_container_width=True)
                            with over_col2:
                                st.image(overlay2, caption="After with Changes (Green)", use_container_width=True)
                        
                        if viz_type == "Contours" or viz_type == "All Views":
                            st.markdown("---")
                            st.markdown("#### 🔷 Contour Visualization")
                            thickness = contour_thickness if viz_type == "Contours" else 2
                            contour1 = create_contour_overlay(eq1, change_map, thickness)
                            contour2 = create_contour_overlay(eq2, change_map, thickness)
                            edges = create_edge_detection(change_map)
                            
                            cont_col1, cont_col2, cont_col3 = st.columns(3)
                            with cont_col1:
                                st.image(contour1, caption="Before with Contours", use_container_width=True)
                            with cont_col2:
                                st.image(contour2, caption="After with Contours", use_container_width=True)
                            with cont_col3:
                                st.image(edges, caption="Edge Detection", use_container_width=True)
                        
                        if viz_type == "Difference Map" or viz_type == "All Views":
                            st.markdown("---")
                            st.markdown("#### 📐 Difference Map")
                            diff_map = create_difference_map(eq1, eq2)
                            diff_heatmap = create_heatmap(diff_map, "hot")
                            
                            diff_col1, diff_col2, diff_col3 = st.columns(3)
                            with diff_col1:
                                st.image(diff_map, caption="Raw Difference", use_container_width=True)
                            with diff_col2:
                                st.image(diff_heatmap, caption="Difference Heatmap", use_container_width=True)
                            with diff_col3:
                                st.image(change_map, caption="AI Detected Changes", use_container_width=True)
                        
                        # Calculate statistics
                        total_pixels = change_map.size
                        changed_pixels = np.sum(change_map > 0)
                        change_percentage = (changed_pixels / total_pixels) * 100
                        
                        st.markdown("---")
                        st.markdown("### 📈 Statistics")
                        stat_col1, stat_col2, stat_col3 = st.columns(3)
                        
                        with stat_col1:
                            st.metric("Total Pixels", f"{total_pixels:,}")
                        
                        with stat_col2:
                            st.metric("Changed Pixels", f"{changed_pixels:,}")
                        
                        with stat_col3:
                            st.metric("Change Percentage", f"{change_percentage:.2f}%")
                        
                        # Download button
                        st.markdown("---")
                        st.markdown("### 💾 Download Results")
                        
                        # Prepare all visualizations for download
                        download_options = {}
                        
                        # Always include basic outputs
                        download_options["Processed Image 1"] = eq1
                        download_options["Processed Image 2"] = eq2
                        download_options["Binary Change Map"] = change_map
                        
                        # Add visualization-specific outputs
                        if viz_type in ["Heatmap", "All Views"]:
                            heatmap = create_heatmap(change_map, colormap if viz_type == "Heatmap" else "jet")
                            download_options["Heatmap"] = heatmap
                        
                        if viz_type in ["Overlay", "All Views"]:
                            alpha = overlay_alpha if viz_type == "Overlay" else 0.5
                            overlay1, overlay2 = create_side_by_side_overlay(eq1, eq2, change_map, alpha)
                            download_options["Overlay Before"] = overlay1
                            download_options["Overlay After"] = overlay2
                        
                        if viz_type in ["Contours", "All Views"]:
                            thickness = contour_thickness if viz_type == "Contours" else 2
                            contour1 = create_contour_overlay(eq1, change_map, thickness)
                            contour2 = create_contour_overlay(eq2, change_map, thickness)
                            edges = create_edge_detection(change_map)
                            download_options["Contours Before"] = contour1
                            download_options["Contours After"] = contour2
                            download_options["Edge Detection"] = edges
                        
                        if viz_type in ["Difference Map", "All Views"]:
                            diff_map = create_difference_map(eq1, eq2)
                            diff_heatmap = create_heatmap(diff_map, "hot")
                            download_options["Difference Map"] = diff_map
                            download_options["Difference Heatmap"] = diff_heatmap
                        
                        # Create download buttons in a grid
                        num_downloads = len(download_options)
                        cols_per_row = 3
                        
                        download_items = list(download_options.items())
                        for i in range(0, num_downloads, cols_per_row):
                            cols = st.columns(cols_per_row)
                            for j in range(cols_per_row):
                                idx = i + j
                                if idx < num_downloads:
                                    name, img_data = download_items[idx]
                                    with cols[j]:
                                        # Convert to PIL and bytes
                                        if img_data.dtype != np.uint8:
                                            img_data = img_data.astype(np.uint8)
                                        img_pil = Image.fromarray(img_data)
                                        buf = BytesIO()
                                        img_pil.save(buf, format='PNG')
                                        
                                        # Create filename
                                        filename = name.lower().replace(" ", "_") + ".png"
                                        
                                        st.download_button(
                                            f"📥 {name}",
                                            buf.getvalue(),
                                            filename,
                                            "image/png",
                                            key=f"download_{idx}"
                                        )
    else:
        st.info("👆 Please upload both satellite images to begin change detection.")

if __name__ == "__main__":
    main()
