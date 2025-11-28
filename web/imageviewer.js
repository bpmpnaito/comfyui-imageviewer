import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "ImageViewer",

    setup() {
        // Create fullscreen overlay once
        this.overlay = document.createElement("div");
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        `;

        this.overlayImg = document.createElement("img");
        this.overlayImg.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
        `;

        this.overlay.appendChild(this.overlayImg);
        document.body.appendChild(this.overlay);

        this.overlay.addEventListener("click", () => {
            this.overlay.style.display = "none";
        });
    },

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageViewer") {
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                onExecuted?.apply(this, arguments);

                if (message?.images) {
                    this.imgs = message.images;
                    app.graph.setDirtyCanvas(true);
                }
            };

            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                if (onDrawBackground) {
                    onDrawBackground.apply(this, arguments);
                }

                if (this.imgs && this.imgs.length > 0) {
                    const y = this.size[1] - 220;
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(0, y, this.size[0], 220);

                    ctx.fillStyle = "white";
                    ctx.font = "12px sans-serif";
                    ctx.fillText(`Preview: ${this.imgs.length} image(s) - Click to view fullscreen`, 10, y + 20);

                    if (this.imgs[0]) {
                        const img_url = api.apiURL(`/view?filename=${this.imgs[0].filename}&type=${this.imgs[0].type}&subfolder=${this.imgs[0].subfolder}`);

                        if (!this.previewImg || this.previewImg.src !== img_url) {
                            this.previewImg = new Image();
                            this.previewImg.onload = () => app.graph.setDirtyCanvas(true);
                            this.previewImg.src = img_url;
                        }

                        if (this.previewImg.complete) {
                            const imgW = 180;
                            const imgH = 180;
                            const x = (this.size[0] - imgW) / 2;
                            ctx.drawImage(this.previewImg, x, y + 30, imgW, imgH);

                            // Store image rect for click detection
                            this.imageRect = [x, y + 30, imgW, imgH];
                            this.currentImageUrl = img_url;
                        }
                    }
                }
            };

            const onMouseDown = nodeType.prototype.onMouseDown;
            nodeType.prototype.onMouseDown = function(event, localPos, canvas) {
                if (this.imageRect && this.currentImageUrl) {
                    const [x, y, w, h] = this.imageRect;
                    if (localPos[0] >= x && localPos[0] <= x + w &&
                        localPos[1] >= y && localPos[1] <= y + h) {
                        // Click on image - show fullscreen
                        const ext = app.extensions.find(ext => ext.name === "ImageViewer");
                        ext.overlayImg.src = this.currentImageUrl;
                        ext.overlay.style.display = "flex";
                        return true; // Consume the event
                    }
                }
                return onMouseDown ? onMouseDown.call(this, event, localPos, canvas) : false;
            };
        }
    }
});