This software provides an implementation for detecting changes between satellite image pairs using deep learning.

The algorithm can be executed by running the function compute_map in main.py. It takes as input two color images in PNG format. Both images should
be satellites images of the same area, and co-registered. It works best on images from the Sentinel-2 satellite. If both images do not have the same size, the images will be automatically cropped. The demo expects values stored on 8 bits. If the input images do not match this requirement, the images will be converted to 8 bit.
The output image is a change map. For each pixel in the input images, the value of the change map is 1 if a change is detected and 0 otherwise.

The network weights are in the file "fresunet3_final.pth.tar" and the network architecture is in the file "fresunet.py".
