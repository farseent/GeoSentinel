"""
Ensemble Methods for Improved Change Detection

Combines multiple models and techniques for better accuracy.
"""

import torch
import numpy as np
import cv2
from skimage import io


class EnsembleChangeDetector:
    """
    Ensemble change detector combining multiple approaches
    """
    
    def __init__(self, models=None, weights=None):
        """
        Initialize ensemble detector
        
        Args:
            models: List of PyTorch models
            weights: Weights for each model (None for equal weighting)
        """
        self.models = models or []
        self.weights = weights or [1.0 / len(self.models)] * len(self.models) if models else []
        
    def add_model(self, model, weight=1.0):
        """Add a model to the ensemble"""
        self.models.append(model)
        self.weights.append(weight)
        # Renormalize weights
        total = sum(self.weights)
        self.weights = [w / total for w in self.weights]
    
    def predict(self, img1_tensor, img2_tensor, use_voting=False):
        """
        Make ensemble prediction
        
        Args:
            img1_tensor: First image tensor
            img2_tensor: Second image tensor
            use_voting: Use voting instead of averaging
        
        Returns:
            Ensemble prediction
        """
        predictions = []
        
        with torch.no_grad():
            # Ensure tensors are float32 to match model weights
            img1_tensor = img1_tensor.float()
            img2_tensor = img2_tensor.float()
            
            for model in self.models:
                model.eval()
                out = model(img1_tensor, img2_tensor)
                _, predicted = torch.max(out.data, 1)
                predictions.append(predicted.numpy())
        
        if use_voting:
            # Majority voting
            stacked = np.stack(predictions, axis=0)
            ensemble_pred = np.median(stacked, axis=0)
        else:
            # Weighted average
            ensemble_pred = np.zeros_like(predictions[0], dtype=float)
            for pred, weight in zip(predictions, self.weights):
                ensemble_pred += pred.astype(float) * weight
            ensemble_pred = (ensemble_pred > 0.5).astype(np.int64)
        
        return ensemble_pred


class MultiScaleDetector:
    """
    Multi-scale change detection for improved accuracy
    """
    
    def __init__(self, model, scales=[0.5, 1.0, 1.5]):
        """
        Initialize multi-scale detector
        
        Args:
            model: PyTorch model
            scales: List of scales to test
        """
        self.model = model
        self.scales = scales
    
    def detect_at_scale(self, img1, img2, scale):
        """Detect changes at a specific scale"""
        if scale != 1.0:
            # Resize images
            h, w = img1.shape[1], img1.shape[2]
            new_h, new_w = int(h * scale), int(w * scale)
            
            img1_scaled = torch.nn.functional.interpolate(
                img1.unsqueeze(0), size=(new_h, new_w), mode='bilinear', align_corners=False
            ).squeeze(0)
            img2_scaled = torch.nn.functional.interpolate(
                img2.unsqueeze(0), size=(new_h, new_w), mode='bilinear', align_corners=False
            ).squeeze(0)
        else:
            img1_scaled = img1
            img2_scaled = img2
        
        # Detect changes
        with torch.no_grad():
            self.model.eval()
            # Ensure tensors are float32 to match model weights
            img1_scaled = img1_scaled.float()
            img2_scaled = img2_scaled.float()
            out = self.model(img1_scaled.unsqueeze(0), img2_scaled.unsqueeze(0))
            _, predicted = torch.max(out.data, 1)
        
        # Resize back to original size
        if scale != 1.0:
            h, w = img1.shape[1], img1.shape[2]
            predicted_resized = torch.nn.functional.interpolate(
                predicted.unsqueeze(0).float(), size=(h, w), mode='nearest'
            ).squeeze(0).long()
            return predicted_resized.numpy()
        else:
            return predicted.numpy()
    
    def predict(self, img1_tensor, img2_tensor):
        """
        Multi-scale prediction with fusion
        
        Args:
            img1_tensor: First image tensor
            img2_tensor: Second image tensor
        
        Returns:
            Fused prediction from multiple scales
        """
        predictions = []
        
        for scale in self.scales:
            pred = self.detect_at_scale(img1_tensor, img2_tensor, scale)
            predictions.append(pred)
        
        # Fusion: majority voting across scales
        stacked = np.stack(predictions, axis=0)
        fused = np.median(stacked, axis=0)
        
        return fused.astype(np.int64)


class HybridDetector:
    """
    Hybrid approach combining deep learning with traditional methods
    """
    
    def __init__(self, model, use_traditional=True):
        """
        Initialize hybrid detector
        
        Args:
            model: PyTorch deep learning model
            use_traditional: Whether to use traditional CV methods
        """
        self.model = model
        self.use_traditional = use_traditional
    
    def traditional_change_detection(self, img1, img2, threshold=30):
        """
        Traditional change detection using image differencing
        
        Args:
            img1: First image (numpy array, uint8)
            img2: Second image (numpy array, uint8)
            threshold: Threshold for change detection
        
        Returns:
            Binary change map
        """
        # Ensure images are uint8
        if img1.dtype != np.uint8:
            img1 = (img1 * 255).astype(np.uint8)
        if img2.dtype != np.uint8:
            img2 = (img2 * 255).astype(np.uint8)
        
        # Convert to grayscale if needed
        if len(img1.shape) == 3:
            gray1 = cv2.cvtColor(img1, cv2.COLOR_RGB2GRAY)
            gray2 = cv2.cvtColor(img2, cv2.COLOR_RGB2GRAY)
        else:
            gray1, gray2 = img1, img2
        
        # Compute absolute difference
        diff = cv2.absdiff(gray1, gray2)
        
        # Apply Gaussian blur to reduce noise
        diff_blur = cv2.GaussianBlur(diff, (5, 5), 0)
        
        # Threshold
        _, binary = cv2.threshold(diff_blur, threshold, 255, cv2.THRESH_BINARY)
        
        return binary
    
    def predict(self, img1_tensor, img2_tensor, img1_np=None, img2_np=None, 
                dl_weight=0.7, traditional_weight=0.3):
        """
        Hybrid prediction combining DL and traditional methods
        
        Args:
            img1_tensor: First image tensor for DL model
            img2_tensor: Second image tensor for DL model
            img1_np: First image as numpy array for traditional method
            img2_np: Second image as numpy array for traditional method
            dl_weight: Weight for deep learning prediction
            traditional_weight: Weight for traditional prediction
        
        Returns:
            Combined prediction
        """
        # Deep learning prediction
        with torch.no_grad():
            self.model.eval()
            # Ensure tensors are float32 to match model weights
            img1_tensor = img1_tensor.float()
            img2_tensor = img2_tensor.float()
            out = self.model(img1_tensor, img2_tensor)
            _, dl_pred = torch.max(out.data, 1)
            dl_pred = dl_pred.numpy()[0]
        
        # Traditional prediction (if enabled and images provided)
        if self.use_traditional and img1_np is not None and img2_np is not None:
            trad_pred = self.traditional_change_detection(img1_np, img2_np)
            trad_pred = (trad_pred / 255.0)  # Normalize to 0-1
            
            # Combine predictions
            combined = (dl_pred.astype(float) * dl_weight + 
                       trad_pred * traditional_weight)
            combined = (combined > 0.5).astype(np.int64)
        else:
            combined = dl_pred
        
        return combined


class TestTimeAugmentation:
    """
    Test-Time Augmentation for improved accuracy
    """
    
    def __init__(self, model):
        """
        Initialize TTA
        
        Args:
            model: PyTorch model
        """
        self.model = model
    
    def augment_predict(self, img1_tensor, img2_tensor, 
                       use_flip=True, use_rotation=True):
        """
        Predict with test-time augmentation
        
        Args:
            img1_tensor: First image tensor
            img2_tensor: Second image tensor
            use_flip: Use horizontal/vertical flips
            use_rotation: Use 90-degree rotations
        
        Returns:
            Averaged prediction from augmented inputs
        """
        predictions = []
        
        # Original
        pred = self._predict_single(img1_tensor, img2_tensor)
        predictions.append(pred)
        
        if use_flip:
            # Horizontal flip
            img1_hflip = torch.flip(img1_tensor, [2])
            img2_hflip = torch.flip(img2_tensor, [2])
            pred_hflip = self._predict_single(img1_hflip, img2_hflip)
            pred_hflip = np.flip(pred_hflip, axis=1)
            predictions.append(pred_hflip)
            
            # Vertical flip
            img1_vflip = torch.flip(img1_tensor, [1])
            img2_vflip = torch.flip(img2_tensor, [1])
            pred_vflip = self._predict_single(img1_vflip, img2_vflip)
            pred_vflip = np.flip(pred_vflip, axis=0)
            predictions.append(pred_vflip)
        
        if use_rotation:
            # 90-degree rotations
            for k in [1, 2, 3]:
                img1_rot = torch.rot90(img1_tensor, k, [1, 2])
                img2_rot = torch.rot90(img2_tensor, k, [1, 2])
                pred_rot = self._predict_single(img1_rot, img2_rot)
                pred_rot = np.rot90(pred_rot, -k)
                predictions.append(pred_rot)
        
        # Average predictions
        stacked = np.stack(predictions, axis=0)
        avg_pred = np.mean(stacked, axis=0)
        final_pred = (avg_pred > 0.5).astype(np.int64)
        
        return final_pred
    
    def _predict_single(self, img1_tensor, img2_tensor):
        """Single prediction"""
        with torch.no_grad():
            self.model.eval()
            # Ensure tensors are float32 to match model weights
            img1_tensor = img1_tensor.float()
            img2_tensor = img2_tensor.float()
            out = self.model(img1_tensor.unsqueeze(0), img2_tensor.unsqueeze(0))
            _, predicted = torch.max(out.data, 1)
        return predicted.numpy()[0]
