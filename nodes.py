import folder_paths
from PIL import Image
import numpy as np
import os

class ImageViewer:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"}
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "view_image"
    CATEGORY = "image"
    OUTPUT_NODE = True

    def view_image(self, images, filename_prefix="ComfyUI", prompt=None, extra_pnginfo=None):
        results = []
        temp_dir = folder_paths.get_temp_directory()

        for i, image in enumerate(images):
            i = 255. * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))

            # Generate filename similar to ComfyUI's PreviewImage
            full_output_folder, filename, counter, subfolder, filename_prefix = \
                folder_paths.get_save_image_path(filename_prefix, temp_dir, img.width, img.height)

            file = f"{filename}_{counter:05}_.png"
            img.save(os.path.join(full_output_folder, file), compress_level=1)

            results.append({
                "filename": file,
                "subfolder": subfolder,
                "type": "temp"
            })

        return {"ui": {"images": results}, "result": (images,)}

NODE_CLASS_MAPPINGS = {
    "ImageViewer": ImageViewer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageViewer": "Image Viewer"
}