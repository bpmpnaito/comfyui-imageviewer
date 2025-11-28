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
    OUTPUT_NODE = True

    def view_image(self, images):
        # ComfyUI standard preview format
        from folder_paths import get_temp_directory
        import os
        import random

        results = []
        temp_dir = get_temp_directory()

        for i, image in enumerate(images):
            # Convert from [H,W,C] tensor (0-1) to PIL Image
            img_array = image.cpu().numpy()
            img_array = (img_array * 255).astype(np.uint8)
            pil_image = Image.fromarray(img_array)

            # Save to temp directory
            filename = f"{random.randint(10000, 99999)}_{i}.png"
            filepath = os.path.join(temp_dir, filename)
            pil_image.save(filepath)

            results.append({
                "filename": filename,
                "subfolder": "",
                "type": "temp"
            })

        return {"ui": {"images": results}, "result": (images,)}

NODE_CLASS_MAPPINGS = {
    "ImageViewer": ImageViewer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageViewer": "Image Viewer"
}