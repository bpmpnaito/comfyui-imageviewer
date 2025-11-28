import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
    name: "ImageViewer",

    async setup() {
        // Create global click handler for images
        const style = document.createElement("style");
        style.textContent = `
            .imageviewer-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0,0,0,0.9) !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
            }
            .imageviewer-image {
                max-width: 90% !important;
                max-height: 90% !important;
                object-fit: contain !important;
                border: 2px solid white !important;
            }
        `;
        document.head.appendChild(style);

        // Add click listener to all images
        document.addEventListener("click", (e) => {
            if (e.target.tagName === "IMG" && e.target.src.includes("/view?")) {
                this.showFullscreen(e.target.src);
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    showFullscreen(src) {
        // Remove existing overlay
        const existing = document.querySelector(".imageviewer-overlay");
        if (existing) existing.remove();

        // Create new overlay
        const overlay = document.createElement("div");
        overlay.className = "imageviewer-overlay";

        const img = document.createElement("img");
        img.className = "imageviewer-image";
        img.src = src;

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Click to close
        overlay.addEventListener("click", () => {
            overlay.remove();
        });

        // ESC to close
        const escHandler = (e) => {
            if (e.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", escHandler);
            }
        };
        document.addEventListener("keydown", escHandler);
    },

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageViewer") {
            console.log("ImageViewer: Node registered, click any image to view fullscreen");
        }
    }
});