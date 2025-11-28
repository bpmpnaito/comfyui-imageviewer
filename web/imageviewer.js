import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Global fullscreen overlay
let fullscreenOverlay = null;
let currentImageSrc = null;

function createFullscreenOverlay() {
    if (fullscreenOverlay) return;

    fullscreenOverlay = document.createElement("div");
    fullscreenOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.95);
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;

    const img = document.createElement("img");
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 8px;
    `;
    img.id = "fullscreen-viewer-image";

    const closeBtn = document.createElement("div");
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.2);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-family: Arial, sans-serif;
    `;
    closeBtn.textContent = "✕ Close";

    fullscreenOverlay.appendChild(img);
    fullscreenOverlay.appendChild(closeBtn);
    document.body.appendChild(fullscreenOverlay);

    // Click handlers
    fullscreenOverlay.addEventListener("click", (e) => {
        if (e.target === fullscreenOverlay) {
            hideFullscreen();
        }
    });

    closeBtn.addEventListener("click", hideFullscreen);

    // Escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && fullscreenOverlay.style.display !== "none") {
            hideFullscreen();
        }
    });
}

function showFullscreen(imageSrc) {
    createFullscreenOverlay();
    currentImageSrc = imageSrc;

    const img = document.getElementById("fullscreen-viewer-image");
    img.src = imageSrc;
    fullscreenOverlay.style.display = "flex";
}

function hideFullscreen() {
    if (fullscreenOverlay) {
        fullscreenOverlay.style.display = "none";
    }
}

app.registerExtension({
    name: "ImageViewer",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageViewer") {

            // Add right-click context menu for fullscreen
            const origGetExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                if (origGetExtraMenuOptions) {
                    origGetExtraMenuOptions.apply(this, arguments);
                }

                if (this.imgs && this.imgs.length > 0) {
                    options.push({
                        content: "🔍 View Fullscreen",
                        callback: () => {
                            const imageUrl = api.apiURL(`/view?filename=${this.imgs[0].filename}&type=${this.imgs[0].type}&subfolder=${this.imgs[0].subfolder || ""}`);
                            showFullscreen(imageUrl);
                        }
                    });
                }
            };

            // Handle execution results
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                onExecuted?.apply(this, arguments);
                if (message?.images) {
                    this.imgs = message.images;
                }
            };
        }
    }
});