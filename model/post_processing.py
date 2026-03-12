"""
Post-Processing Techniques for Improved Change Detection Accuracy

This module provides various post-processing methods to enhance
the raw model predictions.
"""

import numpy as np
import cv2
from scipy import ndimage
from skimage import morphology, filters
from skimage.filters import threshold_otsu


class ChangeDetectionPostProcessor:
    """Collection of post-processing techniques for change detection"""
    
    @staticmethod
    def morphological_cleaning(change_map, min_size=50, disk_size=2):
        """
        Remove small noise and fill holes using morphological operations
        
        Args:
            change_map: Binary change map (0 or 255)
            min_size: Minimum size of change regions to keep
            disk_size: Size of morphological disk kernel
        
        Returns:
            Cleaned change map
        """
        # Convert to binary
        binary = (change_map > 127).astype(np.uint8)
        
        # Remove small objects
        cleaned = morphology.remove_small_objects(binary.astype(bool), min_size=min_size)
        cleaned = cleaned.astype(np.uint8)
        
        # Fill small holes
        filled = morphology.remove_small_holes(cleaned.astype(bool), area_threshold=min_size)
        filled = filled.astype(np.uint8)
        
        # Morphological closing to connect nearby changes
        kernel = morphology.disk(disk_size)
        closed = morphology.binary_closing(filled, kernel)
        
        # Morphological opening to remove thin protrusions
        opened = morphology.binary_opening(closed, kernel)
        
        return (opened * 255).astype(np.uint8)
    
    @staticmethod
    def connected_components_filtering(change_map, min_area=100, max_area=None):
        """
        Filter change regions based on connected component area
        
        Args:
            change_map: Binary change map
            min_area: Minimum area to keep (pixels)
            max_area: Maximum area to keep (pixels), None for no limit
        
        Returns:
            Filtered change map
        """
        binary = (change_map > 127).astype(np.uint8)
        
        # Find connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
        
        # Create output
        output = np.zeros_like(binary)
        
        # Filter by area (skip label 0 which is background)
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area >= min_area:
                if max_area is None or area <= max_area:
                    output[labels == i] = 1
        
        return (output * 255).astype(np.uint8)
    
    @staticmethod
    def confidence_thresholding(raw_predictions, threshold=0.7):
        """
        Apply confidence-based thresholding instead of simple binary
        
        Args:
            raw_predictions: Raw model output (probabilities)
            threshold: Confidence threshold (0-1)
        
        Returns:
            Thresholded change map
        """
        # Assuming raw_predictions is the probability of change
        binary = (raw_predictions > threshold).astype(np.uint8)
        return (binary * 255).astype(np.uint8)
    
    @staticmethod
    def multi_scale_fusion(change_maps_list, weights=None):
        """
        Fuse change detection results from multiple scales
        
        Args:
            change_maps_list: List of change maps at different scales
            weights: Optional weights for each scale
        
        Returns:
            Fused change map
        """
        if weights is None:
            weights = [1.0 / len(change_maps_list)] * len(change_maps_list)
        
        # Normalize to 0-1
        maps_normalized = [(cm.astype(float) / 255.0) for cm in change_maps_list]
        
        # Weighted average
        fused = np.zeros_like(maps_normalized[0])
        for cm, w in zip(maps_normalized, weights):
            fused += cm * w
        
        # Threshold
        binary = (fused > 0.5).astype(np.uint8)
        return (binary * 255).astype(np.uint8)
    
    @staticmethod
    def edge_aware_refinement(change_map, edge_image, edge_threshold=50):
        """
        Refine change detection using edge information
        
        Args:
            change_map: Binary change map
            edge_image: Edge map from one of the input images
            edge_threshold: Threshold for edge strength
        
        Returns:
            Refined change map
        """
        # Detect edges if not provided
        if edge_image.dtype != np.uint8:
            edge_image = (edge_image * 255).astype(np.uint8)
        
        # Ensure edge_image is single channel
        if len(edge_image.shape) == 3:
            edge_image = cv2.cvtColor(edge_image, cv2.COLOR_RGB2GRAY)
        
        edges = cv2.Canny(edge_image, edge_threshold, edge_threshold * 2)
        
        # Dilate edges slightly
        kernel = np.ones((3, 3), np.uint8)
        edges_dilated = cv2.dilate(edges, kernel, iterations=1)
        
        # Remove changes that don't align with edges
        binary_change = (change_map > 127).astype(np.uint8)
        
        # Use edges as a guide - keep changes near edges
        refined = binary_change * ((edges_dilated > 0).astype(np.uint8) | 
                                   (binary_change > 0).astype(np.uint8))
        
        return (refined * 255).astype(np.uint8)
    
    @staticmethod
    def bilateral_filtering(change_map, d=9, sigma_color=75, sigma_space=75):
        """
        Apply bilateral filtering for edge-preserving smoothing
        
        Args:
            change_map: Change map to filter
            d: Diameter of pixel neighborhood
            sigma_color: Filter sigma in the color space
            sigma_space: Filter sigma in the coordinate space
        
        Returns:
            Filtered change map
        """
        filtered = cv2.bilateralFilter(change_map, d, sigma_color, sigma_space)
        binary = (filtered > 127).astype(np.uint8)
        return (binary * 255).astype(np.uint8)
    
    @staticmethod
    def adaptive_thresholding(difference_map, block_size=35, C=5):
        """
        Apply adaptive thresholding for varying illumination
        
        Args:
            difference_map: Grayscale difference map
            block_size: Size of pixel neighborhood (must be odd)
            C: Constant subtracted from mean
        
        Returns:
            Adaptively thresholded change map
        """
        if difference_map.dtype != np.uint8:
            difference_map = (difference_map * 255).astype(np.uint8)
        
        # Ensure block_size is odd
        if block_size % 2 == 0:
            block_size += 1
        
        binary = cv2.adaptiveThreshold(
            difference_map,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            block_size,
            C
        )
        
        return binary
    
    @staticmethod
    def guided_filter_refinement(change_map, guide_image, radius=8, eps=0.01):
        """
        Apply guided filtering for edge-preserving refinement
        
        Args:
            change_map: Binary change map
            guide_image: Guide image (one of the original images)
            radius: Radius of the filter
            eps: Regularization parameter
        
        Returns:
            Refined change map
        """
        # Normalize inputs
        p = change_map.astype(np.float32) / 255.0
        
        if guide_image.dtype != np.float32:
            I = guide_image.astype(np.float32) / 255.0
        else:
            I = guide_image
        
        # If color image, convert to grayscale
        if len(I.shape) == 3:
            I = cv2.cvtColor((I * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
        
        # Apply guided filter
        mean_I = cv2.boxFilter(I, cv2.CV_32F, (radius, radius))
        mean_p = cv2.boxFilter(p, cv2.CV_32F, (radius, radius))
        mean_Ip = cv2.boxFilter(I * p, cv2.CV_32F, (radius, radius))
        cov_Ip = mean_Ip - mean_I * mean_p
        
        mean_II = cv2.boxFilter(I * I, cv2.CV_32F, (radius, radius))
        var_I = mean_II - mean_I * mean_I
        
        a = cov_Ip / (var_I + eps)
        b = mean_p - a * mean_I
        
        mean_a = cv2.boxFilter(a, cv2.CV_32F, (radius, radius))
        mean_b = cv2.boxFilter(b, cv2.CV_32F, (radius, radius))
        
        q = mean_a * I + mean_b
        
        # Threshold
        binary = (q > 0.5).astype(np.uint8)
        return (binary * 255).astype(np.uint8)


def apply_full_pipeline(change_map, img1=None, img2=None, 
                       use_morphology=True, 
                       use_connected_components=True,
                       use_bilateral=False,
                       min_size=50,
                       disk_size=2):
    """
    Apply a full post-processing pipeline
    
    Args:
        change_map: Raw change detection map
        img1: First input image (optional, for edge-aware refinement)
        img2: Second input image (optional)
        use_morphology: Apply morphological cleaning
        use_connected_components: Filter by connected component area
        use_bilateral: Apply bilateral filtering
        min_size: Minimum size for morphology and CC filtering
        disk_size: Disk size for morphological operations
    
    Returns:
        Refined change map
    """
    processor = ChangeDetectionPostProcessor()
    result = change_map.copy()
    
    # Step 1: Bilateral filtering (optional)
    if use_bilateral:
        result = processor.bilateral_filtering(result)
    
    # Step 2: Morphological cleaning
    if use_morphology:
        result = processor.morphological_cleaning(result, min_size=min_size, disk_size=disk_size)
    
    # Step 3: Connected components filtering
    if use_connected_components:
        result = processor.connected_components_filtering(result, min_area=min_size)
    
    # Step 4: Edge-aware refinement (if images provided)
    if img1 is not None:
        result = processor.edge_aware_refinement(result, img1)
    
    return result
