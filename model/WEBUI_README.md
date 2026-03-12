# 🛰️ Satellite Change Detection - Web UI

A simple and intuitive web interface for detecting changes between satellite image pairs using deep learning.

## 🚀 Quick Start

### Option 1: Double-click to Launch (Windows)
Simply double-click the `start_webui.bat` file to launch the web interface.

### Option 2: Command Line
```cmd
C:/Users/soora/OneDrive/Desktop/sat_imaginary/PS-10-model-ver-2.23/venv/Scripts/python.exe -m streamlit run app.py
```

The web interface will automatically open in your default browser at `http://localhost:8501`

## 📖 How to Use

1. **Upload Images**
   - Click on "Browse files" in the left column to upload your first satellite image (Before)
   - Click on "Browse files" in the right column to upload your second satellite image (After)

2. **Detect Changes**
   - After uploading both images, click the "🔍 Detect Changes" button
   - Wait for processing to complete (usually takes a few seconds)

3. **View Results**
   - **Processed Images**: View the normalized/equalized versions of your input images
   - **Change Map**: White pixels show detected changes, black pixels show no change
   - **Statistics**: See the total number of pixels, changed pixels, and change percentage

4. **Download Results**
   - Click the download buttons to save the processed images and change map

## 📋 Requirements

- **Image Format**: PNG, JPG, or JPEG
- **Image Type**: Satellite images (works best with Sentinel-2)
- **Image Alignment**: Images should be co-registered (same location, aligned coordinates)
- **Channels**: RGB (3-channel) images

## 🎨 Understanding the Results

### Change Detection Map
- **White pixels (255)**: Change detected at this location
- **Black pixels (0)**: No change detected

### Statistics
- **Total Pixels**: Total number of pixels in the image
- **Changed Pixels**: Number of pixels where change was detected
- **Change Percentage**: Percentage of the image that changed

## 💡 Tips for Best Results

1. **Use Sentinel-2 Imagery**: The model is trained on Sentinel-2 satellite data
2. **Ensure Alignment**: Images must be perfectly co-registered (same coordinates)
3. **Same Location**: Both images should be of the exact same geographical area
4. **Different Times**: Images should be from different time periods to detect temporal changes
5. **Good Quality**: Use clear, cloud-free images when possible

## 🛠️ Features

- ✅ Drag-and-drop file upload
- ✅ Real-time image preview
- ✅ Automatic image preprocessing
- ✅ Interactive results display
- ✅ Download processed images
- ✅ Change statistics
- ✅ Responsive design
- ✅ Clean and intuitive UI

## 🔧 Technical Details

- **Model**: FresUNet (Feature Residual U-Net)
- **Framework**: PyTorch
- **Web Framework**: Streamlit
- **Image Processing**: scikit-image, PIL, imageio
- **Inference**: CPU-based (no GPU required)

## 📝 Example Use Cases

- **Urban Development**: Track city expansion and new construction
- **Deforestation**: Monitor forest cover changes
- **Agriculture**: Detect crop growth and harvest patterns
- **Disaster Response**: Identify flood damage or wildfire impacts
- **Environmental Monitoring**: Track coastline erosion or ice sheet changes

## ⚠️ Troubleshooting

### Web UI won't start
- Make sure all dependencies are installed
- Check that port 8501 is not already in use
- Try closing and restarting the application

### Images won't upload
- Check file format (should be PNG, JPG, or JPEG)
- Ensure images are not corrupted
- Try converting to PNG format

### Poor detection results
- Verify images are properly co-registered
- Check image quality (avoid clouds, noise)
- Ensure images are from the same location

## 📞 Support

For issues or questions, check the main project README or create an issue in the repository.

---

Built with ❤️ using PyTorch and Streamlit
