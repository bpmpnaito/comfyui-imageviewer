# src/nodes.py
import io
import base64

try:
    import torch
    import numpy as np
except ImportError:
    print("Warning: torch or numpy not available. This is expected if running outside ComfyUI.")

from PIL import Image

try:
    from server import PromptServer
except ImportError:
    print("Warning: PromptServer not available. This is expected if running outside ComfyUI.")
    PromptServer = None


class FullscreenPreview:
    """
    画像を受け取ってそのまま出力しつつ、
    プレビュー用 PNG をフロントエンドに送るノード。
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # 生成画像（バッチ）を受け取る
                "images": ("IMAGE", {}),
                # 同じノードを複数置いたときの識別用タグ
                "tag": ("STRING", {"default": "preview1"}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images_out",)
    FUNCTION = "preview"
    CATEGORY = "preview"

    def _tensor_to_base64_png(self, image_tensor) -> str:
        """
        [H,W,C] (0〜1 float) を PNG の base64 文字列に変換
        """
        try:
            # safetensors のまま GPU にいることもあるので CPU へ
            if hasattr(image_tensor, 'detach'):
                img = image_tensor.detach().cpu().clamp(0, 1)
            else:
                img = image_tensor

            # 0-255 uint8 に変換
            if hasattr(img, 'byte'):
                img_np = (img * 255).byte().numpy()
            else:
                # numpy array の場合
                img_np = (img * 255).astype('uint8')

            # PIL で PNG 化
            pil = Image.fromarray(img_np, mode="RGB")
            buf = io.BytesIO()
            pil.save(buf, format="PNG")
            png_bytes = buf.getvalue()
            return base64.b64encode(png_bytes).decode("ascii")
        except Exception as e:
            print(f"Error converting tensor to PNG: {e}")
            return ""

    def preview(self, images, tag):
        """
        images: [B,H,W,C] torch.Tensor or numpy array
        """
        try:
            # とりあえずバッチ先頭をプレビュー対象にする
            first = images[0]

            b64_png = self._tensor_to_base64_png(first)

            # フロントエンドへ同期メッセージ送信（ComfyUI環境でのみ）
            if PromptServer and hasattr(PromptServer, 'instance') and PromptServer.instance:
                # イベント名は名前空間っぽく "custom.fullscreenpreview.update"
                PromptServer.instance.send_sync(
                    "custom.fullscreenpreview.update",
                    {
                        "tag": tag,
                        "image": b64_png,
                    },
                )
            else:
                print(f"Preview for tag '{tag}': Base64 PNG generated (length: {len(b64_png)})")

            # 画像自体はそのまま次のノードへ
            return (images,)
        except Exception as e:
            print(f"Error in preview function: {e}")
            return (images,)


# ComfyUI にノードを登録
NODE_CLASS_MAPPINGS = {
    "FullscreenPreview": FullscreenPreview,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FullscreenPreview": "Fullscreen Preview",
}
