// web/js/fullscreen_preview.js
import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "custom.fullscreenpreview",

    async setup() {
        let overlay = null;
        let overlayImg = null;

        function ensureOverlay() {
            if (overlay) return;

            overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.left = "0";
            overlay.style.top = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.background = "rgba(0,0,0,0.8)";
            overlay.style.display = "none";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.zIndex = "9999";
            overlay.style.cursor = "zoom-out";

            overlayImg = document.createElement("img");
            overlayImg.style.maxWidth = "95%";
            overlayImg.style.maxHeight = "95%";
            overlayImg.style.boxShadow = "0 0 30px rgba(0,0,0,0.7)";
            overlay.appendChild(overlayImg);

            // どこをクリックしても閉じる
            overlay.addEventListener("click", () => {
                overlay.style.display = "none";
            });

            document.body.appendChild(overlay);
        }

        function showOverlay(src) {
            ensureOverlay();
            overlayImg.src = src;
            overlay.style.display = "flex";
        }

        function hideOverlay() {
            if (!overlay) return;
            overlay.style.display = "none";
        }

        // Python 側からの画像更新イベントを購読
        app.api.addEventListener("custom.fullscreenpreview.update", (event) => {
            try {
                const { tag, image } = event.detail;
                if (!image) {
                    console.warn("FullscreenPreview: No image data received");
                    return;
                }

                const dataUrl = `data:image/png;base64,${image}`;

                const graph = app.graph;
                if (!graph || !graph._nodes) return;

                let updated = false;
                // ノードの tag ウィジェットとマッチするものだけを更新
                for (const node of graph._nodes) {
                    if (node.comfyClass !== "FullscreenPreview") continue;
                    const widget = node.widgets?.find((w) => w.name === "tag");
                    if (!widget || widget.value !== tag) continue;

                    node.__fullscreenPreviewSrc = dataUrl;
                    node.setDirtyCanvas(true); // 再描画
                    updated = true;
                }

                if (!updated) {
                    console.warn(`FullscreenPreview: No node found with tag "${tag}"`);
                }

                // もしオーバーレイが表示中なら、フルサイズも更新
                if (overlay && overlay.style.display !== "none") {
                    overlayImg.src = dataUrl;
                }
            } catch (error) {
                console.error("FullscreenPreview: Error processing update event", error);
            }
        });

        // ノード前面描画フック: サムネイル表示
        const origOnDrawForeground = LiteGraph.LGraphNode.prototype.onDrawForeground;
        LiteGraph.LGraphNode.prototype.onDrawForeground = function (ctx) {
            if (this.comfyClass === "FullscreenPreview" && this.__fullscreenPreviewSrc) {
                try {
                    if (!this.__thumbImg || this.__thumbImg.src !== this.__fullscreenPreviewSrc) {
                        this.__thumbImg = new Image();
                        this.__thumbImg.onload = () => {
                            this.setDirtyCanvas(true);
                        };
                        this.__thumbImg.onerror = () => {
                            console.error("FullscreenPreview: Failed to load thumbnail image");
                        };
                        this.__thumbImg.src = this.__fullscreenPreviewSrc;
                    }

                    // 画像が読み込まれていない場合は何も描画しない
                    if (!this.__thumbImg.complete) {
                        return;
                    }

                    const size = 80;
                    const padding = 8;
                    const x = padding;
                    const y = this.size[1] - size - padding;

                    // 角丸サムネイル
                    ctx.save();
                    if (ctx.roundRect) {
                        ctx.beginPath();
                        ctx.roundRect(x, y, size, size, 6);
                        ctx.clip();
                    }
                    ctx.drawImage(this.__thumbImg, x, y, size, size);
                    ctx.restore();

                    // クリック判定用の矩形を記録（ノード座標系）
                    this.__thumbRect = [x, y, size, size];
                } catch (error) {
                    console.error("FullscreenPreview: Error drawing thumbnail", error);
                }
            }

            if (origOnDrawForeground) {
                origOnDrawForeground.apply(this, arguments);
            }
        };

        // マウスダウンフック: サムネイルクリックでフルスクリーン表示
        const origProcessMouseDown = LiteGraph.LGraphCanvas.prototype.processMouseDown;
        LiteGraph.LGraphCanvas.prototype.processMouseDown = function (e) {
            const res = origProcessMouseDown.apply(this, arguments);

            const graph = this.graph;
            if (!graph) return res;

            const [mx, my] = this.graph_mouse;
            const node = graph.getNodeOnPos(mx, my, this.visible_area);
            if (!node || node.comfyClass !== "FullscreenPreview") {
                return res;
            }

            if (!node.__thumbRect || !node.__fullscreenPreviewSrc) {
                return res;
            }

            const [x, y, w, h] = node.__thumbRect;

            // キャンバス座標とノード内座標の関係を補正
            const localX = mx - node.pos[0];
            const localY = my - node.pos[1];

            if (localX >= x && localX <= x + w && localY >= y && localY <= y + h) {
                // サムネイルクリック → フルサイズ表示
                showOverlay(node.__fullscreenPreviewSrc);
            }

            return res;
        };

        ensureOverlay();
    },
});
