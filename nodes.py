import torch
import numpy as np
from PIL import Image
import io
import base64

class ImageViewer:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "view_image"
    CATEGORY = "image"

    def view_image(self, images):
        return (images,)

NODE_CLASS_MAPPINGS = {
    "ImageViewer": ImageViewer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageViewer": "Image Viewer"
}