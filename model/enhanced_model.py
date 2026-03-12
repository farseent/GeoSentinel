"""
Enhanced FresUNet with Attention Mechanisms for Improved Change Detection
This module provides improved architectures for better accuracy.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.nn.modules.padding import ReplicationPad2d


class AttentionBlock(nn.Module):
    """Attention mechanism to focus on relevant features"""
    
    def __init__(self, F_g, F_l, F_int):
        super(AttentionBlock, self).__init__()
        self.W_g = nn.Sequential(
            nn.Conv2d(F_g, F_int, kernel_size=1, stride=1, padding=0, bias=True),
            nn.BatchNorm2d(F_int)
        )
        
        self.W_x = nn.Sequential(
            nn.Conv2d(F_l, F_int, kernel_size=1, stride=1, padding=0, bias=True),
            nn.BatchNorm2d(F_int)
        )
        
        self.psi = nn.Sequential(
            nn.Conv2d(F_int, 1, kernel_size=1, stride=1, padding=0, bias=True),
            nn.BatchNorm2d(1),
            nn.Sigmoid()
        )
        
        self.relu = nn.ReLU(inplace=True)
        
    def forward(self, g, x):
        g1 = self.W_g(g)
        x1 = self.W_x(x)
        psi = self.relu(g1 + x1)
        psi = self.psi(psi)
        return x * psi


class ChannelAttention(nn.Module):
    """Channel attention mechanism"""
    
    def __init__(self, channels, reduction=16):
        super(ChannelAttention, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        
        self.fc = nn.Sequential(
            nn.Conv2d(channels, channels // reduction, 1, bias=False),
            nn.ReLU(),
            nn.Conv2d(channels // reduction, channels, 1, bias=False)
        )
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        out = avg_out + max_out
        return self.sigmoid(out)


class SpatialAttention(nn.Module):
    """Spatial attention mechanism"""
    
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()
        padding = kernel_size // 2
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x = torch.cat([avg_out, max_out], dim=1)
        x = self.conv(x)
        return self.sigmoid(x)


class CBAM(nn.Module):
    """Convolutional Block Attention Module"""
    
    def __init__(self, channels, reduction=16):
        super(CBAM, self).__init__()
        self.channel_attention = ChannelAttention(channels, reduction)
        self.spatial_attention = SpatialAttention()
        
    def forward(self, x):
        x = x * self.channel_attention(x)
        x = x * self.spatial_attention(x)
        return x


def conv3x3(in_planes, out_planes, stride=1):
    """3x3 convolution with padding"""
    return nn.Conv2d(in_planes, out_planes, kernel_size=3, stride=stride, padding=1)


class ImprovedBasicBlock_ss(nn.Module):
    """Enhanced residual block with attention for subsampling"""
    
    def __init__(self, inplanes, planes=None, subsamp=1, use_attention=True):
        super(ImprovedBasicBlock_ss, self).__init__()
        if planes is None:
            planes = inplanes * subsamp
        
        self.conv1 = conv3x3(inplanes, planes)
        self.bn1 = nn.BatchNorm2d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = conv3x3(planes, planes)
        self.bn2 = nn.BatchNorm2d(planes)
        self.subsamp = subsamp
        self.doit = planes != inplanes
        
        if self.doit:
            self.couple = nn.Conv2d(inplanes, planes, kernel_size=1)
            self.bnc = nn.BatchNorm2d(planes)
        
        # Add attention mechanism
        self.use_attention = use_attention
        if use_attention:
            self.attention = CBAM(planes)
    
    def forward(self, x):
        if self.doit:
            residual = self.couple(x)
            residual = self.bnc(residual)
        else:
            residual = x
        
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        
        if self.subsamp > 1:
            out = F.max_pool2d(out, kernel_size=self.subsamp, stride=self.subsamp)
            residual = F.max_pool2d(residual, kernel_size=self.subsamp, stride=self.subsamp)
        
        out = self.conv2(out)
        out = self.bn2(out)
        
        if self.use_attention:
            out = self.attention(out)
        
        out += residual
        out = self.relu(out)
        
        return out


class ImprovedBasicBlock_us(nn.Module):
    """Enhanced residual block with attention for upsampling"""
    
    def __init__(self, inplanes, upsamp=1, use_attention=True):
        super(ImprovedBasicBlock_us, self).__init__()
        planes = int(inplanes / upsamp)
        
        self.conv1 = nn.ConvTranspose2d(inplanes, planes, kernel_size=3, padding=1, 
                                        stride=upsamp, output_padding=1)
        self.bn1 = nn.BatchNorm2d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = conv3x3(planes, planes)
        self.bn2 = nn.BatchNorm2d(planes)
        self.upsamp = upsamp
        self.couple = nn.ConvTranspose2d(inplanes, planes, kernel_size=3, padding=1, 
                                         stride=upsamp, output_padding=1)
        self.bnc = nn.BatchNorm2d(planes)
        
        # Add attention mechanism
        self.use_attention = use_attention
        if use_attention:
            self.attention = CBAM(planes)
    
    def forward(self, x):
        residual = self.couple(x)
        residual = self.bnc(residual)
        
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        
        out = self.conv2(out)
        out = self.bn2(out)
        
        if self.use_attention:
            out = self.attention(out)
        
        out += residual
        out = self.relu(out)
        
        return out


class EnhancedFresUNet(nn.Module):
    """
    Enhanced FresUNet with Attention Mechanisms
    
    Improvements over original FresUNet:
    1. Channel and Spatial Attention (CBAM)
    2. Attention gates in skip connections
    3. Deeper base depth for better feature extraction
    4. Optional dropout for regularization
    """
    
    def __init__(self, input_nbr=6, label_nbr=2, base_depth=16, use_attention=True, dropout=0.1):
        super(EnhancedFresUNet, self).__init__()
        
        self.input_nbr = input_nbr
        self.use_attention = use_attention
        
        cur_depth = input_nbr
        
        # Encoding stage 1
        self.encres1_1 = ImprovedBasicBlock_ss(cur_depth, planes=base_depth, use_attention=use_attention)
        cur_depth = base_depth
        d1 = base_depth
        self.encres1_2 = ImprovedBasicBlock_ss(cur_depth, subsamp=2, use_attention=use_attention)
        cur_depth *= 2
        
        # Encoding stage 2
        self.encres2_1 = ImprovedBasicBlock_ss(cur_depth, use_attention=use_attention)
        d2 = cur_depth
        self.encres2_2 = ImprovedBasicBlock_ss(cur_depth, subsamp=2, use_attention=use_attention)
        cur_depth *= 2
        
        # Encoding stage 3
        self.encres3_1 = ImprovedBasicBlock_ss(cur_depth, use_attention=use_attention)
        d3 = cur_depth
        self.encres3_2 = ImprovedBasicBlock_ss(cur_depth, subsamp=2, use_attention=use_attention)
        cur_depth *= 2
        
        # Encoding stage 4
        self.encres4_1 = ImprovedBasicBlock_ss(cur_depth, use_attention=use_attention)
        d4 = cur_depth
        self.encres4_2 = ImprovedBasicBlock_ss(cur_depth, subsamp=2, use_attention=use_attention)
        cur_depth *= 2
        
        # Attention gates for skip connections
        if use_attention:
            self.att4 = AttentionBlock(F_g=cur_depth//2, F_l=d4, F_int=d4//2)
            self.att3 = AttentionBlock(F_g=cur_depth//4, F_l=d3, F_int=d3//2)
            self.att2 = AttentionBlock(F_g=cur_depth//8, F_l=d2, F_int=d2//2)
            self.att1 = AttentionBlock(F_g=cur_depth//16, F_l=d1, F_int=d1//2)
        
        # Decoding stage 4
        self.decres4_1 = ImprovedBasicBlock_ss(cur_depth, use_attention=use_attention)
        self.decres4_2 = ImprovedBasicBlock_us(cur_depth, upsamp=2, use_attention=use_attention)
        cur_depth = int(cur_depth/2)
        
        # Decoding stage 3
        self.decres3_1 = ImprovedBasicBlock_ss(cur_depth + d4, planes=cur_depth, use_attention=use_attention)
        self.decres3_2 = ImprovedBasicBlock_us(cur_depth, upsamp=2, use_attention=use_attention)
        cur_depth = int(cur_depth/2)
        
        # Decoding stage 2
        self.decres2_1 = ImprovedBasicBlock_ss(cur_depth + d3, planes=cur_depth, use_attention=use_attention)
        self.decres2_2 = ImprovedBasicBlock_us(cur_depth, upsamp=2, use_attention=use_attention)
        cur_depth = int(cur_depth/2)
        
        # Decoding stage 1
        self.decres1_1 = ImprovedBasicBlock_ss(cur_depth + d2, planes=cur_depth, use_attention=use_attention)
        self.decres1_2 = ImprovedBasicBlock_us(cur_depth, upsamp=2, use_attention=use_attention)
        cur_depth = int(cur_depth/2)
        
        # Optional dropout for regularization
        self.dropout = nn.Dropout2d(dropout) if dropout > 0 else None
        
        # Output
        self.coupling = nn.Conv2d(cur_depth + d1, label_nbr, kernel_size=1)
        self.sm = nn.LogSoftmax(dim=1)
        
    def forward(self, x1, x2):
        x = torch.cat((x1, x2), 1)
        
        # Encoder
        s1_1 = x.size()
        x1_enc = self.encres1_1(x)
        x = self.encres1_2(x1_enc)
        
        s2_1 = x.size()
        x2_enc = self.encres2_1(x)
        x = self.encres2_2(x2_enc)
        
        s3_1 = x.size()
        x3_enc = self.encres3_1(x)
        x = self.encres3_2(x3_enc)
        
        s4_1 = x.size()
        x4_enc = self.encres4_1(x)
        x = self.encres4_2(x4_enc)
        
        # Decoder with attention
        x = self.decres4_1(x)
        x = self.decres4_2(x)
        s4_2 = x.size()
        pad4 = ReplicationPad2d((0, s4_1[3] - s4_2[3], 0, s4_1[2] - s4_2[2]))
        x = pad4(x)
        
        # Apply attention to skip connection
        if self.use_attention:
            x4_enc = self.att4(g=x, x=x4_enc)
        x = self.decres3_1(torch.cat((x, x4_enc), 1))
        x = self.decres3_2(x)
        s3_2 = x.size()
        pad3 = ReplicationPad2d((0, s3_1[3] - s3_2[3], 0, s3_1[2] - s3_2[2]))
        x = pad3(x)
        
        if self.use_attention:
            x3_enc = self.att3(g=x, x=x3_enc)
        x = self.decres2_1(torch.cat((x, x3_enc), 1))
        x = self.decres2_2(x)
        s2_2 = x.size()
        pad2 = ReplicationPad2d((0, s2_1[3] - s2_2[3], 0, s2_1[2] - s2_2[2]))
        x = pad2(x)
        
        if self.use_attention:
            x2_enc = self.att2(g=x, x=x2_enc)
        x = self.decres1_1(torch.cat((x, x2_enc), 1))
        x = self.decres1_2(x)
        s1_2 = x.size()
        pad1 = ReplicationPad2d((0, s1_1[3] - s1_2[3], 0, s1_1[2] - s1_2[2]))
        x = pad1(x)
        
        if self.dropout:
            x = self.dropout(x)
        
        if self.use_attention:
            x1_enc = self.att1(g=x, x=x1_enc)
        x = self.coupling(torch.cat((x, x1_enc), 1))
        x = self.sm(x)
        
        return x
