import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "ImageViewer",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageViewer") {
            console.log("ImageViewer node registered");
        }
    }
});