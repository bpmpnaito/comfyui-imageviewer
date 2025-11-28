import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Global overlay for fullscreen
let fullscreenOverlay = null;

function createFullscreenOverlay() {
    if (fullscreenOverlay) return;

    fullscreenOverlay = document.createElement("div");
    fullscreenOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;

    const img = document.createElement("img");
    img.style.cssText = `
        max-width: 95%;
        max-height: 95%;
        object-fit: contain;
        border: 2px solid white;
    `;
    img.id = "fullscreen-image";

    fullscreenOverlay.appendChild(img);
    document.body.appendChild(fullscreenOverlay);

    fullscreenOverlay.addEventListener("click", () => {
        fullscreenOverlay.style.display = "none";
    });
}

function showFullscreen(imageUrl) {
    createFullscreenOverlay();
    const img = document.getElementById("fullscreen-image");
    img.src = imageUrl;
    fullscreenOverlay.style.display = "flex";
}

app.registerExtension({
    name: "ImageViewer",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageViewer") {
            // Add fullscreen button widget
            nodeType.prototype.onNodeCreated = function() {
                this.addWidget("button", "📺 View Fullscreen", null, () => {
                    if (this.currentImageUrl) {
                        showFullscreen(this.currentImageUrl);
                    }
                });
            };

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
                    const y = this.size[1] - 250;
                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                    ctx.fillRect(0, y, this.size[0], 250);

                    ctx.fillStyle = "white";
                    ctx.font = "12px sans-serif";
                    ctx.fillText(`Preview: ${this.imgs.length} image(s)`, 10, y + 20);

                    if (this.imgs[0]) {
                        const img_url = api.apiURL(`/view?filename=${this.imgs[0].filename}&type=${this.imgs[0].type}&subfolder=${this.imgs[0].subfolder}`);

                        if (!this.previewImg || this.previewImg.src !== img_url) {
                            this.previewImg = new Image();
                            this.previewImg.onload = () => app.graph.setDirtyCanvas(true);
                            this.previewImg.src = img_url;
                        }

                        if (this.previewImg.complete) {
                            const imgW = 180;
                            const imgH = 150;
                            const x = (this.size[0] - imgW) / 2;

                            ctx.drawImage(this.previewImg, x, y + 30, imgW, imgH);

                            // Store current image URL
                            this.currentImageUrl = img_url;
                        }
                    }
                }
            };

        }
    }
});